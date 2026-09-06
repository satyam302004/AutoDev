interface TopBarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'DASHBOARD' },
  { id: 'history', label: 'HISTORY' },
  { id: 'memory', label: 'MEMORY' },
  { id: 'settings', label: 'SETTINGS' },
];

export function TopBar({ currentView, onViewChange }: TopBarProps) {
  return (
    <div
      style={{
        height: 40,
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--cth-space-3)',
        background: 'var(--cth-ink-900)',
        boxShadow: 'inset 0 -1px 0 var(--cth-ink-700)',
        gap: 'var(--cth-space-1)',
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: 'var(--cth-font-display)',
          fontSize: 'var(--cth-text-display-sm)',
          lineHeight: '12px',
          color: 'var(--cth-lemon)',
          marginRight: 'var(--cth-space-4)',
          letterSpacing: '1px',
        }}
      >
        AUTODEV
      </span>

      {/* Nav items */}
      {NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          onClick={() => onViewChange(item.id)}
          style={{
            padding: 'var(--cth-space-2) var(--cth-space-3)',
            background: currentView === item.id ? 'var(--cth-ink-700)' : 'transparent',
            color: currentView === item.id ? 'var(--cth-cream-50)' : 'var(--cth-ink-300)',
            border: 'none',
            boxShadow: currentView === item.id ? 'inset 0 -2px 0 var(--cth-lemon)' : 'inset 0 -2px 0 transparent',
            fontFamily: 'var(--cth-font-display)',
            fontSize: 'var(--cth-text-display-sm)',
            lineHeight: '12px',
            cursor: 'pointer',
            transition: 'all 0.1s steps(2, end)',
            textTransform: 'uppercase',
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
