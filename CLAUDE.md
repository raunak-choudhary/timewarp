# TimeWarp — AI Agent Time-Travel Debugger

---

## ⚠️ PENDING STEPS (Blockers for Phase 4 only — do not block earlier phases)

### Azure CLI + Account (Required for Phase 4 deployment)
- [ ] Install Azure CLI: `brew install azure-cli` (~3 min install)
- [ ] Create Azure account at portal.azure.com (use NYU email rc5553@nyu.edu)
- [ ] Run `az login` and confirm subscription is active
- [ ] Add to `.env`: `AZURE_SUBSCRIPTION_ID`, `AZURE_RESOURCE_GROUP=timewarp-rg`, `AZURE_LOCATION=eastus`
- **Do not start Phase 4 until these are complete.**
- **Phases 0–3 are fully unblocked without Azure.**

---

## Project Identity

TimeWarp is the world's first reversible execution engine for AI agent systems. It solves the
single most painful unsolved problem in production AI: when an agent fails, you cannot rewind
to the moment it went wrong. TimeWarp applies the computer science concept of reversible
computation (Bennett 1973) and time-travel debugging (Mozilla rr, WinDbg TTD) to AI agent
pipelines — a domain nobody has touched yet.

**One-line pitch:** "Git for AI agent decisions — rewind to any moment, swap one variable,
watch the alternate timeline diverge."

**Hackathon context:** Built at the GitHub Copilot x Azure NYTechWeek Hackathon (June 4,
2026) and the Claude Code Agentic Team Hackathon (June 4, 2026). Both submitted as the same
product. Must be deployed as a live Azure MVP by 3:30 PM.

**Win condition:** Judge demo at 3:30 PM where a LangGraph agent fails live, TimeWarp rewinds
it in 3D to the exact failure node, a prompt swap is applied, and the alternate timeline
succeeds. Nobody else in the room has this demo.

---

## Core Problem Statement

76% of AI agents fail in production (analysis of 847 agent deployments, 2026). The top root
cause across all failures: complete absence of real-time failure detection and reversible
observability. Classical software fails loudly — HTTP 500, stack trace, red dashboard. An AI
agent fails silently. It drifts, loops, hallucinates, and nobody knows until the damage is done.

Existing tools (LangSmith, Langfuse, Helicone) offer forward-only logging: you see that
something went wrong but you cannot reconstruct the exact causal moment, you cannot swap the
failing component, and you cannot replay the corrected version. TimeWarp is the first system
that gives you all three.

---

## Architecture

### System Components

```
timewarp/
├── CLAUDE.md                    # This file — primary agent context
├── STRATEGY.md                  # Product strategy anchor
├── AGENTS.md                    # Multi-agent coordination rules
├── README.md                    # Public-facing project description
├── backend/
│   ├── main.py                  # FastAPI entrypoint
│   ├── snapshot_engine.py       # Core delta-compression + checkpoint system
│   ├── replay_engine.py         # Reversible state machine + segment tree
│   ├── drift_detector.py        # Transformer-based semantic drift scoring
│   ├── anomaly_graph.py         # Bellman-Ford anomaly detection on behavior DAG
│   ├── instrumentation.py       # LangGraph SDK middleware (intercepts every node)
│   ├── models.py                # Pydantic data models
│   └── supabase_client.py       # Supabase checkpoint store interface
├── frontend/
│   ├── index.html               # Entry point
│   ├── src/
│   │   ├── timeline.js          # 4D timeline — Three.js 3D graph + D3 time scrubber
│   │   ├── replay_controls.js   # Play/pause/rewind/branch controls
│   │   ├── diff_view.js         # Side-by-side prompt diff on branch creation
│   │   └── websocket.js         # Live state streaming from backend
│   └── styles/
│       └── main.css
├── agent_demo/
│   ├── demo_agent.py            # LangGraph agent pre-wired with TimeWarp middleware
│   ├── inject_failure.py        # Script to inject a poison prompt at a specific node
│   └── seed_data.py             # Seeds Supabase with a compelling pre-recorded run
├── docs/
│   ├── brainstorms/
│   │   └── initial-requirements.md
│   ├── plans/
│   │   └── implementation-plan.md
│   └── compound-notes/
│       └── lessons-learned.md
├── tests/
│   ├── test_snapshot_engine.py
│   ├── test_replay_engine.py
│   └── test_drift_detector.py
├── .env.example
├── requirements.txt
├── package.json
└── azure-deploy.yml             # Azure Container Apps deployment config
```

