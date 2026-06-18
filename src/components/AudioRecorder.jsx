import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, Square, Play, Pause, Trash2, Check, AlertCircle } from 'lucide-react'

const MAX_DURATION = 180  // 3 minutes

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function getBestMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]
  if (typeof MediaRecorder === 'undefined') return ''
  return candidates.find(t => MediaRecorder.isTypeSupported(t)) ?? ''
}

export default function AudioRecorder({ onRecordingChange }) {
  const [phase, setPhase]       = useState('idle')
  const [elapsed, setElapsed]   = useState(0)
  const [duration, setDuration] = useState(0)
  const [playPos, setPlayPos]   = useState(0)
  const [bars, setBars]         = useState(Array(20).fill(4))
  const [errMsg, setErrMsg]     = useState(null)

  const mediaRecorderRef = useRef(null)
  const audioRef         = useRef(null)
  const timerRef         = useRef(null)
  const chunksRef        = useRef([])
  const analyserRef      = useRef(null)
  const animFrameRef     = useRef(null)
  const blobUrlRef       = useRef(null)
  const audioCtxRef      = useRef(null)
  const elapsedRef       = useRef(0)  // mirror for auto-stop callback

  const animateBars = useCallback(() => {
    if (!analyserRef.current) return
    const data = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(data)
    const step = Math.max(1, Math.floor(data.length / 20))
    const next = Array.from({ length: 20 }, (_, i) => {
      const v = data[Math.min(i * step, data.length - 1)] / 255
      return Math.max(3, Math.round(v * 36))
    })
    setBars(next)
    animFrameRef.current = requestAnimationFrame(animateBars)
  }, [])

  const stopRecording = useCallback(() => {
    clearInterval(timerRef.current)
    setDuration(elapsedRef.current)
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const startRecording = async () => {
    setErrMsg(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const ctx      = new AudioContext()
      audioCtxRef.current = ctx
      const source   = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)
      analyserRef.current = analyser

      chunksRef.current = []
      const mimeType = getBestMimeType()
      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {})

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      mr.onstop = () => {
        stream.getTracks().forEach(t => t.stop())
        cancelAnimationFrame(animFrameRef.current)
        setBars(Array(20).fill(4))

        const blob = new Blob(chunksRef.current, { type: mr.mimeType || mimeType || 'audio/webm' })
        if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
        blobUrlRef.current = URL.createObjectURL(blob)

        if (audioRef.current) {
          audioRef.current.src = blobUrlRef.current
          audioRef.current.load()
          audioRef.current.onloadedmetadata = () => {
            const d = audioRef.current.duration
            if (Number.isFinite(d)) setDuration(Math.ceil(d))
          }
        }

        onRecordingChange?.(blob)
        setPhase('recorded')
      }

      mr.start(100)
      mediaRecorderRef.current = mr

      elapsedRef.current = 0
      setElapsed(0)
      setPhase('recording')

      timerRef.current = setInterval(() => {
        elapsedRef.current += 1
        setElapsed(elapsedRef.current)
        if (elapsedRef.current >= MAX_DURATION) {
          stopRecording()
        }
      }, 1000)

      animateBars()
    } catch (err) {
      setErrMsg(
        err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
          ? 'Microphone access denied — please allow it in your browser settings.'
          : `Couldn't start recording: ${err.message}`
      )
    }
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (phase === 'playing') {
      audioRef.current.pause()
      setPhase('recorded')
    } else {
      audioRef.current.play().catch(() => {})
      setPhase('playing')
    }
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime  = () => setPlayPos(audio.currentTime)
    const onEnded = () => { setPhase('recorded'); setPlayPos(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const discard = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = '' }
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null }
    if (audioCtxRef.current) { audioCtxRef.current.close(); audioCtxRef.current = null }
    onRecordingChange?.(null)
    elapsedRef.current = 0
    setElapsed(0); setPlayPos(0); setDuration(0)
    setBars(Array(20).fill(4))
    setPhase('idle')
  }

  useEffect(() => () => {
    clearInterval(timerRef.current)
    cancelAnimationFrame(animFrameRef.current)
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
    if (audioCtxRef.current) audioCtxRef.current.close()
  }, [])

  const remaining    = MAX_DURATION - elapsed
  const nearLimit    = elapsed >= MAX_DURATION - 30
  const playProgress = duration > 0 ? (playPos / duration) * 100 : 0

  return (
    <div className="rounded-xl border border-scout-border bg-scout-surface p-4">
      <audio ref={audioRef} className="hidden" />

      {phase === 'idle' && (
        <div className="flex flex-col items-center gap-3 py-2">
          {errMsg && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
              <AlertCircle size={12} />{errMsg}
            </div>
          )}
          <button
            onClick={startRecording}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-scout-accent shadow-lg shadow-scout-accent/30 transition hover:scale-105 hover:opacity-90 active:scale-95"
            aria-label="Start recording"
          >
            <Mic size={22} className="text-white" />
          </button>
          <p className="text-xs text-slate-500">Tap to record · max 3 minutes</p>
        </div>
      )}

      {phase === 'recording' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-semibold text-rose-400">
              <span className="h-2 w-2 animate-pulse rounded-full bg-rose-400" />
              Recording
            </span>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-sm ${nearLimit ? 'text-amber-400' : 'text-white'}`}>
                {formatTime(elapsed)}
              </span>
              <span className={`text-xs ${nearLimit ? 'text-amber-400' : 'text-slate-500'}`}>
                / {formatTime(MAX_DURATION)}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full overflow-hidden rounded-full bg-scout-muted">
            <div
              className={`h-full rounded-full transition-all ${nearLimit ? 'bg-amber-400' : 'bg-scout-accent'}`}
              style={{ width: `${(elapsed / MAX_DURATION) * 100}%` }}
            />
          </div>

          {nearLimit && (
            <p className="text-center text-xs text-amber-400">
              {remaining}s remaining — recording stops at 3 minutes
            </p>
          )}

          <div className="flex h-10 items-end justify-center gap-0.5">
            {bars.map((h, i) => (
              <div
                key={i}
                className="w-1.5 rounded-full bg-scout-accent transition-all duration-75"
                style={{ height: `${h}px` }}
              />
            ))}
          </div>

          <button
            onClick={stopRecording}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 py-2.5 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
          >
            <Square size={14} strokeWidth={2.5} />
            Stop recording
          </button>
        </div>
      )}

      {(phase === 'recorded' || phase === 'playing') && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-scout-accent shadow shadow-scout-accent/20 transition hover:opacity-90"
              aria-label={phase === 'playing' ? 'Pause' : 'Play'}
            >
              {phase === 'playing'
                ? <Pause size={16} className="text-white" />
                : <Play  size={16} className="text-white" />}
            </button>

            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-scout-muted">
                <div
                  className="h-full rounded-full bg-scout-accent transition-all"
                  style={{ width: `${playProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>{formatTime(Math.floor(playPos))}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <button
              onClick={discard}
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
              aria-label="Discard recording"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
            <Check size={12} className="text-emerald-400" strokeWidth={2.5} />
            <span className="text-xs text-emerald-400">Voice note ready to submit</span>
          </div>
        </div>
      )}
    </div>
  )
}
