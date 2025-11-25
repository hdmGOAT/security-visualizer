# Security Visualizer (Frontend)

This folder contains the React + TypeScript frontend used to visualize PDA/DFA runs and packet sequences.

Quick start (development)

1. Install dependencies:

```bash
cd security-visualizer
npm install
```

2. Start the dev server (Vite):

```bash
npm run dev
```

3. Open the app in your browser (usually http://localhost:5173).

Build (production):

```bash
npm run build
```

Where the app gets data

- The frontend talks to the backend API at `http://localhost:8080/api` by default. The important endpoints are:
  - `POST /api/session` — start a session
  - `GET /api/graph` — DFA graph
  - `GET /api/pda/graph` — PDA graph
  - `POST /api/request/process` — submit a whole request (payload: `{ session_id, host_id, packets[], threshold }`). The response contains PDA validation and per-packet DFA results.
  - `POST /api/dfa/step` — send a single packet for DFA step-by-step testing
  - `GET /api/derivation?session_id=...` — fetch derivation steps

Templates

- Templates are loaded from the public file `public/templates.json`. Edit this file to add or change request templates; the Templates modal in the UI reads that file at runtime.
- `templates.json` supports arbitrary categories (e.g., `benign`, `suspicious`, `malicious`, or a custom `add`) — categories are rendered dynamically in the modal.

Thresholds

- The request builder includes a `Malicious Threshold` numeric input. This is the number of packet-level DFA detections required to flag the entire request as malicious. The value is sent with the request to `/api/request/process`.

Troubleshooting

- If the dev server exits immediately (e.g., code 130), check for another process using the port or permission issues. Try rebuilding with `npm run build` to see build-time errors.
- If templates don't load, ensure `public/templates.json` is readable by the dev server (no 404) and the browser console/network tab shows the request.

Run end-to-end locally

1. Build the C++ CLI used by the backend (see `security-dfa-gen`):

```bash
cd ../security-dfa-gen
make
```

2. Start the backend (see `security-backend` README for details):

```bash
cd ../security-backend
go run ./cmd/server
```

3. Start the frontend dev server (from `security-visualizer`):

```bash
npm run dev
```

4. Use the UI to open the Templates modal, pick a template, set a threshold, and `Send Request` to observe PDA/DFA visualization and malicious flagging.

If you need more help running the backend or the C++ simulator, see `../security-backend/README.md`.