### Data Flow

```
LangGraph Agent Node Execution
        |
        v
TimeWarp Instrumentation Middleware (intercepts every tool call, LLM call, memory op)
        |
        v
Snapshot Engine (delta-compresses state diff vs previous checkpoint → stores to Supabase)
        |
        +--> Drift Detector (async: embeds LLM output, computes cosine distance from baseline)
        |
        +--> Anomaly Graph (async: updates behavior DAG, runs Bellman-Ford for earliest divergence)
        |
        v
WebSocket stream → Frontend 4D Timeline (Three.js nodes + D3 time axis)
        |
        v
User drags time slider → Replay Engine queries Segment Tree → reconstructs state at time T
        |
        v
User creates branch → Diff View shows prompt delta → Agent re-executes from T with new config
```

---

## Core Algorithms (explain these to judges when asked)

### 1. Delta Compression + Checkpoint Chain (Snapshot Engine)

Every agent state is stored as a diff against the previous checkpoint, not a full copy.
Structure: `{checkpoint_id, parent_id, timestamp_ns, state_delta, hash}`. The hash chains
them — like Git commits. To reconstruct state at any point: walk the chain from root to T,
applying deltas. This is O(depth) reconstruction, which is acceptable for hackathon demo
depth (under 50 nodes).

### 2. Persistent Segment Tree (Replay Engine)

For O(log n) state queries at arbitrary time T without re-replaying the entire chain.
Each tree node stores a state snapshot at a specific time range. Query time T: binary search
to the node covering T, return its stored state. Update on new checkpoint: O(log n) insert.
This is the data structure that makes real-time scrubbing feel instant.

### 3. Bellman-Ford on Behavior DAG (Anomaly Graph)

Model the agent's decision history as a directed acyclic graph where each node is a tool
call or LLM invocation, and edge weights represent semantic drift scores (from the Drift
Detector). Bellman-Ford finds the shortest path from the start node to the current failure
node — which, when edge weights encode divergence, gives you the EARLIEST point where the
agent started going wrong. This is the "root cause" node TimeWarp highlights in red.

### 4. Transformer Embedding Drift (Drift Detector)

Use `sentence-transformers` (all-MiniLM-L6-v2) to embed each LLM output. Compare cosine
similarity to a baseline embedding computed from the first N successful runs. Drop below
threshold (0.72 by default) → drift event fired → anomaly graph edge weight updated.

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Backend | FastAPI (Python) | Fast to write, async, WebSocket support |
| Agent Framework | LangGraph | Industry standard, interceptable node execution |
| Checkpoint Store | Supabase (PostgreSQL + pgvector) | Free tier, instant setup, vector search for drift |
| ML / Embeddings | sentence-transformers (HuggingFace) | Local, no API key needed, fast inference |
| 3D Visualization | Three.js | Tony Stark-level 3D — nodes in space, time axis |
| Data Visualization | D3.js | Time scrubber, drift score charts |
| Deployment | Azure Container Apps | Required by Hackathon 1 judges |
| Build Tool | GitHub Copilot | Required by Hackathon 1, used throughout |
| Database | Supabase | Checkpoint storage, pgvector for embeddings |
| Frontend | Vanilla JS + Three.js | Fastest to ship, no framework overhead |
| Demo Agent | Claude Sonnet 4.5 via Anthropic SDK | Powers the demo agent that fails |
| Scraper (H2) | Claude Code agentic pipeline | Hackathon 2: scrapes GitHub postmortems |

---

## Hackathon 1 Constraints (GitHub Copilot x Azure)

