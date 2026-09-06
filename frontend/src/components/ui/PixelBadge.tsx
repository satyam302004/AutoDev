type Status = 'idle' | 'thinking' | 'working' | 'waiting' | 'blocked' | 'success' | 'error' | 'ghost';

interface PixelBadgeProps {
  status: Status;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

const STATUS_COLORS: Record<Status, string> = {
  idle: 'var(--cth-status-idle)',
  thinking: 'var(--cth-status-thinking)',
  working: 'var(--cth-status-working)',
  waiting: 'var(--cth-status-waiting)',
  blocked: 'var(--cth-status-blocked)',
  success: 'var(--cth-status-success)',
  error: 'var(--cth-status-error)',
  ghost: 'var(--cth-ink-300)',
};

const STATUS_LABELS: Record<Status, string> = {
  idle: 'idle',
  thinking: 'thinking',
  working: 'working',
  waiting: 'waiting',
  blocked: 'blocked',
  success: 'done',
  error: 'error',
  ghost: 'ghost',
};

export function PixelBadge({ status, label, className, style }: PixelBadgeProps) {
  const color = STATUS_COLORS[status];
  const text = label ?? STATUS_LABELS[status];
  const isAnimated = status === 'thinking' || status === 'working';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--cth-space-1)',
        padding: '2px var(--cth-space-2)',
        boxShadow: `inset 0 0 0 1px ${color}`,
        background: 'var(--cth-cream-50)',
        ...style,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          flexShrink: 0,
          background: color,
          boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)',
          animation: isAnimated ? 'cth-pulse 0.8s steps(2, end) infinite' : undefined,
        }}
      />
      <span
        style={{
          fontFamily: 'var(--cth-font-display)',
          fontSize: 'var(--cth-text-display-sm)',
          lineHeight: '12px',
          color: 'var(--cth-ink-700)',
          textTransform: 'lowercase',
        }}
      >
        {text}
      </span>
    </span>
  );
}
