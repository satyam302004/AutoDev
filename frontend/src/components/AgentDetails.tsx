import { useState } from 'react'
import type { AgentRun, Artifact } from '../types'
import { agentLabel, confidenceLabel, formatDuration } from '../lib/steps'
import { PixelPanel } from './ui/PixelPanel'
import { PixelBadge } from './ui/PixelBadge'
import { Markdown } from './Markdown'
import { Spinner } from './ui'

function extractSections(markdown: string): { title: string; items: string[] }[] {
  const sections: { title: string; items: string[] }[] = []
  let current: { title: string; items: string[] } | null = null
  for (const line of markdown.split('\n')) {
    if (line.startsWith('## ')) {
      current = { title: line.slice(3).trim(), items: [] }
      sections.push(current)
    } else if (current && line.trim().startsWith('- ')) {
      current.items.push(line.trim().slice(2))
    }
  }
  return sections
}

function ExplainabilityTab({ run, markdown }: { run: AgentRun; markdown: string }) {
  const confidence = confidenceLabel(run.confidence)
  const sections = extractSections(markdown)
  return (
    <div style={{ padding: 'var(--cth-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-4)' }}>
      <div>
        <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)', textTransform: 'uppercase' }}>Decision</div>
        <p style={{ marginTop: 4, fontFamily: 'var(--cth-font-ui)', fontSize: 'var(--cth-text-body-md)', fontWeight: 500, color: 'var(--cth-ink-900)' }}>
          {run.summary || 'No summary captured.'}
        </p>
      </div>

      <div>
        <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)', textTransform: 'uppercase' }}>Confidence</div>
        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 'var(--cth-space-2)' }}>
          <div style={{ height: 8, width: 160, overflow: 'hidden', boxShadow: 'var(--cth-panel-border-inset)' }}>
            <div style={{ height: '100%', width: `${(run.confidence ?? 0) * 100}%`, background: 'var(--cth-mint)' }} />
          </div>
          <span style={{ fontFamily: 'var(--cth-font-mono)', fontSize: 12, fontWeight: 600, color: confidence.color }}>
            {run.confidence === null ? 'N/A' : `${Math.round(run.confidence * 100)}%`}
          </span>
          <span style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 10, color: 'var(--cth-ink-300)' }}>({confidence.label})</span>
        </div>
      </div>

      <div>
        <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)', textTransform: 'uppercase' }}>Reasoning trail</div>
        {sections.length === 0 ? (
          <p style={{ marginTop: 4, fontFamily: 'var(--cth-font-ui)', fontSize: 10, color: 'var(--cth-ink-300)' }}>No structured sections captured.</p>
        ) : (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-3)' }}>
            {sections.slice(0, 5).map((section) => (
              <div key={section.title} style={{ padding: 'var(--cth-space-2) var(--cth-space-3)', boxShadow: 'var(--cth-panel-border-inset)', background: 'var(--cth-cream-50)' }}>
                <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-700)' }}>{section.title}</div>
                {section.items.length > 0 && (
                  <ul style={{ marginTop: 6, paddingLeft: 16, listStyleType: 'square' }}>
                    {section.items.slice(0, 6).map((item, index) => (
                      <li key={index} style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 10, color: 'var(--cth-ink-500)', margin: '2px 0' }}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)', textTransform: 'uppercase' }}>Execution status</div>
        <div style={{ marginTop: 4 }}>
          <PixelBadge status={run.status === 'success' ? 'success' : run.status === 'retry' ? 'working' : 'error'} label={run.status} />
        </div>
      </div>
    </div>
  )
}

export function AgentDetails({
  runs,
  selectedAgent,
  onSelectAgent,
  artifacts,
  running,
  runningStepLabel,
  progress,
}: {
  runs: AgentRun[]
  selectedAgent: string | null
  onSelectAgent: (agent: string) => void
  artifacts: Artifact[]
  running: boolean
  runningStepLabel: string | null
  progress: number
}) {
  const [tab, setTab] = useState<'output' | 'explain'>('explain')
  const run = runs.find((r) => r.agent_name === selectedAgent) ?? runs[0]

  if (!run) {
    return (
      <PixelPanel variant="default" style={{ height: '100%' }}>
        <div style={{ padding: 'var(--cth-space-4)' }}>
          <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)', textAlign: 'center', padding: 'var(--cth-space-8)' }}>
            No agent runs captured yet.
          </div>
        </div>
      </PixelPanel>
    )
  }

  const agentLabel_ = agentLabel(run.agent_name)
  const artifact = artifacts.find((a) => a.type === run.agent_name)

  return (
    <PixelPanel variant="default" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div
        style={{
          padding: 'var(--cth-space-2) var(--cth-space-3)',
          background: 'var(--cth-cream-200)',
          boxShadow: 'inset 0 -1px 0 var(--cth-ink-900)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 'var(--cth-text-display-sm)', lineHeight: '12px', color: 'var(--cth-ink-700)' }}>
            {agentLabel_}
          </div>
          <div style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 10, color: 'var(--cth-ink-500)', marginTop: 2 }}>
            {running && runningStepLabel ? 'Currently executing' : `Completed in ${formatDuration(run.execution_ms)}`}
          </div>
        </div>
        {running ? <Spinner size={14} /> : (
          <PixelBadge status={run.status === 'success' ? 'success' : run.status === 'retry' ? 'working' : 'error'} label={run.status} />
        )}
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)' }}>
        <div style={{ padding: '8px 12px', boxShadow: 'inset -1px 0 0 var(--cth-ink-100)' }}>
          <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)' }}>EXECUTION</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--cth-font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--cth-ink-900)' }}>{formatDuration(run.execution_ms)}</div>
        </div>
        <div style={{ padding: '8px 12px', boxShadow: 'inset -1px 0 0 var(--cth-ink-100)' }}>
          <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)' }}>TOKENS</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--cth-font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--cth-ink-900)' }}>{run.tokens ? run.tokens.input + run.tokens.output : '\u2014'}</div>
        </div>
        <div style={{ padding: '8px 12px' }}>
          <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)' }}>CONFIDENCE</div>
          <div style={{ marginTop: 4, fontFamily: 'var(--cth-font-mono)', fontSize: 14, fontWeight: 600, color: 'var(--cth-ink-900)' }}>
            {run.confidence === null ? '\u2014' : `${Math.round(run.confidence * 100)}%`}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: 'var(--cth-space-2) var(--cth-space-3) 0', boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)', flexShrink: 0 }}>
        {([ { key: 'explain', label: 'Explainability' }, { key: 'output', label: 'Output' } ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--cth-font-display)',
              fontSize: 8,
              background: tab === t.key ? 'var(--cth-cream-100)' : 'transparent',
              color: tab === t.key ? 'var(--cth-ink-900)' : 'var(--cth-ink-500)',
              boxShadow: tab === t.key ? 'inset 0 -2px 0 var(--cth-sky)' : 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Agent selector */}
      {runs.length > 1 && (
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', padding: 'var(--cth-space-2) var(--cth-space-3)', boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)', flexShrink: 0 }}>
          {runs.map((r) => {
            const active = r.agent_name === run.agent_name
            return (
              <button
                key={r.agent_name}
                onClick={() => onSelectAgent(r.agent_name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 8px',
                  fontFamily: 'var(--cth-font-display)',
                  fontSize: 8,
                  background: active ? 'var(--cth-sky-light)' : 'transparent',
                  color: active ? 'var(--cth-ink-900)' : 'var(--cth-ink-500)',
                  boxShadow: active ? 'inset 0 0 0 1px var(--cth-sky)' : 'inset 0 0 0 1px var(--cth-ink-100)',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.status === 'success' ? 'var(--cth-mint)' : 'var(--cth-coral)' }} />
                {agentLabel(r.agent_name)}
              </button>
            )
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'explain' ? (
          <ExplainabilityTab run={run} markdown={artifact?.content ?? ''} />
        ) : (
          <div style={{ padding: 'var(--cth-space-4)' }}>
            {artifact ? (
              <Markdown content={artifact.content} />
            ) : (
              <div style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 10, color: 'var(--cth-ink-300)', textAlign: 'center', padding: 'var(--cth-space-8)' }}>
                No output artifact for this agent.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Running indicator */}
      {running && runningStepLabel && (
        <div
          style={{
            padding: '8px var(--cth-space-4)',
            background: 'var(--cth-sky-light)',
            boxShadow: 'inset 0 1px 0 var(--cth-ink-100)',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-2)', fontFamily: 'var(--cth-font-mono)', fontSize: 10, color: 'var(--cth-sky)' }}>
            <Spinner size={10} />
            {runningStepLabel} Agent thinking...
          </div>
          <div style={{ marginTop: 4, height: 6, overflow: 'hidden', boxShadow: 'var(--cth-panel-border-inset)' }}>
            <div style={{ height: '100%', width: `${Math.round(progress * 100)}%`, background: 'var(--cth-sky)', transition: 'width 0.7s' }} />
          </div>
        </div>
      )}
    </PixelPanel>
  )
}
