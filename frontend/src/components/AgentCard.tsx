import { SpritePortrait } from './SpritePortrait';
import { PixelBadge } from './ui/PixelBadge';
import type { Agent } from '../types';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const ACCENT_COLORS: Record<string, string> = {
  validation: 'var(--cth-sky)',
  pm: 'var(--cth-lemon)',
  requirements: 'var(--cth-lilac)',
  architect: 'var(--cth-mint)',
  planner: 'var(--cth-peach)',
  backend: 'var(--cth-coral)',
  frontend: 'var(--cth-sky)',
  qa: 'var(--cth-lemon)',
  documentation: 'var(--cth-lilac)',
  report: 'var(--cth-mint)',
};

const ACCENT_LIGHT: Record<string, string> = {
  validation: 'var(--cth-sky-light)',
  pm: 'var(--cth-lemon-light)',
  requirements: 'var(--cth-lilac-light)',
  architect: 'var(--cth-mint-light)',
  planner: 'var(--cth-peach-light)',
  backend: 'var(--cth-coral-light)',
  frontend: 'var(--cth-sky-light)',
  qa: 'var(--cth-lemon-light)',
  documentation: 'var(--cth-lilac-light)',
  report: 'var(--cth-mint-light)',
};

function agentStatus(agent: Agent): 'idle' | 'thinking' | 'working' | 'success' | 'error' {
  if (agent.state === 'error') return 'error';
  if (agent.state === 'completed') return 'success';
  if (agent.state === 'running') return 'working';
  if (agent.state === 'pending') return 'thinking';
  return 'idle';
}

export function AgentCard({ agent, isSelected, onSelect }: AgentCardProps) {
  const accent = ACCENT_COLORS[agent.id] ?? 'var(--cth-lilac)';
  const accentLight = ACCENT_LIGHT[agent.id] ?? 'var(--cth-lilac-light)';
  const status = agentStatus(agent);

  return (
    <div
      onClick={() => onSelect(agent.id)}
      style={{
        display: 'flex',
        width: 220,
        height: 78,
        background: 'var(--cth-cream-100)',
        boxShadow: isSelected
          ? `inset 0 0 0 1px var(--cth-ink-100), inset 0 0 0 3px ${accent}, inset 0 0 0 5px var(--cth-ink-900)`
          : 'var(--cth-panel-border)',
        cursor: 'pointer',
        transition: 'all 0.1s steps(2, end)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Portrait tile */}
      <div
        style={{
          width: 36,
          flexShrink: 0,
          background: accentLight,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <SpritePortrait agentKey={agent.id} size={36} />
      </div>

      {/* Info */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: 'var(--cth-space-2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          overflow: 'hidden',
        }}
      >
        {/* Name + badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-1)' }}>
          <span
            style={{
              fontFamily: 'var(--cth-font-display)',
              fontSize: 'var(--cth-text-display-sm)',
              lineHeight: '12px',
              color: 'var(--cth-ink-900)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {agent.name}
          </span>
          {agent.isBoss && (
            <span
              style={{
                fontFamily: 'var(--cth-font-display)',
                fontSize: 6,
                lineHeight: '8px',
                color: 'var(--cth-lemon)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              BOSS
            </span>
          )}
        </div>

        {/* Status */}
        <PixelBadge status={status} />

        {/* Context line */}
        <div
          style={{
            fontFamily: 'var(--cth-font-mono)',
            fontSize: 'var(--cth-text-mono-sm)',
            lineHeight: '18px',
            color: 'var(--cth-ink-500)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {agent.currentTask || agent.repoPath || '—'}
        </div>
      </div>
    </div>
  );
}
