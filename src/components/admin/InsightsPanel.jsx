import React, { useState, useEffect, useMemo } from 'react'
import {
  Loader2, AlertCircle, Users, FileText, CheckCircle2, Search, Download,
  ChevronDown, ChevronUp, Award, Gauge,
} from 'lucide-react'
import { getCodingEvidence, getScoutRoster, getScoutDetail } from '../../services/insights'
import { exportToCsv } from '../../utils/csvExport'
import { FrequencyBarChart, StatusDonutChart } from './InsightsCharts'

// Counts occurrences of a field's value(s) across rows. `isArray: true` for
// multi-select columns (money_utilities, passion_categories, access_barriers).
function countBy(rows, key, { isArray = false } = {}) {
  const counts = new Map()
  for (const row of rows) {
    const values = isArray ? (row[key] || []) : [row[key]].filter(Boolean)
    for (const v of values) counts.set(v, (counts.get(v) || 0) + 1)
  }
  return Array.from(counts, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
}

function KpiTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-scout-border bg-scout-card px-4 py-3">
      <div className="flex items-center gap-2 text-scout-text-muted">
        <Icon size={13} />
        <p className="text-[11px] font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className="mt-1.5 text-2xl font-bold text-white">{value}</p>
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <div className="rounded-2xl border border-scout-border bg-scout-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  )
}

function ExportButton({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-scout-border px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white">
      <Download size={12} /> Export CSV
    </button>
  )
}