- Must be built using GitHub Copilot during the event (use it for all code generation)
- Must deploy to Azure (use Azure Container Apps for backend, Azure Static Web Apps for frontend)
- Must demo a working deployed product by 3:30 PM
- Teams of 3-5 (solo is fine, but find teammates at 11 AM team formation)
- Prize: $25,000 Azure credits from Microsoft for Startups

## Hackathon 2 Constraints (Claude Code Agentic Team)

- Must use Claude Code to build agentic workflows
- Must scrape the web and surface relevant information
- Must produce a vibe-coded dashboard
- Output: newsletter / blog post / repurposed content format
- TimeWarp's Hackathon 2 angle: Claude Code agentic team scrapes GitHub issues, public
  postmortems, and Reddit threads for AI agent failure patterns → feeds into TimeWarp's
  failure pattern knowledge base → outputs a weekly "Agent Failure Intelligence" newsletter
  with interactive TimeWarp replay embeds

---

## Demo Script (3:30 PM Judge Presentation — exactly 3 minutes)

### Minute 0:00 — The Hook (30 seconds)

"Microsoft just told the world that 400,000 custom agents were deployed in 90 days. Not one
of those organizations can tell you if their agents are silently failing right now.

When classical software breaks, you get a stack trace. When an AI agent breaks, you get
silence — and a bill for 11 hours of infinite retry loops.

We built the tool that should have existed the moment the first agent was deployed."

### Minute 0:30 — Live Demo (90 seconds)

1. Open TimeWarp dashboard. The 3D timeline shows a LangGraph agent that completed 12 nodes
   successfully (green nodes floating in 3D space, connected by glowing edges).

2. "Watch this." Trigger `inject_failure.py` — the agent receives a poison prompt at node 8.
   The 3D graph updates in real time: nodes 9, 10, 11 turn amber, then red. The Bellman-Ford
   anomaly path lights up in red, tracing backwards to node 8.

3. "TimeWarp detected the divergence at node 8. Here is what changed." The drift score chart
   shows a cliff-edge drop at timestamp 8.

4. "Now watch what nobody else can do." Drag the time slider to node 8. The 3D graph
   REWINDS — nodes un-execute in reverse order. The timeline scrubs backwards.

5. Click "Create Branch." The diff view opens: left side shows the original prompt at node 8,
   right side is editable. Type a corrected instruction. Press "Replay from here."

6. The agent re-executes from node 8. New branch nodes appear in blue. All nodes complete
   green. "Alternate timeline: success."

### Minute 2:00 — Business Angle (30 seconds)

"EU AI Act Article 12 logging compliance deadline: August 2026. That is 8 weeks from today.
Every enterprise in this room faces regulatory exposure without exactly this audit capability.

TimeWarp is the observability layer the entire agentic AI industry is missing. This is
Datadog for the agent era."

### Minute 2:30 — Ask (30 seconds)

"We are applying for Microsoft for Startups. The $25K Azure credits fund 6 months of
infrastructure while we close our first 3 enterprise customers. Thank you."

---

## Development Phases (6-Hour Sprint Plan)

### Phase 0: Setup (11:00 — 11:30 AM) — 30 minutes

- [ ] Create GitHub repo: `timewarp`
- [ ] Install Superpowers: `/plugin install superpowers@claude-plugins-official`
- [ ] Install Compound Engineering: `/plugin marketplace add EveryInc/compound-engineering-plugin`
- [ ] Set up Supabase project (free tier) — get `SUPABASE_URL` and `SUPABASE_KEY`
- [ ] Set up Azure account — get `AZURE_SUBSCRIPTION_ID`
- [ ] Copy `.env.example` → `.env`, fill all keys
- [ ] Run `pip install -r requirements.txt`
- [ ] Verify Supabase connection with a ping query
- [ ] Run `python agent_demo/seed_data.py` to pre-seed a compelling run

### Phase 1: Snapshot Engine + Backend Core (11:30 AM — 1:00 PM) — 90 minutes

