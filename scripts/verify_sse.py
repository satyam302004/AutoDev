"""Verify the SSE status stream over real HTTP.

`backend/tests/test_events.py` cannot prove that `/api/projects/{id}/events`
actually *streams*: TestClient's ASGI transport buffers the entire response
body before returning, so a connection that stays open forever would simply
hang the test. That test therefore only covers terminal streams and the
payload builder.

This script closes that gap by starting a real uvicorn and asserting, from the
client's point of view:

  1. unknown project                -> 404
  2. non-terminal project           -> 200 text/event-stream; the first
     snapshot arrives early AND a second read succeeds ~15s later. A proxy or
     server that buffered the body until close could not deliver line one
     early while keeping the connection open, so these two together are the
     proof of incremental delivery.
  3. keepalive comment              -> arrives at ~15s (the generator loop is
     genuinely running, not a closed response)
  4. terminal project               -> exactly one snapshot, then the server
     closes promptly (so EventSource does not reconnect forever)

It seeds rows directly instead of POSTing, because POST would enqueue a real
job and make real LLM calls.

Usage:
    python scripts/verify_sse.py
"""

import json
import os
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
DB = BACKEND / "verify_sse.db"
PORT = int(os.environ.get("AUTODEV_SSE_PORT", "8017"))
DB_URL = f"sqlite:///{DB.as_posix()}"
KEEPALIVE_S = 15.0

results = []


def check(name, ok, detail=""):
    results.append((name, ok, detail))
    print(f"  {'PASS' if ok else 'FAIL'}  {name}" + (f"  [{detail}]" if detail else ""), flush=True)


def stage(msg):
    print(f"[stage] {msg}", flush=True)


def main():
    stage(f"start; db={DB}")
    for stale in (DB, BACKEND / "verify_sse.db-shm", BACKEND / "verify_sse.db-wal"):
        if stale.exists():
            stale.unlink()

    # Must be set on THIS process too, not just the child's: the seed rows below
    # go through app.core.db, which resolves DATABASE_URL at import time.
    os.environ["DATABASE_URL"] = DB_URL
    env = dict(os.environ)

    stage(f"launching uvicorn on {PORT}")
    server = subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "app.main:app",
            "--port",
            str(PORT),
            "--log-level",
            "warning",
        ],
        cwd=str(BACKEND),
        env=env,
    )
    try:
        for i in range(60):
            try:
                urllib.request.urlopen(f"http://127.0.0.1:{PORT}/api/health", timeout=1)
                stage(f"healthy after {i + 1} tries")
                break
            except Exception:
                time.sleep(0.5)
        else:
            raise SystemExit("server never became healthy")

        stage("seeding")
        sys.path.insert(0, str(BACKEND))
        from app.core.db import session_factory
        from app.models.entities import Project

        # Construct with the desired status directly. The repo helper resolves
        # rows via session.get(), and with autoflush=False that cannot see a row
        # which was add()ed but not yet flushed - update_project() would return
        # None and the change would be silently dropped.
        s = session_factory()
        s.add(Project(id="sse-pending", title="pending fixture", status="pending"))
        s.add(Project(id="sse-done", title="done fixture", status="completed"))
        s.commit()
        s.close()

        verify = session_factory()
        for pid in ("sse-pending", "sse-done"):
            row = verify.get(Project, pid)
            stage(f"read-back {pid} -> {row.status if row else 'MISSING'}")
        verify.close()

        import httpx

        base = f"http://127.0.0.1:{PORT}/api/projects"
        # Generous read timeout so the 15s keepalive fits; every blocking read
        # is therefore bounded rather than infinite.
        with httpx.Client(timeout=httpx.Timeout(5.0, read=KEEPALIVE_S + 10)) as client:
            r = client.get(f"{base}/does-not-exist/events")
            check("unknown project -> 404", r.status_code == 404, f"got {r.status_code}")

            # --- non-terminal: must stream incrementally and hold ---------------
            stage("opening pending stream")
            with client.stream("GET", f"{base}/sse-pending/events") as resp:
                check("200 on /events", resp.status_code == 200, f"got {resp.status_code}")
                ct = resp.headers.get("content-type", "")
                check("content-type is text/event-stream", ct.startswith("text/event-stream"), ct)

                t0 = time.time()
                lines = []
                first_data_at = None
                ping_at = None
                error = None
                try:
                    for line in resp.iter_lines():
                        lines.append(line)
                        if line.startswith("data: ") and first_data_at is None:
                            first_data_at = time.time() - t0
                        if line == ": ping":
                            ping_at = time.time() - t0
                            break
                except Exception as exc:
                    error = type(exc).__name__

                data = [l for l in lines if l.startswith("data: ")]
                check(
                    "first snapshot arrives early",
                    first_data_at is not None and first_data_at < 1.0,
                    f"{first_data_at:.3f}s" if first_data_at is not None else "never",
                )
                if data:
                    payload = json.loads(data[0][6:])
                    check(
                        "snapshot is a well-formed JobStatus",
                        payload.get("status") == "pending"
                        and payload.get("project_id") == "sse-pending",
                        f"status={payload.get('status')}",
                    )
                # Reaching a SECOND read ~15s later proves the connection was
                # open the whole time rather than a single buffered blob.
                check(
                    "connection held open ~15s (incremental)",
                    ping_at is not None,
                    f"ping at {ping_at:.1f}s" if ping_at else f"no ping ({error})",
                )
                check(
                    "keepalive comment sent",
                    ping_at is not None,
                    f"t={ping_at:.1f}s" if ping_at else "missing",
                )

            # --- terminal: must snapshot then close ------------------------------
            stage("opening terminal stream")
            t1 = time.time()
            terminal_lines = []
            saw_ping = False
            with client.stream("GET", f"{base}/sse-done/events") as resp:
                for line in resp.iter_lines():
                    terminal_lines.append(line)
                    if line == ": ping":
                        # Bounded instead of infinite: a ping here means the
                        # server did not consider the run terminal.
                        saw_ping = True
                        break
            elapsed = time.time() - t1

            data = [l for l in terminal_lines if l.startswith("data: ")]
            check(
                "terminal stream closed instead of keepalive",
                not saw_ping,
                "kept open" if saw_ping else "closed",
            )
            check("terminal stream emits exactly one snapshot", len(data) == 1, f"n={len(data)}")
            if data:
                payload = json.loads(data[0][6:])
                check(
                    "terminal snapshot is completed",
                    payload.get("status") == "completed",
                    payload.get("status"),
                )
            check("terminal stream closed promptly", elapsed < 3.0, f"{elapsed:.3f}s")

        stage("http phase done")
    finally:
        server.terminate()
        try:
            server.wait(timeout=10)
        except Exception:
            server.kill()
        # SQLite may hold the handle a beat after the process dies.
        for _ in range(20):
            try:
                for p in (DB, BACKEND / "verify_sse.db-shm", BACKEND / "verify_sse.db-wal"):
                    if p.exists():
                        p.unlink()
                break
            except PermissionError:
                time.sleep(0.25)
        else:
            # Harmless (gitignored, and deleted at the start of the next run),
            # but say so rather than leaving a mystery file behind.
            stage(f"note: could not remove {DB.name} (still locked); the next run clears it")

    failed = [n for n, ok, _ in results if not ok]
    print(flush=True)
    print(f"{len(results) - len(failed)}/{len(results)} passed", flush=True)
    if failed:
        print("FAILURES: " + ", ".join(failed), flush=True)
        raise SystemExit(1)
    print("SSE VERIFIED OVER REAL HTTP", flush=True)


if __name__ == "__main__":
    main()
