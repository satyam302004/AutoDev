import type { JobStatus } from '../types'

export interface PipelineStep {
  key: string
  label: string
  agent: string | null
  filename: string | null
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { key: 'validation', label: 'Validation', agent: null, filename: null },
  { key: 'project_manager', label: 'Project Manager', agent: 'project_manager', filename: 'project_plan.md' },
  { key: 'requirements', label: 'Requirements', agent: 'requirements', filename: 'requirements.md' },
  { key: 'architecture', label: 'Architecture', agent: 'architecture', filename: 'architecture.md' },
  { key: 'planning', label: 'Planning', agent: 'planning', filename: 'plan.md' },
  { key: 'backend', label: 'Backend', agent: 'backend', filename: 'api_spec.md' },
  { key: 'frontend', label: 'Frontend', agent: 'frontend', filename: 'ui_plan.md' },
  { key: 'qa', label: 'QA', agent: 'qa', filename: 'testing.md' },
  { key: 'documentation', label: 'Documentation', agent: 'documentation', filename: 'README.md' },
  { key: 'report', label: 'Report', agent: 'report', filename: 'report.md' },
]

export const STEP_INDEX: Record<string, number> = Object.fromEntries(
  PIPELINE_STEPS.map((step, index) => [step.key, index]),
)

export type StepState = 'waiting' | 'running' | 'done' | 'failed'

export function stepState(stepIndex: number, status: JobStatus | null): StepState {
  if (!status) return 'waiting'
  if (status.status === 'failed') {
    const failedIndex = status.current_agent
      ? STEP_INDEX[status.current_agent]
      : status.completed
    if (stepIndex === failedIndex) return 'failed'
    return stepIndex < status.completed ? 'done' : 'waiting'
  }
  if (stepIndex < status.completed) return 'done'
  if (status.status === 'running' && stepIndex === status.completed) return 'running'
  return 'waiting'
}

export function runningAgent(status: JobStatus | null): PipelineStep | null {
  if (!status || status.status !== 'running') return null
  const step = PIPELINE_STEPS[Math.min(status.completed, PIPELINE_STEPS.length - 1)]
  return step && step.agent ? step : null
}

export function agentLabel(agent: string): string {
  if (agent === 'qa') return 'QA'
  return agent.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function confidenceLabel(value: number | null): { label: string; color: string } {
  if (value === null) return { label: 'N/A', color: 'var(--cth-ink-300)' }
  if (value >= 0.85) return { label: 'High', color: 'var(--cth-mint)' }
  if (value >= 0.7) return { label: 'Medium', color: 'var(--cth-lemon)' }
  return { label: 'Low', color: 'var(--cth-coral)' }
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function formatCost(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return '—'
  return `$${cost.toFixed(4)}`
}

export function formatClock(value: number | string | Date): string {
  return new Date(value).toLocaleTimeString('en-GB', { hour12: false })
}

export function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export const ARTIFACT_TABS: { key: string; label: string; filename: string }[] = [
  { key: 'requirements', label: 'Requirements', filename: 'requirements.md' },
  { key: 'architecture', label: 'Architecture', filename: 'architecture.md' },
  { key: 'plan', label: 'Plan', filename: 'plan.md' },
  { key: 'api', label: 'API', filename: 'api_spec.md' },
  { key: 'ui', label: 'UI', filename: 'ui_plan.md' },
  { key: 'qa', label: 'QA', filename: 'testing.md' },
  { key: 'readme', label: 'README', filename: 'README.md' },
  { key: 'report', label: 'Report', filename: 'report.md' },
]
