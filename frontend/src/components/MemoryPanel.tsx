import { useState } from 'react';
import { PixelPanel } from './ui/PixelPanel';
import { PixelButton } from './ui/PixelButton';

interface MemoryEntry {
  id: string;
  type: 'project' | 'agent' | 'artifact';
  title: string;
  content: string;
  agent?: string;
  project_id?: string;
  timestamp: string;
  quality?: number | null;
}

interface MemoryPanelProps {
  entries: MemoryEntry[];
  onSearch?: (query: string) => void;
  onEntryClick?: (entry: MemoryEntry) => void;
  className?: string;
}

type FilterType = 'all' | 'project' | 'agent' | 'artifact';

const filterTabs: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'project', label: 'Projects' },
  { key: 'agent', label: 'Agents' },
  { key: 'artifact', label: 'Artifacts' },
];

export function MemoryPanel({
  entries,
  onSearch,
  onEntryClick,
  className = '',
}: MemoryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredEntries = entries.filter((entry) => {
    if (activeFilter !== 'all' && entry.type !== activeFilter) {
      return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.content.toLowerCase().includes(query) ||
        entry.agent?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const handleSearch = () => {
    onSearch?.(searchQuery);
  };

  return (
    <PixelPanel variant="inset" className={className}>
      <div style={{ padding: 'var(--cth-space-3)' }}>
        {/* Search bar */}
        <div style={{ display: 'flex', gap: 'var(--cth-space-2)', marginBottom: 'var(--cth-space-3)' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search across all projects..."
            style={{ flex: 1, height: 32 }}
          />
          <PixelButton variant="primary" size="md" onClick={handleSearch}>
            SEARCH
          </PixelButton>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 'var(--cth-space-3)',
            paddingBottom: 'var(--cth-space-2)',
            boxShadow: 'inset 0 -1px 0 var(--cth-ink-900)',
          }}
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              style={{
                padding: '4px 8px',
                fontFamily: 'var(--cth-font-display)',
                fontSize: 8,
                background: activeFilter === tab.key ? 'var(--cth-ink-900)' : 'var(--cth-cream-100)',
                color: activeFilter === tab.key ? 'var(--cth-cream-50)' : 'var(--cth-ink-900)',
                boxShadow: activeFilter === tab.key
                  ? 'none'
                  : 'inset 0 0 0 1px var(--cth-ink-900)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Results list */}
        <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-2)' }}>
          {filteredEntries.length === 0 ? (
            <div
              style={{
                padding: 'var(--cth-space-8)',
                textAlign: 'center',
                fontFamily: 'var(--cth-font-ui)',
                fontSize: 'var(--cth-text-body-md)',
                color: 'var(--cth-ink-300)',
              }}
            >
              No results found
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => onEntryClick?.(entry)}
                style={{
                  padding: 'var(--cth-space-3)',
                  background: 'var(--cth-cream-50)',
                  boxShadow: 'inset 0 0 0 1px var(--cth-ink-900)',
                  cursor: 'pointer',
                  transition: 'all 0.1s steps(2, end)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--cth-cream-200)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--cth-cream-50)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: 'var(--cth-font-ui)',
                      fontSize: 'var(--cth-text-body-md)',
                      color: 'var(--cth-ink-900)',
                    }}
                  >
                    {entry.title}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--cth-font-mono)',
                      fontSize: 10,
                      color: 'var(--cth-ink-500)',
                    }}
                  >
                    {entry.timestamp}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--cth-font-ui)',
                    fontSize: 'var(--cth-text-body-sm)',
                    color: 'var(--cth-ink-500)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.content.substring(0, 100)}...
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--cth-space-2)', marginTop: 8 }}>
                  <span
                    style={{
                      padding: '2px 4px',
                      fontFamily: 'var(--cth-font-display)',
                      fontSize: 8,
                      background: 'var(--cth-cream-200)',
                      boxShadow: 'inset 0 0 0 1px var(--cth-ink-300)',
                      color: 'var(--cth-ink-700)',
                      textTransform: 'lowercase',
                    }}
                  >
                    {entry.type}
                  </span>
                  {entry.agent && (
                    <span
                      style={{
                        fontFamily: 'var(--cth-font-mono)',
                        fontSize: 10,
                        color: 'var(--cth-ink-500)',
                      }}
                    >
                      by {entry.agent}
                    </span>
                  )}
                  {entry.quality != null && (
                    <span
                      style={{
                        fontFamily: 'var(--cth-font-mono)',
                        fontSize: 10,
                        color: 'var(--cth-mint)',
                      }}
                    >
                      Quality: {entry.quality.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PixelPanel>
  );
}
