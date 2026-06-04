# TimeWarp — Codex Handoff Document
**Last updated:** June 4, 2026
**Handoff from:** Claude Code (Sonnet 4.6) session
**Handoff to:** Codex or any fresh agent session

---

## READ THIS FIRST — How to Cold-Start

Read these files in this exact order. Nothing else needed to understand the full project.

```
1. CODEX_HANDOFF.md        ← you are here — start here
2. CLAUDE.md               ← architecture, algorithms, tech stack, demo script
3. STRATEGY.md             ← product strategy, personas, competitive moat
4. AGENTS.md               ← frozen API contracts, WebSocket schema, subagent rules
5. graphify-out/GRAPH_REPORT.md  ← structural knowledge graph of entire codebase
6. docs/plans/implementation-plan.md  ← exact Phase 2/3/4 task list with code skeletons
```

---

## What Is TimeWarp

**One-liner:** "Git for AI agent decisions — rewind to any moment, swap one variable, watch the alternate timeline diverge."

TimeWarp is an AI agent time-travel debugger built at two simultaneous hackathons:
1. **GitHub Copilot × Azure NYTechWeek Hackathon** (June 4, 2026, 9AM–5PM) — must deploy to Azure
2. **Claude Code Agentic Team Hackathon** (June 4, 2026, 4:30–7:30PM) — agentic pipeline

**Demo at 3:30 PM:** Judge sees a LangGraph agent fail live → TimeWarp rewinds it in 3D → prompt swap applied → alternate timeline succeeds. Nobody else in the room has this demo.

**Win condition:** Working Azure URL + 3-minute pitch + EU AI Act compliance hook.

---

## Current Status (as of this handoff)

| Phase | Description | Status | Verified |
|---|---|---|---|
| Phase 0 | Setup — repo, Supabase, venv, deps | ✅ Complete | All tools boot |
| Phase 1 | Backend core — snapshot engine, FastAPI, demo agent | ✅ Complete | 5 checkpoints in Supabase, 13/13 tests pass |
| Phase 2 | Algorithms — segment tree, Bellman-Ford, drift detector | ⏳ NOT STARTED | — |
| Phase 3 | Frontend — Three.js 3D, D3 scrubber, WebSocket live | ⏳ NOT STARTED | — |
| Phase 4 | Azure deploy + demo rehearsal | ⏳ BLOCKED | Needs Azure account |

**Phase 1 milestone verified:**
```
GET /runs → {"runs": [{"run_id": "88e9ec36...", "node_count": 5, "has_anomaly": false}]}
GET /checkpoints?run_id=88e9ec36... → 5 checkpoints with delta_keys per node
```

---

## Complete File Tree (every file that exists)

