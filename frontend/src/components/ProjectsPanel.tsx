import { useEffect, useState } from 'react'
import type { ProjectSummary } from '../types'
import { formatDate } from '../lib/steps'
import { PixelBadge } from './ui/PixelBadge'

function statusBadge(status: string) {
  if (status === 'completed') return <PixelBadge status="success" label="completed" />
  if (status === 'failed') return <PixelBadge status="error" label="failed" />
  if (status === 'running') return <PixelBadge status="working" label="running" />
  return <PixelBadge status="waiting" label="pending" />
}

export function ProjectsPanel({
  projects,
  selectedId,
  onSelect,
  onRefresh,
  onDelete,
  busy,
}: {
  projects: ProjectSummary[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRefresh: () => void
  onDelete: (id: string) => void
  busy: boolean
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!confirmId) return
    const timer = setTimeout(() => setConfirmId(null), 2500)
    return () => clearTimeout(timer)
  }, [confirmId])

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--cth-space-3) var(--cth-space-4)',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--cth-font-display)',
            fontSize: 'var(--cth-text-display-sm)',
            lineHeight: '12px',
            color: 'var(--cth-ink-900)',
          }}
        >
          PROJECTS
        </h2>
        <button
          onClick={onRefresh}
          title="Refresh projects"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--cth-font-display)',
            fontSize: 8,
            color: 'var(--cth-ink-500)',
            padding: 4,
          }}
        >
          {busy ? '...' : 'REFRESH'}
        </button>
      </div>

      <div style={{ padding: '0 var(--cth-space-2) var(--cth-space-2)' }}>
        {projects.length === 0 && (
          <p
            style={{
              padding: 'var(--cth-space-4)',
              textAlign: 'center',
              fontFamily: 'var(--cth-font-display)',
              fontSize: 8,
              color: 'var(--cth-ink-300)',
            }}
          >
            NO PROJECTS YET
          </p>
        )}
        {projects.map((project) => {
          const selected = project.id === selectedId
          return (
            <div
              key={project.id}
              onClick={() => onSelect(project.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--cth-space-2)',
                padding: 'var(--cth-space-2) var(--cth-space-3)',
                cursor: 'pointer',
                background: selected ? 'var(--cth-cream-200)' : 'transparent',
                boxShadow: selected ? 'inset 0 0 0 1px var(--cth-ink-300)' : 'none',
                transition: 'all 0.1s steps(2, end)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--cth-font-display)',
                    fontSize: 8,
                    color: selected ? 'var(--cth-ink-900)' : 'var(--cth-ink-700)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {project.title || project.id.slice(0, 8)}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--cth-font-mono)',
                    fontSize: 10,
                    color: 'var(--cth-ink-500)',
                    marginTop: 2,
                  }}
                >
                  {formatDate(project.created_at)}
                </div>
              </div>
              {statusBadge(project.status)}
              <button
                onClick={(event) => {
                  event.stopPropagation()
                  if (confirmId === project.id) {
                    onDelete(project.id)
                    setConfirmId(null)
                  } else {
                    setConfirmId(project.id)
                  }
                }}
                title={confirmId === project.id ? 'Click again to confirm' : 'Delete project'}
                style={{
                  background: confirmId === project.id ? 'var(--cth-coral)' : 'none',
                  color: confirmId === project.id ? 'var(--cth-cream-50)' : 'var(--cth-ink-300)',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--cth-font-display)',
                  fontSize: 8,
                  padding: '2px 4px',
                  flexShrink: 0,
                }}
              >
                {confirmId === project.id ? 'YES?' : 'DEL'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
