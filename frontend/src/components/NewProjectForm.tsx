import { useState } from 'react'
import { PixelButton } from './ui/PixelButton'
import { Spinner } from './ui'

export function NewProjectForm({
  busy,
  onGenerate,
}: {
  busy: boolean
  onGenerate: (idea: string, techPreferences: string) => void
}) {
  const [idea, setIdea] = useState('')
  const [tech, setTech] = useState('')
  const [error, setError] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    const trimmed = idea.trim()
    if (trimmed.length < 10) {
      setError('Describe your idea in at least 10 characters.')
      return
    }
    setError('')
    onGenerate(trimmed, tech.trim())
    setIdea('')
    setTech('')
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--cth-space-3)' }}>
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        rows={3}
        placeholder="Describe the app you want to build..."
        style={{ width: '100%', resize: 'none' }}
      />
      <input
        value={tech}
        onChange={(e) => setTech(e.target.value)}
        placeholder="Tech preferences (optional)"
        style={{ width: '100%' }}
      />
      {error && (
        <p style={{ fontFamily: 'var(--cth-font-mono)', fontSize: 10, color: 'var(--cth-coral)' }}>{error}</p>
      )}
      <PixelButton variant="primary" disabled={busy} style={{ width: '100%' }}>
        {busy ? <><Spinner size={12} /> GENERATING...</> : 'GENERATE'}
      </PixelButton>
    </form>
  )
}
