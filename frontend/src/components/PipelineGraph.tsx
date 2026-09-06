import { agentAccents, status as statusColors, type AgentName } from '../design/tokens';

type AgentStatus = 'idle' | 'thinking' | 'working' | 'blocked' | 'success' | 'failed';

interface PipelineNode {
  agent: AgentName;
  status: AgentStatus;
  task?: string;
}

interface PipelineGraphProps {
  nodes: PipelineNode[];
  currentAgent?: AgentName;
  onNodeClick?: (agent: AgentName) => void;
}

const agentDisplayNames: Record<AgentName, string> = {
  project_manager: 'PM',
  requirements: 'REQ',
  architecture: 'ARCH',
  planning: 'PLAN',
  backend: 'BACK',
  frontend: 'FRONT',
  qa: 'QA',
  documentation: 'DOCS',
  report: 'RPT',
};

const pipelineLayout: { x: number; y: number; agent: AgentName }[] = [
  { x: 100, y: 50, agent: 'project_manager' },
  { x: 250, y: 50, agent: 'requirements' },
  { x: 400, y: 50, agent: 'architecture' },
  { x: 550, y: 50, agent: 'planning' },
  { x: 550, y: 150, agent: 'backend' },
  { x: 550, y: 250, agent: 'frontend' },
  { x: 400, y: 200, agent: 'qa' },
  { x: 250, y: 200, agent: 'documentation' },
  { x: 100, y: 200, agent: 'report' },
];

const connections: [AgentName, AgentName][] = [
  ['project_manager', 'requirements'],
  ['requirements', 'architecture'],
  ['architecture', 'planning'],
  ['planning', 'backend'],
  ['planning', 'frontend'],
  ['backend', 'qa'],
  ['frontend', 'qa'],
  ['qa', 'documentation'],
  ['documentation', 'report'],
];

function getNodePosition(agent: AgentName) {
  return pipelineLayout.find((n) => n.agent === agent) || { x: 0, y: 0, agent };
}

function getStatusColor(status: AgentStatus): string {
  if (status === 'failed') return statusColors.blocked;
  return statusColors[status] || statusColors.idle;
}

export function PipelineGraph({
  nodes,
  currentAgent,
  onNodeClick,
}: PipelineGraphProps) {
  const nodeMap = new Map(nodes.map((n) => [n.agent, n]));

  return (
    <div
      style={{
        position: 'relative',
        background: 'var(--cth-cream-100)',
        boxShadow: 'var(--cth-panel-border)',
        padding: 'var(--cth-space-4)',
      }}
    >
      <div style={{ fontFamily: 'var(--cth-font-display)', fontSize: 'var(--cth-text-display-sm)', color: 'var(--cth-ink-900)', marginBottom: 'var(--cth-space-4)' }}>Pipeline</div>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {connections.map(([from, to]) => {
          const fromPos = getNodePosition(from);
          const toPos = getNodePosition(to);
          const fromNode = nodeMap.get(from);
          const toNode = nodeMap.get(to);
          const isActive = fromNode?.status === 'success' && (toNode?.status === 'thinking' || toNode?.status === 'working');
          const color = isActive ? statusColors.thinking : statusColors.idle;
          return (
            <g key={`${from}-${to}`}>
              <line x1={fromPos.x + 20} y1={fromPos.y + 20} x2={toPos.x + 20} y2={toPos.y + 20} stroke={color} strokeWidth={2} strokeDasharray={isActive ? '4 4' : 'none'} />
              <polygon points={`${toPos.x + 12},${toPos.y + 16} ${toPos.x + 20},${toPos.y + 20} ${toPos.x + 12},${toPos.y + 24}`} fill={color} />
            </g>
          );
        })}
      </svg>
      <svg style={{ position: 'relative', width: '100%', height: 320 }} viewBox="0 0 660 320">
        {pipelineLayout.map(({ x, y, agent }) => {
          const node = nodeMap.get(agent);
          const status = node?.status || 'idle';
          const accent = agentAccents[agent];
          const isCurrent = currentAgent === agent;
          const statusColor = getStatusColor(status);
          return (
            <g key={agent} style={{ cursor: 'pointer' }} onClick={() => onNodeClick?.(agent)}>
              <rect x={x} y={y} width={40} height={40} fill="var(--cth-cream-100)" stroke={isCurrent ? accent : 'var(--cth-ink-900)'} strokeWidth={isCurrent ? 3 : 2} />
              <rect x={x} y={y} width={40} height={4} fill={accent} />
              <circle cx={x + 36} cy={y + 4} r={4} fill={statusColor} stroke="var(--cth-ink-900)" strokeWidth={1} />
              <text x={x + 20} y={y + 28} textAnchor="middle" fill="var(--cth-ink-900)" fontSize={10} fontFamily="var(--cth-font-ui)">{agentDisplayNames[agent]}</text>
              {status === 'thinking' && (
                <g>
                  <circle cx={x + 14} cy={y - 6} r={2} fill={statusColors.thinking}><animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" begin="0s" /></circle>
                  <circle cx={x + 20} cy={y - 6} r={2} fill={statusColors.thinking}><animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" begin="0.15s" /></circle>
                  <circle cx={x + 26} cy={y - 6} r={2} fill={statusColors.thinking}><animate attributeName="opacity" values="0.4;1;0.4" dur="1.2s" repeatCount="indefinite" begin="0.3s" /></circle>
                </g>
              )}
              {status === 'success' && <text x={x + 20} y={y - 4} textAnchor="middle" fontSize={12}>\u2605</text>}
              {status === 'blocked' && <text x={x + 20} y={y - 4} textAnchor="middle" fontSize={12} fill={statusColors.blocked}>!</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
