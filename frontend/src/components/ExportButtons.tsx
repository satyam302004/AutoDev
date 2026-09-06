import type { Artifact, ProjectDetail, ReportData } from '../types'
import { PixelButton } from './ui/PixelButton'

export function ExportButtons({
  projectId,
  detail,
  report,
  artifacts,
}: {
  projectId: string
  detail: ProjectDetail | null
  report: ReportData | null
  artifacts: Artifact[]
}) {
  const download = (path: string, filename: string) => {
    const anchor = document.createElement('a')
    anchor.href = path
    anchor.download = filename
    anchor.click()
  }

  const downloadJson = () => {
    const payload = { project: detail, report, artifacts }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `autodev-${projectId.slice(0, 8)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const buttons = [
    {
      label: 'PDF',
      onClick: () => download(`/api/projects/${projectId}/export/pdf`, `autodev-${projectId.slice(0, 8)}.pdf`),
      disabled: !report,
    },
    {
      label: 'DOCX',
      onClick: () => download(`/api/projects/${projectId}/export/docx`, `autodev-${projectId.slice(0, 8)}.docx`),
      disabled: !report,
    },
    {
      label: 'JSON',
      onClick: downloadJson,
      disabled: !detail,
    },
  ]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-2)' }}>
      <span
        style={{
          fontFamily: 'var(--cth-font-display)',
          fontSize: 8,
          color: 'var(--cth-ink-500)',
          marginRight: 4,
        }}
      >
        EXPORT:
      </span>
      {buttons.map((button) => (
        <PixelButton
          key={button.label}
          variant="secondary"
          size="sm"
          onClick={button.onClick}
          disabled={button.disabled}
        >
          {button.label}
        </PixelButton>
      ))}
    </div>
  )
}
