# AutoDev Frontend

React + TypeScript + Vite dashboard for AutoDev. Live multi-agent pipeline view driven by a server-sent event stream (with a 1s polling fallback), agent cards, artifact viewer, metrics cards, projects history, PDF/DOCX/JSON exports, pixel-art office scene.

## Run

```bash
npm install
npm run dev     # http://localhost:5173 (proxies /api to backend on :8000)
npm run build   # typecheck + production build to dist/
```

Backend must be running first (see repo root README).
