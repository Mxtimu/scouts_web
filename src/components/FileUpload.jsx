import React, { useState, useRef, useCallback } from 'react'
import { Upload, X, Image, FileText, AlertCircle } from 'lucide-react'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'application/pdf']
const MAX_MB = 10

function FilePreview({ file, onRemove }) {
  const isImage = file.type.startsWith('image/')
  const [preview, setPreview] = React.useState(null)

  React.useEffect(() => {
    if (!isImage) return
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, isImage])

  return (
    <div className="group relative overflow-hidden rounded-xl border border-scout-border bg-scout-surface transition hover:border-scout-muted">
      {isImage && preview ? (
        <img src={preview} alt={file.name} className="h-24 w-full object-cover" />
      ) : (
        <div className="flex h-24 w-full items-center justify-center bg-scout-card">
          <FileText size={24} className="text-slate-500" />
        </div>
      )}
      <div className="border-t border-scout-border px-2 py-1.5">
        <p className="truncate text-[10px] text-slate-400">{file.name}</p>
        <p className="text-[10px] text-slate-600">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
      </div>
      <button
        onClick={() => onRemove(file)}
        className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-500"
        aria-label={`Remove ${file.name}`}
      >
        <X size={10} strokeWidth={2.5} />
      </button>
    </div>
  )
}

export default function FileUpload({ onFilesChange }) {
  const [files, setFiles]       = useState([])
  const [dragging, setDragging] = useState(false)
  const [error, setError]       = useState(null)
  const inputRef                = useRef(null)

  const addFiles = useCallback((incoming) => {
    setError(null)
    const valid = []
    for (const f of incoming) {
      if (!ACCEPTED.includes(f.type)) { setError(`${f.name} is not a supported file type.`); continue }
      if (f.size > MAX_MB * 1024 * 1024) { setError(`${f.name} exceeds ${MAX_MB} MB.`); continue }
      valid.push(f)
    }
    setFiles(prev => {
      const merged = [...prev, ...valid]
      onFilesChange?.(merged)
      return merged
    })
  }, [onFilesChange])

  const removeFile = useCallback((target) => {
    setFiles(prev => {
      const next = prev.filter(f => f !== target)
      onFilesChange?.(next)
      return next
    })
  }, [onFilesChange])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 text-center transition-all ${
          dragging
            ? 'border-scout-accent bg-scout-accent/5 scale-[1.01]'
            : 'border-scout-border bg-scout-surface hover:border-scout-muted hover:bg-scout-card/50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="hidden"
          onChange={e => addFiles(Array.from(e.target.files))}
        />
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${dragging ? 'bg-scout-accent/20' : 'bg-scout-card'}`}>
          {dragging ? <Image size={20} className="text-scout-accent" /> : <Upload size={20} className="text-slate-400" />}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-300">
            {dragging ? 'Drop to upload' : 'Drop files here, or click to browse'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">PNG, JPG, GIF, WEBP, PDF · max {MAX_MB} MB each</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-400">
          <AlertCircle size={12} />
          {error}
        </div>
      )}

      {/* Previews grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {files.map((f, i) => (
            <FilePreview key={`${f.name}-${i}`} file={f} onRemove={removeFile} />
          ))}
        </div>
      )}
    </div>
  )
}
