import { Clock, DollarSign, Layers, Target } from 'lucide-react'
import type { ProjectSummary } from '../types'
import { formatCost, formatDuration } from '../lib/steps'
import { PixelPanel } from './ui/PixelPanel'

interface Metrics {
  projects: number
  avgRuntime: number | null
  avgQuality: number | null
  avgCost: number | null
}

export function computeMetrics(projects: ProjectSummary[], runtimes: Record<string, number | null>): Metrics {
  const done = projects.filter((p) => p.status === 'completed')
  const runtimesList = done.map((p) => runtimes[p.id]).filter((v): v is number => v !== null && v !== undefined)
  const qualities = done.map((p) => p.quality).filter((v): v is number => v !== null)
  const costs = done.map((p) => p.cost).filter((v): v is number => v !== null)
  const avg = (values: number[]) =>
    values.length ? values.reduce((a, b) => a + b, 0) / values.length : null
  return {
    projects: done.length,
    avgRuntime: avg(runtimesList),
    avgQuality: avg(qualities),
    avgCost: avg(costs),
  }
}

export function MetricsCards({ metrics }: { metrics: Metrics }) {
  const cards = [
    {
      icon: <Layers size={14} />,
      label: 'PROJECTS',
      value: String(metrics.projects),
      accent: 'var(--cth-lilac)',
    },
    {
      icon: <Clock size={14} />,
      label: 'AVG RUNTIME',
      value: metrics.avgRuntime === null ? '\u2014' : formatDuration(Math.round(metrics.avgRuntime)),
      accent: 'var(--cth-sky)',
    },
    {
      icon: <Target size={14} />,
      label: 'AVG CONFIDENCE',
      value: metrics.avgQuality === null ? '\u2014' : `${Math.round(metrics.avgQuality * 100)}%`,
      accent: 'var(--cth-mint)',
    },
    {
      icon: <DollarSign size={14} />,
      label: 'AVG COST',
      value: metrics.avgCost === null ? '\u2014' : formatCost(metrics.avgCost),
      accent: 'var(--cth-lemon)',
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--cth-space-3)' }}>
      {cards.map((card) => (
        <PixelPanel key={card.label} variant="inset">
          <div style={{ padding: 'var(--cth-space-3) var(--cth-space-4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-2)' }}>
              <span style={{ color: card.accent }}>{card.icon}</span>
              <span
                style={{
                  fontFamily: 'var(--cth-font-display)',
                  fontSize: 'var(--cth-text-display-sm)',
                  lineHeight: '12px',
                  color: 'var(--cth-ink-500)',
                }}
              >
                {card.label}
              </span>
            </div>
            <div
              style={{
                marginTop: 8,
                fontFamily: 'var(--cth-font-mono)',
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--cth-ink-900)',
              }}
            >
              {card.value}
            </div>
          </div>
        </PixelPanel>
      ))}
    </div>
  )
}
