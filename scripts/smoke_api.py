"""Smoke-test the AutoDev REST API end to end.

Spawns its own uvicorn instance with a throwaway SQLite database (so dev data
is never touched), then exercises happy paths, validation errors, 404s,
deletes, exports, and concurrent runs.

Usage:
    backend\\.venv\\Scripts\\python.exe scripts\\smoke_api.py

Exit code 0 if every check passes, 1 otherwise.
"""

import json
import os
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"

PORT = 8765
BASE = f"http://127.0.0.1:{PORT}/api"

EXPECTED_ARTIFACTS = {
    "project_plan.md",
    "requirements.md",
    "architecture.md",
    "plan.md",
    "api_spec.md",
    "ui_plan.md",
    "testing.md",
    "README.md",
    "report.md",
}

failures: list[str] = []


def check(name: str, cond: bool, detail: str = "") -> None:
    marker = "PASS" if cond else "FAIL"
    suffix = f" - {detail}" if detail else ""
    print(f"[{marker}] {name}{suffix}")
    if not cond:
        failures.append(name)


def http(method: str, path: str, body: dict | None = None):
    request = urllib.request.Request(BASE + path, method=method)
    if body is not None:
        request.add_header("Content-Type", "application/json")
        request.data = json.dumps(body).encode()
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
            content_type = response.headers.get("Content-Type", "")
            try:
                parsed = json.loads(raw) if raw and "json" in content_type else raw
            except ValueError:
                parsed = raw
            return response.status, parsed, content_type
    except urllib.error.HTTPError as error:
        raw = error.read()
        try:
            parsed = json.loads(raw) if raw else raw
        except Exception:
            parsed = raw
        return error.code, parsed, error.headers.get("Content-Type", "")
    except urllib.error.URLError:
        return 0, {}, ""


def wait_completed(project_id: str, timeout_s: float = 20.0) -> dict:
    deadline = time.time() + timeout_s
    last: dict = {}
    while time.time() < deadline:
        status, last, _ = http("GET", f"/projects/{project_id}/status")
        if status == 200 and last.get("status") in ("completed", "failed"):
            return last
        time.sleep(0.2)
    return last


def create_project(idea: str, tech: str | None = None) -> dict:
    body: dict = {"idea": idea}
    if tech:
        body["tech_preferences"] = tech
    status, payload, _ = http("POST", "/projects", body)
    assert status == 202, f"create failed: {status} {payload}"
    return payload


