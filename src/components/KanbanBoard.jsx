import React, { useRef } from 'react'
import { Rocket, Zap, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import MissionCard from './MissionCard'

const COLUMNS = [
  {
    id: 'upcoming',
    label: 'Upcoming',
    icon: Rocket,
    accent: 'text-scout-text-muted',
    dotColor: 'bg-scout-muted',
    description: 'Opens soon',
  },
  {
    id: 'current',
    label: 'Current',
    icon: Zap,
    accent: 'text-scout-accent-light',
    dotColor: 'bg-scout-accent',
    description: 'Ready to complete',
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: CheckCircle2,
    accent: 'text-emerald-400',
    dotColor: 'bg-emerald-400',
    description: 'Rewards earned',
  },
]

function ColumnHeader({ col, count }) {
  const Icon = col.icon
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-scout-card border border-scout-border`}>
          <Icon size={13} className={col.accent} />
        </div>
        <div>
          <h2 className={`text-sm font-bold ${col.accent}`}>{col.label}</h2>
          <p className="text-[10px] text-scout-text-muted">{col.description}</p>
        </div>
      </div>
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-scout-muted px-1.5 text-[10px] font-bold text-scout-text-muted">
          {count}
        </span>
      )}
    </div>
  )
}

function EmptyColumn({ col }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-scout-border py-10 text-center">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-scout-card`}>
        <col.icon size={18} className={`${col.accent} opacity-40`} />
      </div>
      <p className="text-xs text-scout-text-muted">
        {col.id === 'upcoming' ? 'All caught up' : col.id === 'current' ? 'No active missions' : 'Nothing yet'}
      </p>
    </div>
  )
}

function MobileColumnPicker({ activeCol, onChange, columns }) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 lg:hidden">
      {columns.map((col) => (
        <button
          key={col.id}
          onClick={() => onChange(col.id)}
          className={`flex flex-shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
            activeCol === col.id
              ? 'border-scout-accent/50 bg-scout-accent/10 text-scout-accent-light'
              : 'border-scout-border bg-scout-card text-scout-text-muted hover:border-scout-muted'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${col.dotColor}`} />
          {col.label}
        </button>
      ))}
    </div>
  )
}

export default function KanbanBoard({ missions, onCardClick }) {
  const [activeMobileCol, setActiveMobileCol] = React.useState('current')

  const byStatus = (status) => missions.filter(m => m.status === status)

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">

      {/* Mobile column picker */}
      <div className="mb-4 lg:hidden">
        <MobileColumnPicker
          activeCol={activeMobileCol}
          onChange={setActiveMobileCol}
          columns={COLUMNS}
        />
      </div>

      {/* ── Desktop: three columns side by side ── */}
      <div className="hidden gap-4 lg:grid lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const cards = byStatus(col.id)
          return (
            <div key={col.id} className="flex flex-col gap-3">
              <ColumnHeader col={col} count={cards.length} />
              <div className="flex flex-col gap-3">
                {cards.length === 0
                  ? <EmptyColumn col={col} />
                  : cards.map(m => (
                      <MissionCard
                        key={m.id}
                        mission={m}
                        onClick={() => onCardClick(m)}
                      />
                    ))
                }
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Mobile: single active column ── */}
      <div className="flex flex-col gap-3 lg:hidden">
        {COLUMNS.filter(c => c.id === activeMobileCol).map((col) => {
          const cards = byStatus(col.id)
          return (
            <div key={col.id} className="flex flex-col gap-3">
              <ColumnHeader col={col} count={cards.length} />
              <div className="flex flex-col gap-3">
                {cards.length === 0
                  ? <EmptyColumn col={col} />
                  : cards.map(m => (
                      <MissionCard
                        key={m.id}
                        mission={m}
                        onClick={() => onCardClick(m)}
                      />
                    ))
                }
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