Priority: get a LangGraph agent being instrumented and checkpoints flowing to Supabase.

- [ ] `instrumentation.py`: LangGraph node wrapper that fires on every node entry/exit
- [ ] `snapshot_engine.py`: delta computation (JSON diff) + Supabase insert
- [ ] `models.py`: Pydantic models for Checkpoint, StateSnapshot, DriftEvent
- [ ] `supabase_client.py`: async client with checkpoint insert + range query methods
- [ ] `backend/main.py`: FastAPI app with `/checkpoints`, `/replay/{t}`, WebSocket `/ws/live`
- [ ] `agent_demo/demo_agent.py`: LangGraph agent doing a multi-step research task, instrumented
- [ ] Run agent, verify checkpoints appear in Supabase dashboard
- [ ] **MILESTONE: checkpoints flowing** — do not proceed until this works

### Phase 2: Replay Engine + Algorithms (1:00 — 2:00 PM) — 60 minutes

- [ ] `replay_engine.py`: persistent segment tree over checkpoint timeline
- [ ] `anomaly_graph.py`: behavior DAG builder + Bellman-Ford shortest-divergence path
- [ ] `drift_detector.py`: sentence-transformers embedding + cosine similarity scoring
- [ ] Wire drift scores as edge weights into anomaly graph
- [ ] `/replay/{timestamp_ns}` endpoint: returns reconstructed state at T
- [ ] `/anomaly/path` endpoint: returns the Bellman-Ford root-cause node chain
- [ ] `inject_failure.py`: injects a poison prompt into a running agent at node N
- [ ] Test: inject failure, verify Bellman-Ford identifies node N as root cause
- [ ] **MILESTONE: anomaly detection working** — Bellman-Ford path highlights correct node

### Phase 3: 4D Frontend Visualization (2:00 — 3:00 PM) — 60 minutes

This is the demo. Prioritize visual impact over polish.

- [ ] `timeline.js`: Three.js scene — agent nodes as spheres in 3D space (y=node index,
      x/z=jittered for visual separation), edges as glowing lines, color by status
      (green=success, amber=drift, red=anomaly, blue=branch)
- [ ] `websocket.js`: connect to `/ws/live`, update Three.js scene on each checkpoint event
- [ ] D3 time scrubber: horizontal slider below the 3D view, maps to timestamp range
- [ ] Drag scrubber → POST to `/replay/{t}` → update Three.js node colors to reconstructed state
- [ ] "Create Branch" button → opens diff view panel (left: original prompt, right: editable)
- [ ] "Replay from here" → POST to `/branch` → new agent execution → new blue nodes appear
- [ ] Drift score chart: small D3 line chart showing cosine distance over time
- [ ] **MILESTONE: can drag timeline and watch 3D graph rewind** — this is the money shot

### Phase 4: Azure Deploy + Polish (3:00 — 3:30 PM) — 30 minutes

- [ ] `azure-deploy.yml`: Azure Container Apps config for backend
- [ ] Azure Static Web Apps for frontend
- [ ] Deploy backend: `az containerapp up --name timewarp-api`
- [ ] Deploy frontend: push to GitHub → Azure Static Web Apps auto-deploys
- [ ] Update frontend `websocket.js` to point to Azure backend URL
- [ ] Smoke test the deployed version end-to-end
- [ ] Prepare laptop for demo (full screen, no notifications, browser zoom 110%)
- [ ] **MILESTONE: live URL works** — this is what judges see

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Anthropic (for demo agent)
ANTHROPIC_API_KEY=sk-ant-...

# Azure (for deployment)
AZURE_SUBSCRIPTION_ID=...
AZURE_RESOURCE_GROUP=timewarp-rg
AZURE_LOCATION=eastus

# TimeWarp Config
DRIFT_THRESHOLD=0.72
CHECKPOINT_INTERVAL_MS=100
SEGMENT_TREE_MAX_DEPTH=256
EMBEDDING_MODEL=all-MiniLM-L6-v2
```

---

## Supabase Schema

```sql
-- Checkpoints table
create table checkpoints (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  parent_id uuid references checkpoints(id),
  node_name text not null,
  timestamp_ns bigint not null,
  state_delta jsonb not null,
  state_hash text not null,
  drift_score float default null,
  is_anomaly boolean default false,
  branch_id uuid default null,
  created_at timestamptz default now()
);

