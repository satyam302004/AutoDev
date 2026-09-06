import { useState } from 'react'
import type { Artifact } from '../types'
import { ARTIFACT_TABS } from '../lib/steps'
import { PixelPanel } from './ui/PixelPanel'
import { Markdown } from './Markdown'

export function ArtifactViewer({
  artifacts,
  initialTab,
  onTabChange,
}: {
  artifacts: Artifact[]
  initialTab?: string
  onTabChange?: (filename: string | null) => void
}) {
  const [activeTab, setActiveTab] = useState(initialTab ?? ARTIFACT_TABS[0].key)

  const active = ARTIFACT_TABS.find((t) => t.key === activeTab) ?? ARTIFACT_TABS[0]
  const artifact = artifacts.find((a) => a.filename === active.filename)

  const selectTab = (key: string, filename: string | null) => {
    setActiveTab(key)
    onTabChange?.(filename)
  }

  return (
    <PixelPanel variant="default" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      {/* Header */}
      <div
        style={{
          padding: 'var(--cth-space-2) var(--cth-space-3)',
          background: 'var(--cth-cream-200)',
          boxShadow: 'inset 0 -1px 0 var(--cth-ink-900)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: 'var(--cth-font-display)',
            fontSize: 'var(--cth-text-display-sm)',
            lineHeight: '12px',
            color: 'var(--cth-ink-700)',
          }}
        >
          ARTIFACTS
        </span>
        <span
          style={{
            fontFamily: 'var(--cth-font-mono)',
            fontSize: 10,
            color: 'var(--cth-ink-500)',
          }}
        >
          {artifact ? artifact.filename : `${artifacts.length} files`}
        </span>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          padding: 'var(--cth-space-2) var(--cth-space-3) 0',
          boxShadow: 'inset 0 -1px 0 var(--cth-ink-100)',
          flexShrink: 0,
        }}
      >
        {ARTIFACT_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => selectTab(tab.key, tab.filename)}
            style={{
              padding: '4px 10px',
              fontFamily: 'var(--cth-font-display)',
              fontSize: 8,
              background: activeTab === tab.key ? 'var(--cth-cream-100)' : 'transparent',
              color: activeTab === tab.key ? 'var(--cth-ink-900)' : 'var(--cth-ink-500)',
              boxShadow: activeTab === tab.key ? 'inset 0 -2px 0 var(--cth-sky)' : 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--cth-space-4)' }}>
        {artifact ? (
          <Markdown content={artifact.content} />
        ) : (
          <div
            style={{
              display: 'flex',
              minHeight: 200,
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 0 0 1px dashed var(--cth-ink-300)',
              fontFamily: 'var(--cth-font-ui)',
              fontSize: 'var(--cth-text-body-sm)',
              color: 'var(--cth-ink-300)',
            }}
          >
            This artifact has not been generated for this project.
          </div>
        )}
      </div>
    </PixelPanel>
  )
}
