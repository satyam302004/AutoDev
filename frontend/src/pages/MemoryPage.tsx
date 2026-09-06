import { useState, useEffect, useCallback } from 'react'
import { MemoryPanel } from '../components/MemoryPanel'
import { PixelPanel } from '../components/ui/PixelPanel'
import { searchMemory } from '../api'
import type { MemoryEntry } from '../types'

interface MemoryPageProps {
  onSelectEntry?: (entry: MemoryEntry) => void
}

export function MemoryPage({ onSelectEntry }: MemoryPageProps) {
  const [entries, setEntries] = useState<MemoryEntry[]>([])
  const [selectedEntry, setSelectedEntry] = useState<MemoryEntry | null>(null)

  const fetchEntries = useCallback(async (query: string) => {
    try {
      const results = await searchMemory(query)
      setEntries(results)
    } catch (error) {
      console.error('Failed to search memory:', error)
      setEntries([])
    }
  }, [])

  useEffect(() => {
    fetchEntries('')
  }, [fetchEntries])

  const handleSearch = (query: string) => {
    fetchEntries(query)
  }

  const handleEntryClick = (entry: MemoryEntry) => {
    setSelectedEntry(entry)
    onSelectEntry?.(entry)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ boxShadow: 'inset 0 -1px 0 var(--cth-ink-900)', background: 'var(--cth-cream-200)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'var(--cth-space-4)' }}>
          <h1
            style={{
              fontFamily: 'var(--cth-font-display)',
              fontSize: 'var(--cth-text-display-md)',
              color: 'var(--cth-ink-900)',
            }}
          >
            MEMORY & KNOWLEDGE
          </h1>
          <p
            style={{
              fontFamily: 'var(--cth-font-ui)',
              fontSize: 'var(--cth-text-body-md)',
              color: 'var(--cth-ink-500)',
              marginTop: 4,
            }}
          >
            Search across all projects, agents, and artifacts
          </p>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: 'var(--cth-space-4)', flex: 1, overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'var(--cth-space-6)' }}>
        {/* Search results */}
        <div style={{ overflow: 'hidden' }}>
          <MemoryPanel
            entries={entries}
            onSearch={handleSearch}
            onEntryClick={handleEntryClick}
          />
        </div>

        {/* Entry detail */}
        <div style={{ overflow: 'hidden' }}>
          {selectedEntry ? (
            <PixelPanel variant="default" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: 'var(--cth-space-4)', flex: 1, overflow: 'hidden' }}>
                <div style={{ marginBottom: 'var(--cth-space-3)' }}>
                  <h2
                    style={{
                      fontFamily: 'var(--cth-font-display)',
                      fontSize: 'var(--cth-text-display-sm)',
                      color: 'var(--cth-ink-900)',
                      marginBottom: 4,
                    }}
                  >
                    {selectedEntry.title}
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--cth-space-4)',
                      fontFamily: 'var(--cth-font-mono)',
                      fontSize: 10,
                      color: 'var(--cth-ink-500)',
                    }}
                  >
                    <span>Type: {selectedEntry.type}</span>
                    {selectedEntry.agent && <span>Agent: {selectedEntry.agent}</span>}
                    <span>{selectedEntry.timestamp}</span>
                    {selectedEntry.quality != null && (
                      <span>Quality: {selectedEntry.quality.toFixed(2)}</span>
                    )}
                  </div>
                </div>
                <div
                  style={{
                    padding: 'var(--cth-space-4)',
                    background: 'var(--cth-paper-100)',
                    boxShadow: 'var(--cth-panel-border-inset)',
                    fontFamily: 'var(--cth-font-mono)',
                    fontSize: 'var(--cth-text-mono-md)',
                    color: 'var(--cth-ink-900)',
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 300px)',
                  }}
                >
                  {selectedEntry.content}
                </div>
              </div>
            </PixelPanel>
          ) : (
            <PixelPanel variant="inset" style={{ height: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  height: '100%',
                  minHeight: 400,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontFamily: 'var(--cth-font-display)',
                      fontSize: 'var(--cth-text-display-sm)',
                      color: 'var(--cth-ink-500)',
                      marginBottom: 'var(--cth-space-2)',
                    }}
                  >
                    NO ENTRY SELECTED
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--cth-font-ui)',
                      fontSize: 'var(--cth-text-body-md)',
                      color: 'var(--cth-ink-300)',
                    }}
                  >
                    Click on a search result to view its content
                  </div>
                </div>
              </div>
            </PixelPanel>
          )}
        </div>
      </div>
    </div>
  )
}