def main() -> int:
    server: subprocess.Popen | None = None
    db_file: Path | None = None
    try:
        temp_dir = Path(tempfile.mkdtemp(prefix="autodev-smoke-"))
        db_file = temp_dir / "smoke.db"
        env = os.environ.copy()
        env["DATABASE_URL"] = f"sqlite:///{db_file.as_posix()}"
        env["LLM_MAX_RETRIES"] = "0"

        server = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app", "--port", str(PORT), "--log-level", "warning"],
            cwd=str(BACKEND_DIR),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )

        deadline = time.time() + 20
        healthy = False
        while time.time() < deadline:
            status, _, _ = http("GET", "/health")
            if status == 200:
                healthy = True
                break
            time.sleep(0.3)
        check("server starts and /api/health responds", healthy)

        # --- validation errors -------------------------------------------------
        status, payload, _ = http("POST", "/projects", {"idea": "too short"})
        check("idea < 10 chars rejected", status == 422, f"got {status}")
        status, payload, _ = http("POST", "/projects", {})
        check("missing idea rejected", status == 422, f"got {status}")
        status, payload, _ = http("POST", "/projects", {"idea": "x" * 10_001})
        check("idea > 10k chars rejected", status == 422, f"got {status}")

        # --- happy path --------------------------------------------------------
        created = create_project("Build a fitness tracking app with workout plans")
        check(
            "create returns job/project ids",
            {"job_id", "project_id", "status"}.issubset(created.keys()),
            str(created),
        )
        project_id = created["project_id"]

        status_payload = wait_completed(project_id)
        check("job reaches completed", status_payload.get("status") == "completed", str(status_payload))
        check(
            "status reports 10/10 steps",
            status_payload.get("completed") == 10 and status_payload.get("total") == 10,
            str(status_payload),
        )
        check(
            "progress is 1.0 at completion",
            abs(status_payload.get("progress", 0) - 1.0) < 1e-6,
            str(status_payload),
        )

        status, detail, _ = http("GET", f"/projects/{project_id}")
        check("detail fetch returns 200", status == 200, f"got {status}")
        check("detail has 8 agent runs", len(detail.get("agent_runs", [])) == 8, str(len(detail.get("agent_runs", []))))
        check("detail has 9 artifacts", len(detail.get("artifacts", [])) == 9, str(len(detail.get("artifacts", []))))
        check(
            "detail artifacts are the expected files",
            {a["filename"] for a in detail.get("artifacts", [])} == EXPECTED_ARTIFACTS,
        )
        check("detail has execution record", detail.get("execution") is not None)
        check("detail has cost/quality fields", "cost" in detail and "quality" in detail)

        status, report, _ = http("GET", f"/projects/{project_id}/report")
        check("report returns 200", status == 200, f"got {status}")
        check(
            "report markdown non-empty",
            isinstance(report.get("markdown"), str) and len(report["markdown"]) > 500,
            f"{len(report.get('markdown', ''))} chars",
        )
        check("report matches project id", report.get("project_id") == project_id)

        status, artifacts, _ = http("GET", f"/projects/{project_id}/artifacts")
        check("artifacts endpoint returns 200", status == 200, f"got {status}")
        check(
            "artifacts have content",
            all(isinstance(a.get("content"), str) and len(a["content"]) > 50 for a in artifacts),
        )

        # --- exports -----------------------------------------------------------
        status, body, content_type = http("GET", f"/projects/{project_id}/export/pdf")
        check("pdf export is application/pdf", status == 200 and "pdf" in content_type, content_type)
        check("pdf has bytes", status == 200 and len(body) > 1000, f"{len(body)} bytes")
        status, body, content_type = http("GET", f"/projects/{project_id}/export/docx")
        check("docx export is a docx stream", status == 200 and "wordprocessingml" in content_type, content_type)
        check("docx has bytes", status == 200 and len(body) > 1000, f"{len(body)} bytes")

        # --- 404s --------------------------------------------------------------
        for path in (
            "/projects/does-not-exist",
            "/projects/does-not-exist/status",
            "/projects/does-not-exist/report",
            "/projects/does-not-exist/artifacts",
            "/projects/does-not-exist/export/pdf",
            "/projects/does-not-exist/export/docx",
        ):
            status, _, _ = http("GET", path)
            check(f"404 on {path}", status == 404, f"got {status}")

        # --- delete --------------------------------------------------------------
        status, _, _ = http("DELETE", f"/projects/{project_id}")
        check("delete returns 204", status == 204, f"got {status}")
        status, _, _ = http("GET", f"/projects/{project_id}")
        check("deleted project gone from detail", status == 404, f"got {status}")
        status, _, _ = http("DELETE", f"/projects/{project_id}")
        check("second delete returns 404", status == 404, f"got {status}")

        # --- concurrent runs ------------------------------------------------------
        ids = [
            create_project(f"Concurrent project number {i} with distinct scope and features", "Python")["project_id"]
            for i in range(3)
        ]
        results = [wait_completed(project_id) for project_id in ids]
        check("all concurrent runs complete", all(r.get("status") == "completed" for r in results), str(results))

        status, projects, _ = http("GET", "/projects")
        check("project list includes concurrent runs", status == 200 and all(pid in {p["id"] for p in projects} for pid in ids))
        check("list entries carry summary fields", all({"id", "title", "status", "quality", "cost", "created_at"} <= set(p) for p in projects))

        print()
        if failures:
            print(f"RESULT: {len(failures)} check(s) FAILED:")
            for failure in failures:
                print(f"  - {failure}")
            return 1
        print("RESULT: all smoke checks passed")
        return 0
    finally:
        if server is not None:
            server.terminate()
            try:
                server.wait(timeout=5)
            except subprocess.TimeoutExpired:
                server.kill()
                server.wait(timeout=5)
            time.sleep(0.5)
        if db_file is not None:
            for suffix in ("", "-wal", "-shm"):
                path = Path(f"{db_file}{suffix}")
                for _ in range(5):
                    try:
                        path.unlink(missing_ok=True)
                        break
                    except PermissionError:
                        time.sleep(0.5)


if __name__ == "__main__":
    sys.exit(main())