```
timewarp/
│
├── CLAUDE.md                    ← Primary context. Architecture, algorithms, demo script, tech stack
├── STRATEGY.md                  ← Product strategy, personas, competitive positioning
├── AGENTS.md                    ← FROZEN API contract + WebSocket schema. DO NOT CHANGE.
├── README.md                    ← Public-facing project description
├── CODEX_HANDOFF.md             ← This file
├── .env                         ← GITIGNORED. Real keys. Fill ANTHROPIC_API_KEY if missing.
├── .env.example                 ← Template with empty values
├── .gitignore
├── requirements.txt             ← Python deps (all installed in venv/)
├── package.json                 ← Frontend JS deps (three, d3, vite)
├── supabase_schema.sql          ← Run in Supabase SQL editor if tables missing
├── pytest.ini                   ← asyncio_mode = auto
│
├── venv/                        ← Python 3.12 venv, self-contained, all deps installed
│                                   includes torch (~2GB), sentence-transformers
│
├── backend/
│   ├── __init__.py
│   ├── models.py                ← Pydantic: Checkpoint, StateSnapshot, DriftEvent,
│   │                               BranchRequest, WebSocketMessage
│   ├── supabase_client.py       ← Async Supabase: insert_checkpoint, get_checkpoints_for_run,
│   │                               get_checkpoints_in_range, get_all_runs, insert_embedding,
│   │                               get_baseline_embedding, ping
│   ├── snapshot_engine.py       ← compute_delta (top-level key diff), compute_hash (SHA-256
│   │                               chain), reconstruct_state, snapshot_node_execution
│   ├── websocket_manager.py     ← WebSocketManager: connect/disconnect/broadcast
│   ├── instrumentation.py       ← TimeWarpMiddleware.wrap_node() — wraps LangGraph nodes,
│   │                               snapshots state, broadcasts WS events
│   └── main.py                  ← FastAPI app. All 7 endpoints. Shared ws_manager singleton.
│
├── backend/                     ← Phase 2 — CREATE THESE:
│   ├── replay_engine.py         ← PersistentSegmentTree for O(log n) state queries at time T
│   ├── drift_detector.py        ← sentence-transformers cosine drift scoring
│   └── anomaly_graph.py         ← BehaviorDAG + Bellman-Ford earliest divergence
│
├── agent_demo/
│   ├── __init__.py
│   ├── demo_agent.py            ← 5-node LangGraph agent (plan→search→analyze→synthesize→format)
│   │                               run_demo_agent(run_id, ws_manager, injected_prompt, branch_id)
│   ├── seed_data.py             ← TODO: pre-populate Supabase with 12-node demo run
│   └── inject_failure.py        ← TODO: inject poison prompt at node N (Phase 2)
│
├── frontend/                    ← Phase 3 — CREATE THESE:
│   ├── index.html
│   ├── src/
│   │   ├── timeline.js          ← Three.js 3D graph + D3 time scrubber
│   │   ├── websocket.js         ← WS client connecting to /ws/live
│   │   ├── replay_controls.js   ← Play/pause/rewind/branch buttons
│   │   └── diff_view.js         ← Side-by-side prompt diff for branch creation
│   └── styles/main.css
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py              ← Fixtures: run_id, sample_state_v1/v2
│   └── test_snapshot_engine.py ← 13 tests, all passing. compute_delta, compute_hash,
│                                   reconstruct_state lossless roundtrip
│
├── docs/
│   ├── plans/
│   │   └── implementation-plan.md  ← Exact Phase 2/3/4 tasks with code skeletons
│   ├── COPILOT_USAGE.md         ← AI-assisted build log (25 pts hackathon category)
│   └── compound-notes/          ← Update after each phase with non-obvious decisions
│
├── azure-deploy.yml             ← TODO: Phase 4 Azure Container Apps config
│
└── graphify-out/
    ├── GRAPH_REPORT.md          ← Knowledge graph report: 254 nodes, 398 edges
    ├── graph.json               ← Full graph data
    └── graph.html               ← Interactive visualization
```

---

## Environment Setup (already done — just verify)

```bash
cd /Users/raunakchoudhary/Data/Projects/timewarp

# Activate venv (ALL Python commands must use this)
source venv/bin/activate

# Verify
python -c "import fastapi, supabase, sentence_transformers, langgraph, anthropic; print('ok')"

# Check .env has real values
grep ANTHROPIC_API_KEY .env   # must NOT be FILL_ME_IN
grep SUPABASE_URL .env        # must be https://qfsayagwbfqqpsymbsyi.supabase.co
```

---

## How to Run (Phase 1 verified)

```bash
source venv/bin/activate

# Terminal 1: Start FastAPI
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Run demo agent (pushes 5 checkpoints to Supabase)
python -m agent_demo.demo_agent

# Verify via API
curl http://localhost:8000/runs
curl "http://localhost:8000/checkpoints?run_id=<run_id_from_above>"

# Run tests
pytest tests/ -v
```

---

## Frozen Contracts — DO NOT CHANGE THESE

### WebSocket Message Schema (from AGENTS.md)
```json
{
  "type": "checkpoint",
  "run_id": "uuid",
  "checkpoint_id": "uuid",
  "node_name": "string",
  "timestamp_ns": 1234567890,
  "status": "success | drift | anomaly | branch",
  "drift_score": 0.85,
  "is_anomaly": false,
  "anomaly_path": ["node_id", ...] | null
}
```

### REST API Contract (from AGENTS.md)
```
GET  /checkpoints?run_id={uuid}            → list of checkpoints for a run
GET  /replay/{timestamp_ns}?run_id={uuid}  → reconstructed state at time T
GET  /anomaly/path?run_id={uuid}           → Bellman-Ford root cause path
POST /branch                               → {run_id, from_timestamp_ns, new_prompt, node_name}
GET  /runs                                 → list of recent runs
POST /runs/start                           → start a new demo agent run
WS   /ws/live                              → real-time checkpoint stream
```

---

## Supabase (already provisioned)

