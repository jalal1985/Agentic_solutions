Agentic AI Site — Minimal multi-agent demo

Requirements:
- Node.js (v16+ recommended)

Quick start:

```bash
cd ai-website
npm install
npm start
```

Open http://localhost:3000 in your browser.

Notes:
- The server uses a mocked `runSubagent` implementation in `server.js` that simulates parallel agents and returns aggregated summaries.
- A new 3-agent review workflow is available on the homepage, simulating builder/checker/inspector iterations until mockup differences are minimal.
- If you want, I can add Docker support so you don't need Node installed locally.
