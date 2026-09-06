import { useCallback, useEffect, useState } from 'react'
import { getProject, listProjects } from '../api'
import type { ProjectSummary } from '../types'

export function useProjectsData() {
  const [projects, setProjects] = useState<ProjectSummary[]>([])
  const [runtimes, setRuntimes] = useState<Record<string, number | null>>({})
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listProjects()
      setProjects(list)
      const done = list.filter((p) => p.status === 'completed').slice(0, 20)
      const entries = await Promise.all(
        done.map(async (p) => {
          try {
            const detail = await getProject(p.id)
            return [p.id, detail.execution?.duration ?? null] as const
          } catch {
            return [p.id, null] as const
          }
        }),
      )
      setRuntimes(Object.fromEntries(entries))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { projects, runtimes, loading, refresh }
}
