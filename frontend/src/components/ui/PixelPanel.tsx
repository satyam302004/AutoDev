import type { ReactNode } from 'react';

type Variant = 'default' | 'inset' | 'active' | 'terminal' | 'dialog';
type Accent = 'coral' | 'mint' | 'sky' | 'lemon' | 'lilac' | 'peach';

interface PixelPanelProps {
  variant?: Variant;
  accent?: Accent;
  title?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const ACCENT_MAP: Record<Accent, string> = {
  coral: 'var(--cth-coral)',
  mint: 'var(--cth-mint)',
  sky: 'var(--cth-sky)',
  lemon: 'var(--cth-lemon)',
  lilac: 'var(--cth-lilac)',
  peach: 'var(--cth-peach)',
};

const ACCENT_LIGHT_MAP: Record<Accent, string> = {
  coral: 'var(--cth-coral-light)',
  mint: 'var(--cth-mint-light)',
  sky: 'var(--cth-sky-light)',
  lemon: 'var(--cth-lemon-light)',
  lilac: 'var(--cth-lilac-light)',
  peach: 'var(--cth-peach-light)',
};

const FILL_MAP: Record<Variant, string> = {
  default: 'var(--cth-cream-100)',
  inset: 'var(--cth-cream-200)',
  active: 'var(--cth-cream-100)',
  terminal: 'var(--cth-paper-100)',
  dialog: 'var(--cth-cream-50)',
};

function boxShadow(variant: Variant, accent?: Accent): string {
  if (variant === 'active' && accent) {
    return `
      inset 0 0 0 1px var(--cth-ink-100),
      inset 0 0 0 3px ${ACCENT_MAP[accent]},
      inset 0 0 0 5px var(--cth-ink-900)`;
  }
  if (variant === 'dialog') {
    return 'var(--cth-panel-border-dialog)';
  }
  if (variant === 'terminal') {
    return 'var(--cth-panel-border-terminal)';
  }
  if (variant === 'inset') {
    return 'var(--cth-panel-border-inset)';
  }
  return 'var(--cth-panel-border)';
}

export function PixelPanel({ variant = 'default', accent, title, children, className, style }: PixelPanelProps) {
  const headerBg = accent ? ACCENT_LIGHT_MAP[accent] : 'var(--cth-cream-200)';

  return (
    <div
      className={className}
      style={{
        background: FILL_MAP[variant],
        boxShadow: boxShadow(variant, accent),
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        ...style,
      }}
    >
      {title && (
        <div
          style={{
            padding: 'var(--cth-space-2) var(--cth-space-3)',
            background: headerBg,
            boxShadow: 'inset 0 -1px 0 var(--cth-ink-900)',
            fontFamily: 'var(--cth-font-display)',
            fontSize: 'var(--cth-text-display-sm)',
            lineHeight: '12px',
            color: 'var(--cth-ink-700)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--cth-space-2)',
            flexShrink: 0,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
