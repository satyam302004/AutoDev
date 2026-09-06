import type { ReactNode, MouseEventHandler } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

interface PixelButtonProps {
  variant?: Variant;
  size?: Size;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const SIZE_MAP: Record<Size, { height: string; padding: string; font: string }> = {
  sm: { height: '24px', padding: '0 var(--cth-space-2)', font: 'var(--cth-text-display-sm)' },
  md: { height: '32px', padding: '0 var(--cth-space-3)', font: 'var(--cth-text-display-sm)' },
  lg: { height: '40px', padding: '0 var(--cth-space-4)', font: 'var(--cth-text-display-sm)' },
};

const VARIANT_STYLES: Record<Variant, { bg: string; color: string; hoverBg: string }> = {
  primary: {
    bg: 'var(--cth-ink-900)',
    color: 'var(--cth-cream-50)',
    hoverBg: 'var(--cth-ink-700)',
  },
  secondary: {
    bg: 'var(--cth-cream-100)',
    color: 'var(--cth-ink-900)',
    hoverBg: 'var(--cth-cream-200)',
  },
  ghost: {
    bg: 'transparent',
    color: 'var(--cth-ink-700)',
    hoverBg: 'var(--cth-cream-200)',
  },
  destructive: {
    bg: 'var(--cth-coral)',
    color: 'var(--cth-cream-50)',
    hoverBg: 'var(--cth-coral-light)',
  },
};

export function PixelButton({
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  children,
  className,
  style,
}: PixelButtonProps) {
  const sizeStyle = SIZE_MAP[size];
  const varStyle = VARIANT_STYLES[variant];
  const isDisabled = disabled ?? false;

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={className}
      style={{
        fontFamily: 'var(--cth-font-display)',
        fontSize: sizeStyle.font,
        lineHeight: '12px',
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        background: isDisabled ? 'var(--cth-cream-300)' : varStyle.bg,
        color: isDisabled ? 'var(--cth-ink-500)' : varStyle.color,
        border: 'none',
        boxShadow: isDisabled
          ? 'inset 0 0 0 1px var(--cth-ink-300)'
          : `inset 0 0 0 1px ${varStyle.bg === 'transparent' ? 'var(--cth-ink-300)' : varStyle.bg}, 0 1px 0 var(--cth-shadow-hard)`,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        textTransform: 'uppercase',
        transition: 'all 0.1s steps(2, end)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--cth-space-2)',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(1px)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `inset 0 0 0 1px ${varStyle.bg === 'transparent' ? 'var(--cth-ink-300)' : varStyle.bg}`;
        }
      }}
      onMouseUp={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `inset 0 0 0 1px ${varStyle.bg === 'transparent' ? 'var(--cth-ink-300)' : varStyle.bg}, 0 1px 0 var(--cth-shadow-hard)`;
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.transform = '';
        if (!isDisabled) {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = `inset 0 0 0 1px ${varStyle.bg === 'transparent' ? 'var(--cth-ink-300)' : varStyle.bg}, 0 1px 0 var(--cth-shadow-hard)`;
        }
      }}
    >
      {children}
    </button>
  );
}
