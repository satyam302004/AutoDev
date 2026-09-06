import type { ReactElement } from 'react'
import type { JobStatus } from '../types'
import { PIPELINE_STEPS, runningAgent, stepState, type StepState } from '../lib/steps'
import { PixelPanel } from './ui/PixelPanel'
import { Spinner } from './ui'

const stepStyles: Record<StepState, { icon: ReactElement; label: string }> = {
  done: {
    icon: <span style={{ color: 'var(--cth-mint)', fontWeight: 700 }}>&#10003;</span>,
    label: 'done',
  },
  running: {
    icon: <Spinner size={14} />,
    label: 'running',
  },
  failed: {
    icon: <span style={{ color: 'var(--cth-coral)', fontWeight: 700 }}>&#10007;</span>,
    label: 'failed',
  },
  waiting: {
    icon: <span style={{ color: 'var(--cth-ink-300)' }}>&#9675;</span>,
    label: 'waiting',
  },
}

export function Pipeline({
  status,
  runningSummary,
}: {
  status: JobStatus | null
  runningSummary: string | null
}) {
  const current = runningAgent(status)
  const progress = status ? status.progress * 100 : 0

  return (
    <PixelPanel variant="default" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: 'var(--cth-space-2) var(--cth-space-3)',
          background: 'var(--cth-cream-200)',
          boxShadow: 'inset 0 -1px 0 var(--cth-ink-900)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'var(--cth-font-display)',
              fontSize: 'var(--cth-text-display-sm)',
              lineHeight: '12px',
              color: 'var(--cth-ink-700)',
            }}
          >
            PIPELINE
          </div>
          <div
            style={{
              fontFamily: 'var(--cth-font-ui)',
              fontSize: 'var(--cth-text-body-sm)',
              color: 'var(--cth-ink-500)',
              marginTop: 2,
            }}
          >
            {status && status.status === 'running' && current
              ? `${current.label} Agent working`
              : status && status.status === 'failed'
                ? 'Execution failed'
                : status && status.status === 'completed'
                  ? 'All steps completed'
                  : 'Waiting for a project'}
          </div>
        </div>
        {status && (
          <span
            style={{
              fontFamily: 'var(--cth-font-mono)',
              fontSize: 'var(--cth-text-body-md)',
              fontWeight: 600,
              color: 'var(--cth-ink-900)',
            }}
          >
            {status.status === 'failed' ? 'FAILED' : `${Math.round(progress)}%`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {status && (
        <div style={{ height: 6, background: 'var(--cth-cream-200)' }}>
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: status.status === 'failed' ? 'var(--cth-coral)' : 'var(--cth-sky)',
              transition: 'width 0.7s',
            }}
          />
        </div>
      )}

      {/* Running agent indicator */}
      {current && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--cth-space-2)',
            padding: '8px var(--cth-space-4)',
            background: 'var(--cth-sky-light)',
            boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)',
          }}
        >
          <Spinner size={12} />
          <span
            style={{
              fontFamily: 'var(--cth-font-ui)',
              fontSize: 'var(--cth-text-body-sm)',
              color: 'var(--cth-sky)',
            }}
          >
            {current.label} Agent thinking...
          </span>
          {runningSummary && (
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--cth-font-mono)',
                fontSize: 10,
                color: 'var(--cth-ink-500)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: 200,
              }}
            >
              {runningSummary}
            </span>
          )}
        </div>
      )}

      {/* Error display */}
      {status && status.error && status.status !== 'completed' && (
        <div
          style={{
            padding: '8px var(--cth-space-4)',
            fontFamily: 'var(--cth-font-mono)',
            fontSize: 10,
            color: 'var(--cth-coral)',
            background: 'var(--cth-coral-light)',
            boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)',
          }}
        >
          {status.error}
        </div>
      )}

      {/* Step list */}
      <div style={{ padding: 'var(--cth-space-3)' }}>
        {PIPELINE_STEPS.map((step, index) => {
          const state = stepState(index, status)
          const style = stepStyles[state]
          return (
            <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--cth-space-3)' }}>
              {/* Step indicator */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `inset 0 0 0 1px ${state === 'done' ? 'var(--cth-mint)' : state === 'running' ? 'var(--cth-sky)' : state === 'failed' ? 'var(--cth-coral)' : 'var(--cth-ink-300)'}`,
                    background: 'var(--cth-cream-50)',
                  }}
                >
                  {style.icon}
                </div>
                {index < PIPELINE_STEPS.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 16, background: 'var(--cth-ink-100)' }} />
                )}
              </div>
              {/* Step label */}
              <div style={{ paddingBottom: 12, paddingTop: 2 }}>
                <div
                  style={{
                    fontFamily: 'var(--cth-font-ui)',
                    fontSize: 'var(--cth-text-body-md)',
                    fontWeight: 500,
                    color: state === 'running' ? 'var(--cth-sky)' : state === 'done' ? 'var(--cth-ink-900)' : state === 'failed' ? 'var(--cth-coral)' : 'var(--cth-ink-500)',
                  }}
                >
                  {step.label}
                </div>
                {state === 'running' && step.agent && (
                  <div style={{ fontFamily: 'var(--cth-font-mono)', fontSize: 10, color: 'var(--cth-sky)' }}>
                    executing...
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </PixelPanel>
  )
}
