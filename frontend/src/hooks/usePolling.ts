import { useEffect, useRef, useState } from 'react'

export function usePolling<T>(
  fetcher: () => Promise<T>,
  intervalMs: number,
  active: boolean,
  onData?: (data: T) => void,
): T | null {
  const [data, setData] = useState<T | null>(null)
  const onDataRef = useRef(onData)

  useEffect(() => {
    onDataRef.current = onData
  })

  useEffect(() => {
    if (!active) return
    let cancelled = false

    const tick = async () => {
      try {
        const result = await fetcher()
        if (cancelled) return
        setData(result)
        onDataRef.current?.(result)
      } catch {
        // transient errors are ignored; polling continues
      }
    }

    void tick()
    const id = setInterval(tick, intervalMs)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [active, intervalMs, fetcher])

  return data
}
