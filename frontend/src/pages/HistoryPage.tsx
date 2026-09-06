import { useCallback, useState } from 'react'
import { deleteProject, getArtifacts, getProject, getReport } from '../api'
import type { Artifact, ProjectDetail, ReportData } from '../types'
import { useProjectsData } from '../hooks/useProjectsData'
import { useToast } from '../components/Toasts'
import { formatDate } from '../lib/steps'
import { PixelPanel } from '../components/ui/PixelPanel'
import { MetricsCards, computeMetrics } from '../components/MetricsCards'
import { ProjectsPanel } from '../components/ProjectsPanel'
import { ArtifactViewer } from '../components/ArtifactViewer'
import { ExportButtons } from '../components/ExportButtons'

export function HistoryPage() {
  const toast = useToast()
  const { projects, runtimes, refresh } = useProjectsData()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<ProjectDetail | null>(null)
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [report, setReport] = useState<ReportData | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const selectProject = useCallback(async (id: string) => {
    setSelectedId(id)
    setDetail(null)
    setArtifacts([])
    setReport(null)
    setLoadingDetail(true)
    try {
      const d = await getProject(id)
      setDetail(d)
      if (d.status === 'completed') {
        const [arts, rep] = await Promise.all([
          getArtifacts(id).catch(() => [] as Artifact[]),
          getReport(id).catch(() => null as ReportData | null),
        ])
        setArtifacts(arts)
        setReport(rep)
      }
    } catch (error) {
      toast(`Failed to load project: ${String(error)}`, 'error')
    } finally {
      setLoadingDetail(false)
    }
  }, [toast])

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteProject(id)
        if (selectedId === id) {
          setSelectedId(null)
          setDetail(null)
          setArtifacts([])
          setReport(null)
        }
        await refresh()
        toast('Project deleted')
      } catch (error) {
        toast(`Failed to delete: ${String(error)}`, 'error')
      }
    },
    [refresh, selectedId, toast],
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', padding: 'var(--cth-space-4)', gap: 'var(--cth-space-4)' }}>
      <MetricsCards metrics={computeMetrics(projects, runtimes)} />

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 'var(--cth-space-4)', flex: 1, overflow: 'hidden' }}>
        {/* Left: Projects list */}
        <PixelPanel variant="default" style={{ overflow: 'hidden' }}>
          <ProjectsPanel
            projects={projects}
            selectedId={selectedId}
            onSelect={(id) => void selectProject(id)}
            onRefresh={() => void refresh()}
            onDelete={(id) => void handleDelete(id)}
            busy={false}
          />
        </PixelPanel>

        {/* Right: Detail area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-3)', overflow: 'hidden' }}>
          {selectedId ? (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--cth-space-3)' }}>
                <div style={{ minWidth: 0 }}>
                  <h2
                    style={{
                      fontFamily: 'var(--cth-font-display)',
                      fontSize: 'var(--cth-text-display-sm)',
                      lineHeight: '12px',
                      color: 'var(--cth-ink-900)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {detail?.title ?? 'Project'}
                  </h2>
                  {detail && (
                    <p
                      style={{
                        marginTop: 4,
                        fontFamily: 'var(--cth-font-mono)',
                        fontSize: 10,
                        color: 'var(--cth-ink-500)',
                      }}
                    >
                      Created {formatDate(detail.created_at)}
                    </p>
                  )}
                </div>
                <ExportButtons
                  projectId={selectedId}
                  detail={detail}
                  report={report}
                  artifacts={artifacts}
                />
              </div>
              {loadingDetail ? (
                <PixelPanel variant="inset" style={{ display: 'flex', minHeight: 480, alignItems: 'center', justifyContent: 'center' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--cth-space-2)',
                      fontFamily: 'var(--cth-font-display)',
                      fontSize: 8,
                      color: 'var(--cth-ink-500)',
                    }}
                  >
                    LOADING PROJECT...
                  </div>
                </PixelPanel>
              ) : (
                <ArtifactViewer artifacts={artifacts} />
              )}
            </>
          ) : (
            <PixelPanel variant="inset" style={{ flex: 1, minHeight: 560 }}>
              <div
                style={{
                  display: 'flex',
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 'var(--cth-space-6)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'var(--cth-font-display)',
                      fontSize: 'var(--cth-text-display-sm)',
                      color: 'var(--cth-ink-500)',
                      marginBottom: 'var(--cth-space-2)',
                    }}
                  >
                    ARTIFACTS
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--cth-font-ui)',
                      fontSize: 'var(--cth-text-body-sm)',
                      color: 'var(--cth-ink-300)',
                    }}
                  >
                    Select a project to view its generated artifacts and exports.
                  </div>
                </div>
              </div>
            </PixelPanel>
          )}
        </div>
      </div>
    </div>
  )
}