-- Index for time-range queries (segment tree needs this fast)
create index idx_checkpoints_run_time on checkpoints(run_id, timestamp_ns);

-- Embeddings table for drift detection
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  checkpoint_id uuid references checkpoints(id),
  embedding vector(384),  -- all-MiniLM-L6-v2 output dimension
  created_at timestamptz default now()
);

-- Baseline embeddings (first N successful runs)
create table baseline_embeddings (
  id uuid primary key default gen_random_uuid(),
  node_name text not null,
  embedding vector(384),
  created_at timestamptz default now()
);

-- Enable pgvector
create extension if not exists vector;
```

---

## Key Engineering Decisions

**Why FastAPI over Flask:** async support for WebSocket streaming, Pydantic models for clean
checkpoint serialization, faster cold start on Azure Container Apps.

**Why sentence-transformers local over OpenAI embeddings API:** No API latency, no cost, works
offline during hackathon, `all-MiniLM-L6-v2` is 80MB and blazing fast.

**Why Three.js over D3 for 3D:** D3 is 2D SVG. Three.js renders WebGL — actual 3D with camera
rotation. The judge demo requires rotating the view to show depth.

**Why Supabase over raw PostgreSQL:** Free tier with pgvector built in, instant setup, Supabase
Realtime could be used for WebSocket if needed as fallback.

**Why persistent segment tree over naive replay:** Without it, rewinding to time T requires
re-executing all N checkpoints from scratch. With it, any time T is O(log n) — instant for
the demo time scrubber.

**Why Bellman-Ford over Dijkstra:** Dijkstra requires non-negative edge weights. Drift scores
can theoretically be zero. Bellman-Ford handles zero-weight edges correctly and also detects
negative cycles (which would indicate a retry loop — exactly the failure mode we want to
catch).

---

## Testing Strategy

Run tests after each phase milestone:

```bash
# Phase 1
pytest tests/test_snapshot_engine.py -v

# Phase 2
pytest tests/test_replay_engine.py tests/test_drift_detector.py -v

# Full suite before deploy
pytest tests/ -v --tb=short
```

Key test cases:
- Checkpoint delta compression is lossless (reconstruct from deltas == original state)
- Segment tree returns correct state at arbitrary T
- Bellman-Ford correctly identifies injected failure node
- Drift detector fires on semantically divergent output (cosine < 0.72)
- WebSocket pushes checkpoint events within 200ms of node execution

---

## Compound Notes (Update After Each Phase)

Document every non-obvious decision here so future agent sessions do not re-discover them:

```
[COMPOUND NOTE - Phase 1]
LangGraph node interception: use `graph.add_node(name, fn, metadata={"timewarp": True})`
and wrap fn with the TimeWarp middleware. Do NOT patch the graph internals — too fragile.
```

```
[COMPOUND NOTE - Phase 2]
sentence-transformers first import takes 8 seconds (model load). Load at FastAPI startup
in lifespan(), not per-request. Otherwise the drift detection endpoint has an 8s first hit.
```

```
[COMPOUND NOTE - Phase 3]
Three.js camera: set initial position to (0, 15, 40) looking at (0, 0, 0). This gives the
best angle for the demo — nodes visible in 3D depth, time axis readable.
```

---

## What Success Looks Like

At 3:30 PM, the judge sees:
1. A live URL that loads instantly
2. A 3D graph of a real agent run with green nodes
3. A live failure injection that turns nodes red in real time
4. A Bellman-Ford root cause path highlighted in the graph
5. Time scrubber that rewinds the 3D graph backwards
6. Branch creation with prompt diff
7. Alternate timeline replay in blue
8. A clean 3-minute pitch that ends with the EU AI Act compliance hook

That is the win.
