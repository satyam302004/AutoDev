import { useCallback, useEffect, useRef, useState } from 'react';
import { createProject, deleteProject, getArtifacts, getProject, getStatus } from '../api';
import type { Artifact, JobStatus, ProjectDetail } from '../types';
import { useProjectsData } from '../hooks/useProjectsData';
import { usePolling } from '../hooks/usePolling';
import { useToast } from '../components/Toasts';
import { PixelPanel } from '../components/ui/PixelPanel';
import { PixelButton } from '../components/ui/PixelButton';
import { AgentCard } from '../components/AgentCard';
import { SpritePortrait } from '../components/SpritePortrait';
import { OfficeFloor } from '../scene/OfficeFloor';
import type { AgentKey } from '../scene/cast';

const PIPELINE_AGENTS: AgentKey[] = [
  'project_manager', 'requirements', 'architecture', 'planning',
  'backend', 'frontend', 'qa', 'documentation', 'report',
];

const AGENT_DESCRIPTIONS: Record<string, string> = {
  project_manager: 'Breaking the project into epics and features',
  requirements: 'Writing user stories and acceptance criteria',
  architecture: 'Designing system architecture and technology stack',
  planning: 'Breaking features into implementation tasks',
  backend: 'Designing API endpoints and database schema',
  frontend: 'Planning components, routes and application state',
  qa: 'Creating test cases and identifying edge cases',
  documentation: 'Preparing README and API documentation',
  report: 'Compiling the final project blueprint',
};