- **Project:** `timewarp`
- **Ref ID:** `qfsayagwbfqqpsymbsyi`
- **Region:** East US (North Virginia)
- **URL:** `https://qfsayagwbfqqpsymbsyi.supabase.co`
- **Tables:** `checkpoints`, `embeddings`, `baseline_embeddings` (all exist, pgvector enabled)
- **Keys:** In `.env` as `SUPABASE_URL` and `SUPABASE_KEY`

To verify tables exist:
```bash
supabase db query --linked "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

---

## Phase 2 — What Needs to Be Built (YOUR TASK)

This is the CS-depth phase. Judges ask about this. Build all three files.

### 2A. `backend/replay_engine.py` — Persistent Segment Tree

```python
class PersistentSegmentTree:
    def insert(self, checkpoint: Checkpoint) -> None   # O(log n)
    def query(self, timestamp_ns: int) -> Optional[Checkpoint]  # O(log n)
    def get_state_at(self, timestamp_ns: int, all_checkpoints: list) -> dict
```

Wire to `/replay/{timestamp_ns}` endpoint in `main.py` (currently uses linear scan).

### 2B. `backend/drift_detector.py` — Transformer Drift Scoring

```python
class DriftDetector:
    model = SentenceTransformer("all-MiniLM-L6-v2")  # LOAD AT INIT, not per-call
    threshold = float(os.getenv("DRIFT_THRESHOLD", "0.72"))

    def embed(self, text: str) -> list[float]          # 384-dim
    def cosine_similarity(self, a, b) -> float
    async def score(self, node_name: str, output_text: str) -> DriftEvent
    async def update_baseline(self, node_name: str, output_text: str) -> None
```

Wire into `instrumentation.py` — after each node, call `drift_detector.score(node_name, output_text)` async.

### 2C. `backend/anomaly_graph.py` — Bellman-Ford on Behavior DAG

```python
class BehaviorDAG:
    def add_node(self, checkpoint: Checkpoint, drift_score: float) -> None
    def bellman_ford_earliest_divergence(self, start_id: str, end_id: str) -> list[str]
    def get_anomaly_path(self, run_id: UUID) -> list[str]
```

Wire to `/anomaly/path` endpoint (currently returns stub).

### 2D. `agent_demo/inject_failure.py` — Poison Prompt Injection

```python
# python agent_demo/inject_failure.py --run_id <uuid> --inject_at_node "analyze_results"
# Patches the injected_prompt in the running agent at node N
# Causes drift score to drop below 0.72 threshold
```

### 2E. Update `instrumentation.py` to wire everything together

After each node:
1. `snapshot_engine.snapshot_node_execution(...)` → Checkpoint ← already done
2. `drift_detector.score(node_name, output_text)` async → DriftEvent ← NEW
3. `anomaly_graph.add_node(checkpoint, drift_score)` → updates DAG ← NEW
4. If anomaly: run `anomaly_graph.get_anomaly_path()` → attach to WS msg ← NEW
5. `ws_manager.broadcast(...)` with updated status ← update status field

### Phase 2 Tests to Write

```
tests/test_replay_engine.py   — query returns correct state at arbitrary T
tests/test_drift_detector.py  — cosine < 0.72 on divergent strings
tests/test_anomaly_graph.py   — Bellman-Ford finds injected failure node
```

### Phase 2 Milestone Gate

```bash
# 1. Run demo agent
python -m agent_demo.demo_agent

# 2. In another terminal, inject failure at node 3
python agent_demo/inject_failure.py --inject_at_node "analyze_results"

# 3. Verify Bellman-Ford response
curl "http://localhost:8000/anomaly/path?run_id=<uuid>"
# Must return: {"anomaly_path": ["plan_task", "search_web", "analyze_results"]}

# DO NOT start Phase 3 until this works
```

---

## Phase 3 Overview — Frontend (after Phase 2 milestone)

Build `frontend/` from scratch. All files need creating.

- `index.html` — top bar + Three.js canvas (70%) + D3 scrubber (20%) + right panel
- `frontend/src/timeline.js` — Three.js 3D scene, nodes as spheres, edges as tubes
- `frontend/src/websocket.js` — connects to `ws://localhost:8000/ws/live`
- `frontend/src/replay_controls.js` — play/pause/rewind/branch buttons
- `frontend/src/diff_view.js` — left/right prompt diff, "Replay from here" button
- `frontend/styles/main.css` — dark theme, responsive

