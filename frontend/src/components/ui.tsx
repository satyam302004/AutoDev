import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={className}
      style={{
        background: 'var(--cth-cream-100)',
        boxShadow: 'var(--cth-panel-border)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  subtitle,
  right,
}: {
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 'var(--cth-space-3) var(--cth-space-4)',
        boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)',
      }}
    >
      <div>
        <h2
          style={{
            fontFamily: 'var(--cth-font-display)',
            fontSize: 'var(--cth-text-display-sm)',
            lineHeight: '12px',
            color: 'var(--cth-ink-900)',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              marginTop: 2,
              fontFamily: 'var(--cth-font-ui)',
              fontSize: 'var(--cth-text-body-sm)',
              color: 'var(--cth-ink-500)',
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {right}
    </div>
  )
}

export function Badge({
  children,
  color = 'slate',
}: {
  children: ReactNode
  color?: 'slate' | 'green' | 'blue' | 'red' | 'amber'
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    slate: { bg: 'var(--cth-cream-200)', fg: 'var(--cth-ink-700)' },
    green: { bg: 'var(--cth-mint-light)', fg: 'var(--cth-mint)' },
    blue: { bg: 'var(--cth-sky-light)', fg: 'var(--cth-sky)' },
    red: { bg: 'var(--cth-coral-light)', fg: 'var(--cth-coral)' },
    amber: { bg: 'var(--cth-lemon-light)', fg: 'var(--cth-lemon)' },
  }
  const p = palette[color] ?? palette.slate
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--cth-space-1)',
        padding: '2px var(--cth-space-2)',
        background: p.bg,
        fontFamily: 'var(--cth-font-display)',
        fontSize: 'var(--cth-text-display-sm)',
        lineHeight: '12px',
        color: p.fg,
        textTransform: 'lowercase',
      }}
    >
      {children}
    </span>
  )
}

export function Spinner({ size = 16 }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: 'cth-pulse 0.8s steps(2, end) infinite' }}
    >
      <circle cx="12" cy="12" r="10" stroke="var(--cth-ink-300)" strokeWidth="4" opacity="0.3" />
      <path
        fill="var(--cth-sky)"
        d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 0 1 4 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

export function Stat({
  label,
  value,
  sub,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: 'var(--cth-font-display)',
          fontSize: 'var(--cth-text-display-sm)',
          lineHeight: '12px',
          color: 'var(--cth-ink-500)',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 4,
          fontFamily: 'var(--cth-font-mono)',
          fontSize: 'var(--cth-text-body-lg)',
          fontWeight: 600,
          color: 'var(--cth-ink-900)',
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: 'var(--cth-font-ui)',
            fontSize: 'var(--cth-text-body-sm)',
            color: 'var(--cth-ink-300)',
          }}
        >
          {sub}
        </div>
      )}
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: 128,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--cth-space-6)',
        textAlign: 'center',
        boxShadow: 'inset 0 0 0 1px dashed var(--cth-ink-300)',
        fontFamily: 'var(--cth-font-ui)',
        fontSize: 'var(--cth-text-body-sm)',
        color: 'var(--cth-ink-300)',
      }}
    >
      {message}
    </div>
  )
}

// Re-export pixel components
export { PixelPanel } from './ui/PixelPanel'
export { PixelButton } from './ui/PixelButton'
export { PixelBadge } from './ui/PixelBadge'
