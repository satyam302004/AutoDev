import { agentLabel, formatClock } from '../lib/steps'
import type { AgentRun, Execution } from '../types'
import { PixelPanel } from './ui/PixelPanel'

interface TimelineEntry {
  label: string
  time: string
  status: string
}

function buildTimeline(execution: Execution | null, runs: AgentRun[]): TimelineEntry[] {
  if (!execution) return []
  let cumulative = 0
  const entries: TimelineEntry[] = []
  for (const run of runs) {
    const start = new Date(execution.started).getTime() + cumulative
    entries.push({
      label: agentLabel(run.agent_name),
      time: formatClock(start),
      status: run.status,
    })
    cumulative += run.execution_ms ?? 0
  }
  if (execution.finished) {
    entries.push({
      label: 'Report',
      time: formatClock(new Date(execution.started).getTime() + cumulative),
      status: 'success',
    })
  }
  return entries
}

export function Timeline({ execution, runs }: { execution: Execution | null; runs: AgentRun[] }) {
  const entries = buildTimeline(execution, runs)
  return (
    <PixelPanel variant="default">
      <div
        style={{
          padding: 'var(--cth-space-2) var(--cth-space-3)',
          background: 'var(--cth-cream-200)',
          boxShadow: 'inset 0 -1px 0 var(--cth-ink-900)',
        }}
      >
        <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 'var(--cth-text-display-sm)', lineHeight: '12px', color: 'var(--cth-ink-700)' }}>TIMELINE</div>
        <div style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 10, color: 'var(--cth-ink-500)', marginTop: 2 }}>Agent execution sequence</div>
      </div>
      <div style={{ maxHeight: 256, overflowY: 'auto', padding: 'var(--cth-space-4)' }}>
        {entries.length === 0 ? (
          <p style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 'var(--cth-text-body-md)', color: 'var(--cth-ink-300)' }}>No execution data yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {entries.map((entry, index) => (
              <div key={`${entry.label}-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-2)', fontFamily: 'var(--cth-font-mono)', fontSize: 10 }}>
                <span style={{ width: 64, flexShrink: 0, color: 'var(--cth-ink-300)', fontVariantNumeric: 'tabular-nums' }}>{entry.time}</span>
                <span style={{ color: 'var(--cth-ink-100)' }}>|</span>
                <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: entry.status === 'success' ? 'var(--cth-mint)' : 'var(--cth-coral)' }} />
                <span style={{ color: 'var(--cth-ink-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </PixelPanel>
  )
}