export default function InsightsPanel() {
  const [evidence, setEvidence] = useState(null)
  const [roster, setRoster]     = useState(null)
  const [totals, setTotals]     = useState(null)
  const [error, setError]       = useState(null)

  const [filterMission, setFilterMission]   = useState('all')
  const [filterBank, setFilterBank]         = useState('all')
  const [filterQuality, setFilterQuality]   = useState('all')
  const [expandedRow, setExpandedRow]       = useState(null)

  const [selectedScout, setSelectedScout]   = useState('')
  const [scoutDetail, setScoutDetail]       = useState(null)
  const [scoutDetailLoading, setScoutDetailLoading] = useState(false)
  const [scoutDetailError, setScoutDetailError]     = useState(null)

  useEffect(() => {
    Promise.all([getCodingEvidence(), getScoutRoster()])
      .then(([ev, { roster: r, totalSubmissions, publishedMissionCount }]) => {
        setEvidence(ev)
        setRoster(r)
        setTotals({ totalSubmissions, publishedMissionCount })
      })
      .catch(err => setError(err.message || 'Could not load insights data.'))
  }, [])

  useEffect(() => {
    if (!selectedScout) { setScoutDetail(null); return }
    setScoutDetailLoading(true)
    setScoutDetailError(null)
    getScoutDetail(selectedScout)
      .then(setScoutDetail)
      .catch(err => setScoutDetailError(err.message || 'Could not load this scout.'))
      .finally(() => setScoutDetailLoading(false))
  }, [selectedScout])

  const missionIds = useMemo(
    () => evidence ? Array.from(new Set(evidence.map(e => e.mission_id))).sort() : [],
    [evidence]
  )

  const filteredEvidence = useMemo(() => {
    if (!evidence) return []
    return evidence.filter(e =>
      (filterMission === 'all' || e.mission_id === filterMission) &&
      (filterBank === 'all' || e.bank_permission === filterBank) &&
      (filterQuality === 'all' || e.quality === filterQuality)
    )
  }, [evidence, filterMission, filterBank, filterQuality])

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-400">
        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" /> {error}
      </div>
    )
  }

  if (!evidence || !roster || !totals) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
        <Loader2 size={14} className="animate-spin" /> Loading insights…
      </div>
    )
  }

  const codedCount = evidence.length
  const completedAllCount = roster.filter(s => s.completed_all).length
  const avgScoutScore = (() => {
    const scored = evidence.filter(e => e.scout_score)
    if (!scored.length) return '—'
    const rank = { High: 3, Medium: 2, Low: 1 }
    const avg = scored.reduce((sum, e) => sum + (rank[e.scout_score] || 0), 0) / scored.length
    return avg >= 2.5 ? 'High' : avg >= 1.5 ? 'Medium' : 'Low'
  })()

  const rewardEligible = roster.filter(s => s.completed_all)

  return (
    <div className="space-y-5">
      {/* Overview KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile icon={Users} label="Total Scouts" value={roster.length} />
        <KpiTile icon={FileText} label="Submissions" value={totals.totalSubmissions} />
        <KpiTile icon={CheckCircle2} label="Completed All Missions" value={completedAllCount} />
        <KpiTile icon={Gauge} label="Coded / Pending" value={`${codedCount} / ${Math.max(totals.totalSubmissions - codedCount, 0)}`} />
        <KpiTile icon={Award} label="Avg. Scout Score" value={avgScoutScore} />
      </div>

      {/* Segmentation charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Money Utilities">
          <FrequencyBarChart data={countBy(evidence, 'money_utilities', { isArray: true })} />
        </Section>
        <Section title="Bank Permission">
          <StatusDonutChart data={countBy(evidence, 'bank_permission')} />
        </Section>
        <Section title="Passion Categories">
          <FrequencyBarChart data={countBy(evidence, 'passion_categories', { isArray: true })} />
        </Section>
        <Section title="Access Barriers">
          <FrequencyBarChart data={countBy(evidence, 'access_barriers', { isArray: true })} />
        </Section>
        <Section title="Decision Control">
          <FrequencyBarChart data={countBy(evidence, 'decision_control')} />
        </Section>
        <Section title="Data Quality">
          <div className="grid grid-cols-2 gap-2">
            <StatusDonutChart data={countBy(evidence, 'quality')} height={200} />
            <StatusDonutChart data={countBy(evidence, 'confidence')} height={200} />
          </div>
        </Section>
      </div>

      {/* Evidence explorer */}
      <Section
        title="Evidence Explorer"
        action={<ExportButton onClick={() => exportToCsv('scout-evidence.csv', filteredEvidence, [
          { key: 'scout_id', label: 'Scout ID' },
          { key: 'full_name', label: 'Name' },
          { key: 'mission_id', label: 'Mission' },
          { key: 'verbatim_quote', label: 'Verbatim Quote' },
          { key: 'analyst_note', label: 'Analyst Note' },
          { key: 'money_utilities', label: 'Money Utilities' },
          { key: 'passion_categories', label: 'Passion Categories' },
          { key: 'access_barriers', label: 'Access Barriers' },
          { key: 'access_barriers_reason', label: 'Access Barriers Reason' },
          { key: 'bank_permission', label: 'Bank Permission' },
          { key: 'bank_permission_reason', label: 'Bank Permission Reason' },
          { key: 'quality', label: 'Quality' },
          { key: 'confidence', label: 'Confidence' },
        ])} />}
      >
        <div className="mb-3 flex flex-wrap gap-2">
          <select value={filterMission} onChange={e => setFilterMission(e.target.value)} className="rounded-lg border border-scout-border bg-scout-card px-2.5 py-1.5 text-xs text-slate-300">
            <option value="all">All missions</option>
            {missionIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
          <select value={filterBank} onChange={e => setFilterBank(e.target.value)} className="rounded-lg border border-scout-border bg-scout-card px-2.5 py-1.5 text-xs text-slate-300">
            <option value="all">All bank permission</option>
            {['Welcome', 'Neutral', 'Risky', 'Rejected'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterQuality} onChange={e => setFilterQuality(e.target.value)} className="rounded-lg border border-scout-border bg-scout-card px-2.5 py-1.5 text-xs text-slate-300">
            <option value="all">All quality</option>
            {['Good', 'Thin', 'Problem'].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <span className="flex items-center text-xs text-scout-text-muted">{filteredEvidence.length} of {evidence.length}</span>
        </div>

        <div className="max-h-[420px] space-y-2 overflow-y-auto">
          {filteredEvidence.length === 0 && (
            <p className="py-8 text-center text-xs text-scout-text-muted">No evidence matches these filters.</p>
          )}
          {filteredEvidence.map(row => {
            const rowKey = `${row.scout_id}-${row.mission_id}`
            const isOpen = expandedRow === rowKey
            return (
              <div key={rowKey} className="rounded-xl border border-scout-border bg-scout-card">
                <button onClick={() => setExpandedRow(isOpen ? null : rowKey)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-white">{row.full_name} · {row.mission_id}</p>
                    <p className="truncate text-xs text-scout-text-muted">"{row.verbatim_quote}"</p>
                  </div>
                  <span className="flex flex-shrink-0 items-center gap-1 rounded-full border border-scout-border px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                    {row.bank_permission || '—'}
                  </span>
                  {isOpen ? <ChevronUp size={13} className="flex-shrink-0 text-slate-500" /> : <ChevronDown size={13} className="flex-shrink-0 text-slate-500" />}
                </button>
                {isOpen && (
                  <div className="space-y-2 border-t border-scout-border px-3 py-3 text-xs text-scout-text-sub">
                    <p><span className="font-semibold text-slate-400">Analyst note:</span> {row.analyst_note || '—'}</p>
                    <p><span className="font-semibold text-slate-400">Money utilities:</span> {(row.money_utilities || []).join(', ') || '—'}</p>
                    <p><span className="font-semibold text-slate-400">Passion categories:</span> {(row.passion_categories || []).join(', ') || '—'}</p>
                    <p><span className="font-semibold text-slate-400">Access barriers:</span> {(row.access_barriers || []).join(', ') || '—'}</p>
                    {row.access_barriers_reason && <p><span className="font-semibold text-slate-400">Access barriers reason:</span> {row.access_barriers_reason}</p>}
                    {row.bank_permission_reason && <p><span className="font-semibold text-slate-400">Bank permission reason:</span> {row.bank_permission_reason}</p>}
                    <p><span className="font-semibold text-slate-400">Quality / Confidence:</span> {row.quality} / {row.confidence}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      {/* Scout drill-down */}
      <Section title="Scout Drill-down">
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <select
            value={selectedScout} onChange={e => setSelectedScout(e.target.value)}
            className="w-full rounded-lg border border-scout-border bg-scout-card py-2 pl-9 pr-3 text-xs text-slate-300"
          >
            <option value="">Select a scout…</option>
            {roster.map(s => <option key={s.scout_id} value={s.scout_id}>{s.full_name} ({s.scout_id})</option>)}
          </select>
        </div>

        {scoutDetailLoading && <div className="flex items-center gap-2 py-4 text-xs text-slate-500"><Loader2 size={13} className="animate-spin" /> Loading…</div>}
        {scoutDetailError && <p className="text-xs text-rose-400">{scoutDetailError}</p>}
        {scoutDetail && scoutDetail.length === 0 && <p className="py-4 text-center text-xs text-scout-text-muted">This scout hasn't submitted anything yet.</p>}
        {scoutDetail && scoutDetail.length > 0 && (
          <div className="space-y-2">
            {scoutDetail.map(m => (
              <div key={m.mission_id} className="rounded-xl border border-scout-border bg-scout-card px-3 py-2.5">
                <p className="text-xs font-semibold text-white">{m.mission_title || m.mission_id}</p>
                <p className="mt-1 text-xs text-scout-text-sub whitespace-pre-wrap">{m.text_response || '(no text response)'}</p>
                {m.bank_permission && (
                  <p className="mt-1.5 text-[11px] text-scout-text-muted">
                    {m.bank_permission} · {m.quality || 'not yet coded'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Reward eligibility */}
      <Section
        title={`Reward Eligible (${rewardEligible.length})`}
        action={<ExportButton onClick={() => exportToCsv('reward-eligible-scouts.csv', rewardEligible, [
          { key: 'scout_id', label: 'Scout ID' },
          { key: 'full_name', label: 'Name' },
          { key: 'phone_number', label: 'Phone Number' },
          { key: 'location', label: 'Location' },
          { key: 'missions_done', label: 'Missions Done' },
        ])} />}
      >
        {rewardEligible.length === 0 ? (
          <p className="py-6 text-center text-xs text-scout-text-muted">No scouts have completed every published mission yet.</p>
        ) : (
          <div className="max-h-[300px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-scout-text-muted">
                  <th className="pb-2 font-semibold">Name</th>
                  <th className="pb-2 font-semibold">Scout ID</th>
                  <th className="pb-2 font-semibold">Phone</th>
                  <th className="pb-2 font-semibold">Location</th>
                </tr>
              </thead>
              <tbody>
                {rewardEligible.map(s => (
                  <tr key={s.scout_id} className="border-t border-scout-border text-slate-300">
                    <td className="py-2">{s.full_name}</td>
                    <td className="py-2">{s.scout_id}</td>
                    <td className="py-2">{s.phone_number}</td>
                    <td className="py-2">{s.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  )
}
