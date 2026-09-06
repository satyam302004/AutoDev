import { agentAccents, type AgentName } from '../design/tokens';

interface AgentAvatarProps {
  agent: AgentName;
  size?: number;
  status?: 'idle' | 'thinking' | 'working' | 'blocked' | 'success';
}

const agentInitials: Record<AgentName, string> = {
  project_manager: 'PM',
  requirements: 'RE',
  architecture: 'AR',
  planning: 'PL',
  backend: 'BE',
  frontend: 'FE',
  qa: 'QA',
  documentation: 'DO',
  report: 'RP',
};

const statusOverlays: Record<string, string> = {
  thinking: '...',
  blocked: '!',
  success: '\u2605',
};

export function AgentAvatar({
  agent,
  size = 32,
  status = 'idle',
}: AgentAvatarProps) {
  const accent = agentAccents[agent];
  const initial = agentInitials[agent];
  const overlay = statusOverlays[status];

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        boxShadow: 'inset 0 0 0 2px var(--cth-ink-900)',
        background: 'var(--cth-cream-100)',
        imageRendering: 'pixelated',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          backgroundColor: accent,
        }}
      />
      <span
        style={{
          position: 'relative',
          fontFamily: 'var(--cth-font-display)',
          fontSize: 8,
          lineHeight: '8px',
          color: accent,
        }}
      >
        {initial}
      </span>
      {overlay && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 12,
            height: 12,
            fontFamily: 'var(--cth-font-display)',
            fontSize: 6,
            lineHeight: '6px',
            boxShadow: 'inset 0 0 0 1px var(--cth-ink-900)',
            background: status === 'success' ? 'var(--cth-mint)' : status === 'blocked' ? 'var(--cth-coral)' : 'var(--cth-sky)',
            color: 'var(--cth-cream-50)',
          }}
        >
          {overlay}
        </span>
      )}
    </div>
  );
}