export function DashboardPage() {
  const toast = useToast();
  const { projects, refresh } = useProjectsData();
  const [generating, setGenerating] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [_artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [idea, setIdea] = useState('');
  const [techPreferences, setTechPreferences] = useState('');

  const running = jobStatus?.status === 'running' || jobStatus?.status === 'pending';

  const statusFetcher = useCallback(() => getStatus(selectedId ?? ''), [selectedId]);
  usePolling(statusFetcher, 1000, selectedId !== null && running, (s) => setJobStatus(s));

  const loadResults = useCallback(
    async (id: string, notify: 'success' | 'error' | null) => {
      try {
        const [d, arts] = await Promise.all([
          getProject(id),
          getArtifacts(id).catch(() => [] as Artifact[]),
        ]);
        setDetail(d);
        setArtifacts(arts);
        setSelectedAgent((current) => current ?? d.agent_runs[0]?.agent_name ?? null);
        void refresh();
        if (notify === 'success') toast('Report generated successfully');
        else if (notify === 'error') toast('Pipeline failed', 'error');
      } catch (error) {
        if (notify) toast(String(error), 'error');
      }
    },
    [refresh, toast],
  );

  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedId || !jobStatus) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = jobStatus.status;
    const wasRunning = prev === 'running' || prev === 'pending';
    if (wasRunning && jobStatus.status === 'completed') void loadResults(selectedId, 'success');
    else if (wasRunning && jobStatus.status === 'failed') void loadResults(selectedId, 'error');
  }, [jobStatus, loadResults, selectedId]);

  const selectProject = useCallback(
    async (id: string) => {
      setSelectedId(id);
      setDetail(null);
      setArtifacts([]);
      setJobStatus(null);
      prevStatusRef.current = null;
      try {
        const [st] = await Promise.all([
          getStatus(id),
          getProject(id).then((d) => {
            setDetail(d);
            setSelectedAgent(d.agent_runs[0]?.agent_name ?? null);
            return d;
          }),
        ]);
        setJobStatus(st);
        if (st.status === 'completed') await loadResults(id, null);
        return st;
      } catch (error) {
        toast(`Failed to load project: ${String(error)}`, 'error');
        return null;
      }
    },
    [loadResults, toast],
  );

  const handleGenerate = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!idea.trim()) return;
      setGenerating(true);
      try {
        const created = await createProject(idea, techPreferences);
        toast('Project kicked off — agents are working');
        await refresh();
        const st = await selectProject(created.project_id);
        if (st?.status === 'completed') toast('Report generated successfully');
      } catch (error) {
        toast(`Failed to start project: ${String(error)}`, 'error');
      } finally {
        setGenerating(false);
      }
    },
    [idea, techPreferences, refresh, selectProject, toast],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteProject(id);
        if (selectedId === id) {
          setSelectedId(null);
          setDetail(null);
          setArtifacts([]);
          setJobStatus(null);
        }
        await refresh();
        toast('Project deleted');
      } catch (error) {
        toast(`Failed to delete: ${String(error)}`, 'error');
      }
    },
    [refresh, selectedId, toast],
  );

  const progress = jobStatus ? Math.round(jobStatus.progress * 100) : 0;

  // Build agent states for the office floor
  const agentStates = PIPELINE_AGENTS.map((key) => {
    const run = detail?.agent_runs.find((r) => r.agent_name === key);
    return {
      key,
      status: run?.status ?? 'idle',
      task: run?.summary,
    };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Main area */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', padding: 'var(--cth-space-4)', gap: 'var(--cth-space-4)' }}>
        {/* Left column: New Project + Projects list */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-4)', overflow: 'hidden' }}>
          {/* New Project form */}
          <PixelPanel variant="default" title="NEW PROJECT">
            <form onSubmit={handleGenerate} style={{ padding: 'var(--cth-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-3)' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-1)' }}>
                <span style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)', textTransform: 'uppercase' }}>
                  IDEA
                </span>
                <textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Describe your project idea..."
                  rows={3}
                  style={{ width: '100%', resize: 'none', fontFamily: 'var(--cth-font-ui)', fontSize: 'var(--cth-text-body-sm)' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-1)' }}>
                <span style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)', textTransform: 'uppercase' }}>
                  TECH STACK (OPTIONAL)
                </span>
                <input
                  value={techPreferences}
                  onChange={(e) => setTechPreferences(e.target.value)}
                  placeholder="e.g. React, FastAPI, PostgreSQL"
                  style={{ width: '100%', fontFamily: 'var(--cth-font-ui)', fontSize: 'var(--cth-text-body-sm)' }}
                />
              </label>
              <PixelButton variant="primary" disabled={generating || !idea.trim()}>
                {generating ? 'GENERATING...' : 'GENERATE'}
              </PixelButton>
            </form>
          </PixelPanel>

          {/* Projects list */}
          <PixelPanel variant="default" title="PROJECTS" style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--cth-space-2)' }}>
              {projects.length === 0 ? (
                <div style={{ padding: 'var(--cth-space-4)', textAlign: 'center', fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-500)' }}>
                  NO PROJECTS YET
                </div>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectProject(p.id)}
                    style={{
                      padding: 'var(--cth-space-2) var(--cth-space-3)',
                      cursor: 'pointer',
                      background: selectedId === p.id ? 'var(--cth-cream-200)' : 'transparent',
                      boxShadow: selectedId === p.id ? 'inset 0 0 0 1px var(--cth-ink-300)' : 'none',
                      transition: 'all 0.1s steps(2, end)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-ink-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.title || p.id.slice(0, 8)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'var(--cth-font-mono)', fontSize: 10, color: 'var(--cth-ink-500)' }}>
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                        style={{ background: 'none', border: 'none', fontFamily: 'var(--cth-font-display)', fontSize: 8, color: 'var(--cth-coral)', cursor: 'pointer', padding: '2px 4px' }}
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </PixelPanel>
        </div>

        {/* Center: Office Floor */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-4)', overflow: 'hidden' }}>
          <PixelPanel variant="default" title="OFFICE FLOOR" style={{ flex: 1, overflow: 'hidden' }}>
            <OfficeFloor
              agents={agentStates}
              selectedAgent={selectedAgent ?? undefined}
              onAgentClick={setSelectedAgent}
            />
          </PixelPanel>

          {/* Running agent detail */}
          {selectedId && running && (
            <PixelPanel variant="active" accent="sky">
              <div style={{ padding: 'var(--cth-space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--cth-space-3)' }}>
                <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 'var(--cth-text-display-sm)', color: 'var(--cth-ink-900)' }}>
                  Agents working...
                </div>
                <div style={{ width: 280 }}>
                  <div style={{ height: 12, background: 'var(--cth-cream-200)', boxShadow: 'var(--cth-panel-border-inset)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'var(--cth-sky)', transition: 'width 0.3s steps(4, end)' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--cth-font-mono)', fontSize: 10, color: 'var(--cth-ink-500)', textAlign: 'right', marginTop: 4 }}>
                    {progress}%
                  </div>
                </div>
              </div>
            </PixelPanel>
          )}
        </div>

        {/* Right: Agent details */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-4)', overflow: 'hidden' }}>
          <PixelPanel variant="default" title="AGENTS" style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--cth-space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-2)' }}>
              {PIPELINE_AGENTS.map((key) => {
                const run = detail?.agent_runs.find((r) => r.agent_name === key);
                const isRunning = jobStatus?.status === 'running' && jobStatus.current_agent === key;
                const isCompleted = jobStatus?.status === 'completed' || run?.status === 'success';
                const isFailed = run?.status === 'error';
                const runningIdx = jobStatus?.status === 'running'
                  ? PIPELINE_AGENTS.indexOf(jobStatus.current_agent as AgentKey)
                  : -1;
                const myIdx = PIPELINE_AGENTS.indexOf(key);
                const isWaiting = jobStatus?.status === 'running' && !isRunning && !isCompleted && !isFailed && myIdx > runningIdx;

                let state: string;
                let description: string;

                if (isRunning) {
                  state = 'running';
                  description = run?.summary || AGENT_DESCRIPTIONS[key] || '';
                } else if (isCompleted) {
                  state = 'completed';
                  description = run?.summary || 'completed';
                } else if (isFailed) {
                  state = 'error';
                  description = run?.summary || 'failed';
                } else if (isWaiting) {
                  state = 'pending';
                  const prevAgent = myIdx > 0 ? PIPELINE_AGENTS[myIdx - 1].replace(/_/g, ' ') : 'previous';
                  description = `Waiting for ${prevAgent}`;
                } else {
                  state = 'idle';
                  description = AGENT_DESCRIPTIONS[key] || '';
                }

                return (
                  <AgentCard
                    key={key}
                    agent={{ id: key, name: key, state, currentTask: description }}
                    isSelected={selectedAgent === key}
                    onSelect={setSelectedAgent}
                  />
                );
              })}
              {!selectedId && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--cth-space-6)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 'var(--cth-text-display-sm)', color: 'var(--cth-ink-500)', marginBottom: 'var(--cth-space-2)' }}>
                      NO PROJECT SELECTED
                    </div>
                    <div style={{ fontFamily: 'var(--cth-font-ui)', fontSize: 'var(--cth-text-body-sm)', color: 'var(--cth-ink-300)' }}>
                      Select a project to see agent activity.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </PixelPanel>
        </div>
      </div>

      {/* Bottom: Agent strip */}
      <div
        style={{
          height: 100,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--cth-space-2)',
          padding: '0 var(--cth-space-4)',
          background: 'var(--cth-cream-200)',
          boxShadow: 'inset 0 1px 0 var(--cth-ink-300)',
          overflowX: 'auto',
        }}
      >
        {PIPELINE_AGENTS.map((key) => {
          const agentState = agentStates.find((a) => a.key === key);
          const isWorking = agentState?.status === 'running';
          return (
            <div
              key={key}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: 'var(--cth-space-1) var(--cth-space-2)',
                cursor: 'pointer',
                minWidth: 80,
                background: selectedAgent === key ? 'var(--cth-cream-300)' : 'transparent',
                boxShadow: selectedAgent === key ? 'inset 0 0 0 1px var(--cth-ink-300)' : 'none',
              }}
              onClick={() => setSelectedAgent(key)}
            >
              <SpritePortrait agentKey={key} size={36} />
              <span style={{ fontFamily: 'var(--cth-font-display)', fontSize: 6, color: 'var(--cth-ink-700)', textTransform: 'uppercase', textAlign: 'center' }}>
                {key.replace('_', ' ')}
              </span>
              {isWorking && (
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cth-sky)', animation: 'cth-pulse 0.8s steps(2, end) infinite' }} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
