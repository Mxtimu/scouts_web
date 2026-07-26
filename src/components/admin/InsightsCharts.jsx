import React from 'react'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts'

// Reuses this app's own design tokens (tailwind.config.js) rather than a new
// palette — scout-accent for magnitude bars, and the three status colors
// already reserved for good/warning/critical semantics elsewhere in the app.
const ACCENT = '#FF6B35'
const AXIS_TEXT = '#7C8AA0' // muted, recessive — matches scout-text-muted's dark-mode tone
const GRID = '#2A3744'      // scout-border

const STATUS_COLORS = {
  // Bank Permission
  Welcome:  '#10b981', // scout-green
  Neutral:  '#7C8AA0',
  Risky:    '#f59e0b', // scout-amber
  Rejected: '#f43f5e', // scout-rose
  // Quality
  Good:     '#10b981',
  Thin:     '#f59e0b',
  Problem:  '#f43f5e',
  // Confidence
  Strong:   '#10b981',
  Moderate: '#f59e0b',
  Weak:     '#f43f5e',
}

const tooltipStyle = {
  background: '#1F2833', // scout-card
  border: '1px solid #2A3744',
  borderRadius: 8,
  fontSize: 12,
  color: '#E5E9F0',
}

// A single-series magnitude comparison (e.g. "how often was each Money
// Utility mentioned") — one color for every bar. Per the dataviz guidance,
// identity-per-category color isn't needed here since the categories are
// already distinguished by their axis labels, and using 10 arbitrary hues
// for 10 categories would violate the "assign hues in fixed order, never
// cycled past what's distinguishable" rule for no benefit.
export function FrequencyBarChart({ data, height = 260 }) {
  if (!data.length) {
    return <p className="py-8 text-center text-xs text-scout-text-muted">No data yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 28, bottom: 4, left: 4 }}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="name" width={150} tick={{ fill: AXIS_TEXT, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
        <Bar dataKey="value" fill={ACCENT} radius={[0, 4, 4, 0]} maxBarSize={22}>
          <LabelList dataKey="value" position="right" fill={AXIS_TEXT} fontSize={11} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// A proportion-of-whole breakdown for an ordinal/status-like field (Bank
// Permission, Quality, Confidence) — color carries real meaning here
// (good/neutral/warning/critical), so it uses the app's reserved status
// colors, always paired with the legend + tooltip (never color-alone).
export function StatusDonutChart({ data, height = 220 }) {
  if (!data.length) {
    return <p className="py-8 text-center text-xs text-scout-text-muted">No data yet.</p>
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data} dataKey="value" nameKey="name"
          innerRadius="55%" outerRadius="80%" paddingAngle={2}
          stroke="#13161C" strokeWidth={2}
        >
          {data.map(entry => (
            <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#7C8AA0'} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          verticalAlign="bottom" height={32}
          formatter={(value) => <span style={{ color: '#B8C2D0', fontSize: 11 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
