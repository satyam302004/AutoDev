import type {
  ActivityStep,
  AgentActivity,
  Artifact,
  JobStatus,
  MemoryEntry,
  ProjectDetail,
  ProjectSummary,
  ReportData,
} from './types'

const BASE = '/api'

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(`${BASE}${url}`)
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${url}`)
  }
  return response.json() as Promise<T>
}

export async function createProject(idea: string, techPreferences?: string) {
  const response = await fetch(`${BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idea, tech_preferences: techPreferences || null }),
  })
  if (!response.ok) {
    const detail = await response.json().catch(() => null)
    const message = (detail as { detail?: string } | null)?.detail
    throw new Error(message || `Create failed: ${response.status}`)
  }
  return response.json() as Promise<{ job_id: string; project_id: string; status: string }>
}

export function listProjects(): Promise<ProjectSummary[]> {
  return getJson<ProjectSummary[]>('/projects')
}

export function getProject(projectId: string): Promise<ProjectDetail> {
  return getJson<ProjectDetail>(`/projects/${projectId}`)
}

export function getStatus(projectId: string): Promise<JobStatus> {
  return getJson<JobStatus>(`/projects/${projectId}/status`)
}

export function getReport(projectId: string): Promise<ReportData> {
  return getJson<ReportData>(`/projects/${projectId}/report`)
}

export function getArtifacts(projectId: string): Promise<Artifact[]> {
  return getJson<Artifact[]>(`/projects/${projectId}/artifacts`)
}

export function deleteProject(projectId: string): Promise<void> {
  return fetch(`${BASE}/projects/${projectId}`, { method: 'DELETE' }).then((r) => {
    if (!r.ok) throw new Error(`Delete failed: ${r.status}`)
  })
}

// Memory search API
export async function searchMemory(
  query: string,
  filters?: { type?: string; agent?: string; projectId?: string }
): Promise<MemoryEntry[]> {
  const params = new URLSearchParams({ q: query })
  if (filters?.type) params.set('type', filters.type)
  if (filters?.agent) params.set('agent', filters.agent)
  if (filters?.projectId) params.set('project_id', filters.projectId)
  return getJson<MemoryEntry[]>(`/memory/search?${params.toString()}`)
}

// Agent activity API
export function getAgentActivity(
  projectId: string,
  agentName: string
): Promise<AgentActivity> {
  return getJson<AgentActivity>(
    `/projects/${projectId}/activity?agent=${agentName}`
  )
}

// Project activity timeline
export function getProjectActivity(projectId: string): Promise<{
  steps: ActivityStep[]
  agents: { name: string; status: string; duration_ms: number }[]
}> {
  return getJson(`/projects/${projectId}/activity`)
}
