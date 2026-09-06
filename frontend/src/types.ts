export type ProjectStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface ProjectSummary {
  id: string
  title: string
  status: ProjectStatus
  quality: number | null
  cost: number | null
  created_at: string
  updated_at: string
}

export interface JobStatus {
  job_id: string
  project_id: string
  status: ProjectStatus
  current_agent: string | null
  completed: number
  total: number
  progress: number
  error: string | null
}

export interface TokenUsage {
  input: number
  output: number
}

export interface AgentRun {
  agent_name: string
  status: string
  confidence: number | null
  execution_ms: number | null
  tokens: TokenUsage
  summary: string
}

export interface ArtifactMeta {
  type: string
  filename: string
}

export interface Artifact {
  type: string
  filename: string
  content: string
}

export interface Execution {
  id: string
  started: string
  finished: string | null
  duration: number | null
  tokens: TokenUsage
  cost: number | null
}

export interface ProjectDetail {
  id: string
  title: string
  status: ProjectStatus
  quality: number | null
  cost: number | null
  created_at: string
  updated_at: string
  execution: Execution | null
  agent_runs: AgentRun[]
  artifacts: ArtifactMeta[]
}

export interface ReportData {
  project_id: string
  title: string
  quality: number | null
  cost: number | null
  execution_time_ms: number | null
  tokens: TokenUsage
  markdown: string
}

// Memory panel types
export interface MemoryEntry {
  id: string
  type: 'project' | 'agent' | 'artifact'
  title: string
  content: string
  agent?: string
  project_id?: string
  timestamp: string
  quality?: number | null
}

// Agent interface for AgentCard
export interface Agent {
  id: string;
  name: string;
  state: string;
  currentTask?: string;
  repoPath?: string;
  isBoss?: boolean;
}

// Agent activity types
export interface ActivityStep {
  id: string
  tool?: string
  action: string
  result?: string
  timestamp: string
  duration_ms?: number
  tokens?: TokenUsage
}

export interface AgentActivity {
  agent_name: string
  steps: ActivityStep[]
  total_tokens: TokenUsage
  total_duration_ms: number
}
