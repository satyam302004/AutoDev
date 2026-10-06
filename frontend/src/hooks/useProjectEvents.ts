import { useEffect, useRef, useState } from 'react';
import type { JobStatus } from '../types';

/** How long to wait for the first snapshot before giving up on SSE. */
const SILENCE_TIMEOUT_MS = 4000;

export type ProjectEventsOptions = {
  projectId: string | null;
  active: boolean;
  onData: (status: JobStatus) => void;
};

/**
 * Subscribe to server-sent job status for a project.
 *
 * Returns `true` while the stream is delivering, so the caller can keep its
 * 1s polling loop as a fallback instead of a primary transport. The fallback
 * engages when EventSource is unsupported, the connection errors, or nothing
 * arrives within SILENCE_TIMEOUT_MS - which is also what happens behind
 * proxies that buffer or strip `text/event-stream`.
 *
 * The server closes the stream after a terminal snapshot; we close our end too
 * so the browser does not reconnect forever on a finished run.
 */
export function useProjectEvents({ projectId, active, onData }: ProjectEventsOptions): boolean {
  const [healthy, setHealthy] = useState(false);
  const onDataRef = useRef(onData);

  useEffect(() => {
    onDataRef.current = onData;
  });

  useEffect(() => {
    if (!active || !projectId || typeof EventSource === 'undefined') {
      setHealthy(false);
      return;
    }

    let closed = false;
    let silence: number | undefined;
    const source = new EventSource(`/api/projects/${projectId}/events`);

    const close = (ok: boolean) => {
      if (closed) return;
      closed = true;
      if (silence !== undefined) window.clearTimeout(silence);
      source.close();
      setHealthy(ok);
    };

    // Only start the silence budget once the connection is actually open;
    // otherwise a slow DNS lookup would be mistaken for a silent server.
    source.onopen = () => {
      if (closed) return;
      setHealthy(true);
      silence = window.setTimeout(() => close(false), SILENCE_TIMEOUT_MS);
    };

    source.onmessage = (event) => {
      if (closed) return;
      let status: JobStatus;
      try {
        status = JSON.parse(event.data) as JobStatus;
      } catch {
        close(false);
        return;
      }
      onDataRef.current?.(status);
      if (silence !== undefined) {
        window.clearTimeout(silence);
        silence = undefined;
      }
      if (status.status === 'completed' || status.status === 'failed') close(true);
    };

    source.onerror = () => close(false);

    return () => close(false);
  }, [projectId, active]);

  return healthy;
}
