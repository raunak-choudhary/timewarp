# TimeWarp

A time-travel debugger for AI agent pipelines. When a LangGraph agent runs, TimeWarp records
every node execution as a checkpoint, detects where the agent's behaviour started diverging,
and lets you rewind the run to any earlier moment, change the prompt at that point, and replay
an alternate timeline from there.

The idea comes from reversible computation and from time-travel debuggers for classical
software such as Mozilla rr. Conventional agent observability tools are forward-only: they show
you that something went wrong, but they cannot reconstruct the exact state at the moment it
happened or let you re-run a corrected version from that point. TimeWarp is an attempt to bring
that capability to agent systems.

Built in a single session at a NYC Tech Week hackathon run by the Claude Code team, June 2026.

## How it works

```
LangGraph agent node executes
        |
        v
TimeWarp middleware intercepts entry and exit
        |
        v
Snapshot engine computes a delta against the previous checkpoint, hashes it into the chain,
and writes it to Supabase
        |
        +--> Drift detector embeds the node output and scores cosine distance from a baseline
        |
        +--> Behaviour DAG updates, with drift scores as edge weights
        |
        v
WebSocket streams checkpoint events to the browser
        |
        v
3D timeline renders each node in space, coloured by status
        |
        v
Scrub the time slider, the replay engine queries the segment tree and reconstructs state at T
        |
        v
Create a branch, edit the prompt, replay forward as a new timeline
```

## The algorithms

Four pieces do the real work, and they are the most interesting part of the project.

**Delta compression with a hash chain.** Agent state is never stored as a full copy. Each
checkpoint holds only the diff against its parent, plus a hash chaining it to that parent, in
the same spirit as Git commits. Reconstructing state at any point walks the chain from the root
and applies each delta in order. `tests/test_snapshot_engine.py` asserts the property that
matters here: the compression is lossless, so replaying the deltas reproduces the original
state exactly at every step.

**Persistent segment tree.** Rewinding by re-executing every checkpoint from the start would
make the time slider unusable. The replay engine keeps a persistent segment tree over
nanosecond timestamps, built from immutable nodes, so looking up the checkpoint at or before an
arbitrary time T is a logarithmic descent rather than a linear scan. This is what makes
scrubbing the timeline feel immediate.

**Bellman-Ford over a behaviour DAG.** The run is modelled as a directed graph where each node
is an agent step and each edge weight encodes how far the agent diverged across that step.
Finding the path of greatest divergence means finding a longest path, which is done by negating
the weights and running Bellman-Ford. Dijkstra cannot be used here, since it requires
non-negative weights. The resulting path is what the interface highlights as the route the
agent took into failure.

**Semantic drift detection.** Each node output is embedded with `all-MiniLM-L6-v2` from
sentence-transformers, running locally rather than through an API. Cosine similarity against a
baseline embedding gives a drift score per node, and a score below the configured threshold
raises a drift event. Those same scores become the edge weights the behaviour DAG runs
Bellman-Ford over, so detection and root-cause analysis share one signal.

## What is in the repository

**Backend** (`backend/`, FastAPI)

| File | Role |
|---|---|
| `main.py` | FastAPI app, REST endpoints and the live WebSocket |
| `instrumentation.py` | `TimeWarpMiddleware`, wraps any LangGraph node to capture entry and exit |
| `snapshot_engine.py` | Delta computation, hash chaining, state reconstruction |
| `replay_engine.py` | `PersistentSegmentTree` for time-indexed checkpoint lookup |
| `drift_detector.py` | Sentence-transformer embeddings and cosine drift scoring |
| `anomaly_graph.py` | `BehaviorDAG` and the Bellman-Ford divergence path |
| `supabase_client.py` | Async checkpoint store, sync client wrapped off the event loop |
| `websocket_manager.py` | Connection registry and broadcast |
| `models.py` | Pydantic models for checkpoints, snapshots, drift events and branches |

**Frontend** (`frontend/`, vanilla JS with Vite)

| File | Role |
|---|---|
| `src/timeline.js` | Three.js 3D scene and D3 time scrubber |
| `src/replay_controls.js` | Play, pause, rewind and branch controls |
| `src/diff_view.js` | Side by side prompt diff when branching |
| `src/websocket.js` | Live checkpoint stream from the backend |
| `src/api.js` | REST client |

**Demo agent** (`agent_demo/`)

A five node LangGraph research agent, `plan_task` through `format_output`, pre-wrapped with the
TimeWarp middleware so every step is checkpointed. `inject_failure.py` injects a poison prompt
at a chosen node so the drift detection and anomaly path can be demonstrated end to end.

## API

| Method | Path | Purpose |
|---|---|---|
| GET | `/checkpoints` | All checkpoints for a run |
| GET | `/replay/{timestamp_ns}` | Reconstructed state at time T |
| GET | `/anomaly/path` | Bellman-Ford divergence path for a run |
| POST | `/branch` | Create an alternate timeline with a modified prompt |
| GET | `/runs` | List recent agent runs |
| POST | `/runs/start` | Start a new demo agent run |
| WS | `/ws/live` | Live checkpoint and drift event stream |

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11+, FastAPI, Uvicorn, Pydantic v2 |
| Agent framework | LangGraph |
| LLM | Claude via the Anthropic SDK |
| Embeddings | sentence-transformers, `all-MiniLM-L6-v2`, run locally |
| Store | Supabase, PostgreSQL with pgvector |
| Diffing | deepdiff |
| 3D and charts | Three.js, D3 |
| Frontend build | Vite, vanilla ES modules |
| Tests | pytest and pytest-asyncio, node:test |

## Running it

Requires Python 3.11 or newer, Node 20 or newer, and a Supabase project.

```bash
git clone https://github.com/raunak-choudhary/timewarp.git
cd timewarp

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

cp .env.example .env        # fill in Supabase and Anthropic values
```

Apply `supabase_schema.sql` in the Supabase SQL editor to create the `checkpoints`,
`embeddings` and `baseline_embeddings` tables and enable pgvector.

```bash
uvicorn backend.main:app --reload --port 8000   # API on :8000
npm install && npm run dev                      # frontend
```

Start a run, then inject a failure into it:

```bash
python -m agent_demo.demo_agent
python -m agent_demo.inject_failure --inject_at_node analyze_results
```

`--inject_at_node` takes any node name from the demo graph, so the failure can be planted at
whichever step makes the clearest demonstration.

## Tests

```bash
pytest -q        # 18 backend tests
npm test         # 14 frontend tests
```

Backend coverage focuses on the properties that are easy to get wrong: that delta compression
round-trips losslessly, that the segment tree returns the correct checkpoint for an arbitrary
timestamp, and that Bellman-Ford identifies the expected divergence path.

## Author

Raunak Choudhary

NYU MS Computer Science, Class of 2026

raunakchoudhary17@gmail.com