**Node colors:** `success=0x1D9E75, drift=0xEF9F27, anomaly=0xE24B4A, branch=0x378ADD`
**Camera position:** `{x:0, y:15, z:40}` looking at `{x:0, y:0, z:0}`

Phase 3 milestone: drag time scrubber → 3D graph rewinds.

---

## Phase 4 Overview — Azure Deploy (BLOCKED)

**Blocked on:** Azure account + `az` CLI install.

```bash
brew install azure-cli   # ~3 min
az login
```

Then:
```bash
az containerapp up --name timewarp-api --resource-group timewarp-rg \
  --environment timewarp-env --source ./backend \
  --target-port 8000 --ingress external \
  --env-vars SUPABASE_URL=... SUPABASE_KEY=... ANTHROPIC_API_KEY=...
```

---

## Key Engineering Decisions (explain to judges if asked)

| Decision | Reason |
|---|---|
| FastAPI over Flask | Async WebSocket support, Pydantic models, faster cold start on Azure |
| Top-level key diff over DeepDiff | Simpler, handles lists/dicts correctly, no path-notation edge cases |
| sentence-transformers local over OpenAI | No API latency, no cost, works offline, 80MB model, ~50ms inference |
| Three.js over D3 for 3D | D3 = 2D SVG. Three.js = WebGL. Camera rotation requires real 3D. |
| Supabase over raw PostgreSQL | Free tier, pgvector built-in, instant setup |
| Persistent segment tree | O(log n) time-travel queries — makes demo scrubber feel instant |
| Bellman-Ford over Dijkstra | Handles zero-weight edges; also detects negative cycles (retry loops) |
| ainvoke over invoke | All nodes are async; LangGraph ainvoke runs them in async event loop |

---

## Rules (from AGENTS.md — mandatory)

1. Do NOT change the WebSocket message schema or REST API contract — frontend depends on these
2. Do NOT use external APIs that require new API keys not in `.env.example`
3. Do NOT switch frameworks (no Flask, no React, no non-Three.js 3D)
4. Do NOT skip the Phase 2 milestone check before Phase 3
5. All Supabase calls in try/except with specific error messages
6. Type hints on all function signatures
7. `logging` not `print()` in production code
8. `load_dotenv(override=True)` — shell env may have stale empty values
9. Use `source venv/bin/activate` before every Python command
10. sentence-transformers model must be loaded at FastAPI startup in lifespan(), NOT per-request

---

## Git / GitHub

- **Repo:** https://github.com/raunak-choudhary/timewarp
- **Branch:** `main`
- **Commit format:** `phase{N}: short description`
- **After every phase:** run `/graphify` to update `graphify-out/`
- **Never commit:** `.env`, `venv/`, `__pycache__/`, `.DS_Store`

---

## ⚠️ Pending Before Phase 4

- [ ] Create Azure account at portal.azure.com (use rc5553@nyu.edu)
- [ ] `brew install azure-cli`
- [ ] `az login`
- [ ] Add `AZURE_SUBSCRIPTION_ID` to `.env`

---

## Codex Prompt Template

When starting a fresh Codex session, use this exact prompt:

```
You are the lead engineer on TimeWarp, an AI agent time-travel debugger being built
at the GitHub Copilot × Azure NYTechWeek Hackathon (June 4, 2026).

Read these files first (in order):
1. CODEX_HANDOFF.md     — complete project status and what to build
2. CLAUDE.md            — architecture, algorithms, tech stack
3. AGENTS.md            — frozen API contract and WebSocket schema
4. graphify-out/GRAPH_REPORT.md — structural knowledge graph of the codebase

Then:
- Activate venv: source venv/bin/activate
- Verify environment: python -c "import fastapi, supabase, sentence_transformers; print('ok')"
- Start Phase 2: build backend/replay_engine.py, backend/drift_detector.py,
  backend/anomaly_graph.py, agent_demo/inject_failure.py
- Wire drift detection + anomaly graph into backend/instrumentation.py
- Write tests and verify Phase 2 milestone (Bellman-Ford path returns correct node)
- Run /graphify after Phase 2 milestone passes

Do NOT start Phase 3 (frontend) until the Phase 2 milestone is verified.
Do NOT change the frozen API contract or WebSocket schema in AGENTS.md.
```
