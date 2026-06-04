# Graph Report - .  (2026-06-04)

## Corpus Check
- 13 files · ~15,000 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 254 nodes · 398 edges · 28 communities detected
- Extraction: 70% EXTRACTED · 30% INFERRED · 0% AMBIGUOUS · INFERRED: 118 edges (avg confidence: 0.63)
- Token cost: 12,500 input · 3,800 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Demo Agent + Instrumentation|Demo Agent + Instrumentation]]
- [[_COMMUNITY_Snapshot Engine + Storage|Snapshot Engine + Storage]]
- [[_COMMUNITY_Planning Docs + Subagents|Planning Docs + Subagents]]
- [[_COMMUNITY_FastAPI App + Models|FastAPI App + Models]]
- [[_COMMUNITY_Core Algorithms (Phase 2)|Core Algorithms (Phase 2)]]
- [[_COMMUNITY_Test Harness|Test Harness]]
- [[_COMMUNITY_API Contract + Frontend|API Contract + Frontend]]
- [[_COMMUNITY_Project Identity + Inspiration|Project Identity + Inspiration]]
- [[_COMMUNITY_compute_delta Implementation|compute_delta Implementation]]
- [[_COMMUNITY_Azure Deployment|Azure Deployment]]
- [[_COMMUNITY_WebSocket Broadcast|WebSocket Broadcast]]
- [[_COMMUNITY_WebSocket Manager|WebSocket Manager]]
- [[_COMMUNITY_Phase 0 Setup|Phase 0 Setup]]
- [[_COMMUNITY_Judge Persona|Judge Persona]]
- [[_COMMUNITY_Enterprise Customer|Enterprise Customer]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]

## God Nodes (most connected - your core abstractions)
1. `WebSocketManager` - 34 edges
2. `Checkpoint` - 22 edges
3. `TimeWarpMiddleware` - 18 edges
4. `System Architecture Overview` - 13 edges
5. `StateSnapshot` - 13 edges
6. `BranchRequest` - 13 edges
7. `compute_delta()` - 10 edges
8. `run_demo_agent()` - 10 edges
9. `File: backend/instrumentation.py` - 9 edges
10. `TestReconstructState` - 9 edges

## Surprising Connections (you probably didn't know these)
- `compute_delta` --references--> `deepdiff==8.0.1`  [AMBIGUOUS]
  backend/snapshot_engine.py → requirements.txt
- `insert_checkpoint` --references--> `supabase==2.9.0`  [INFERRED]
  backend/supabase_client.py → requirements.txt
- `FastAPI app` --references--> `fastapi==0.115.0`  [INFERRED]
  backend/main.py → requirements.txt
- `_call_claude` --references--> `anthropic>=0.105.0`  [EXTRACTED]
  agent_demo/demo_agent.py → requirements.txt
- `TimeWarp Project` --conceptually_related_to--> `Reversible Computation Approach`  [INFERRED]
  README.md → STRATEGY.md

## Hyperedges (group relationships)
- **Checkpoint creation pipeline** — instrumentation_wrapnode, snapshot_engine_snapshotnodeexecution, supabase_client_insertcheckpoint, models_checkpoint [EXTRACTED 1.00]
- **WebSocket live broadcast pipeline** — instrumentation_wrapnode, websocket_manager_broadcast, models_websocketmessage, main_websocket_endpoint [EXTRACTED 1.00]
- **State reconstruction pipeline** — main_replay_at_time, supabase_client_getcheckpointsinrange, snapshot_engine_reconstructstate, models_statesnapshot [EXTRACTED 1.00]
- **LangGraph 5-node research pipeline** — demo_agent_plan_task, demo_agent_search_web, demo_agent_analyze_results, demo_agent_synthesize, demo_agent_format_output [EXTRACTED 1.00]
- **Branch run execution path** — main_create_branch, demo_agent_run_demo_agent, instrumentation_timewarp_middleware, models_branchrequest [EXTRACTED 1.00]
- **Delta compression + hash chaining algorithms** — snapshot_engine_computedelta, snapshot_engine_computehash, snapshot_engine_reconstructstate, snapshot_engine_deltachainpattern [EXTRACTED 0.95]
- **Snapshot engine test harness** — test_snapshot_engine_testcomputedelta, test_snapshot_engine_testcomputehash, test_snapshot_engine_testreconstructstate, conftest_sample_state_v1, conftest_sample_state_v2 [EXTRACTED 1.00]

## Communities

### Community 0 - "Demo Agent + Instrumentation"
Cohesion: 0.09
Nodes (39): AgentState, analyze_results(), build_demo_graph(), build_demo_graph, _call_claude(), _call_claude, format_output(), injected_prompt failure injection (+31 more)

### Community 1 - "Snapshot Engine + Storage"
Cohesion: 0.09
Nodes (33): Checkpoint, A single snapshot of agent state at one node execution., deepdiff==8.0.1, supabase==2.9.0, compute_hash(), compute_delta, compute_hash, Git-style Delta Chain Pattern (+25 more)

### Community 2 - "Planning Docs + Subagents"
Cohesion: 0.1
Nodes (35): Raunak Choudhary (Human Partner), Demo Subagent (agent_demo/ seed data), Frontend Subagent (Three.js/D3/WebSocket), WebSocket Message Schema (frozen), System Architecture Overview, Data Flow: LangGraph to WebSocket to Frontend, File: backend/anomaly_graph.py, File: agent_demo/demo_agent.py (+27 more)

### Community 3 - "FastAPI App + Models"
Cohesion: 0.1
Nodes (30): BaseModel, create_branch(), get_anomaly_path(), get_checkpoints(), lifespan(), list_runs(), TimeWarp FastAPI application — REST endpoints + WebSocket live stream.  REST API, Return the Bellman-Ford anomaly path. Phase 2 — stub for Phase 1. (+22 more)

### Community 4 - "Core Algorithms (Phase 2)"
Cohesion: 0.13
Nodes (18): Algorithm: Bellman-Ford on Behavior DAG, Algorithm: Delta Compression + Checkpoint Chain, Algorithm: Transformer Embedding Drift Detection, Algorithm: Persistent Segment Tree (Replay Engine), Demo Script: 3-minute Judge Presentation, File: agent_demo/inject_failure.py, Rationale: Bellman-Ford over Dijkstra (zero-weight edges + negative cycle detection), Rationale: Persistent segment tree over naive replay (O(log n)) (+10 more)

### Community 5 - "Test Harness"
Cohesion: 0.16
Nodes (11): Shared pytest fixtures for TimeWarp tests., A fresh UUID for each test., run_id(), sample_state_v1(), sample_state_v2(), Apply deltas in order from root to leaf. Returns the final reconstructed state., reconstruct_state(), Simulate 5 sequential state transitions and verify full reconstruction. (+3 more)

### Community 6 - "API Contract + Frontend"
Cohesion: 0.12
Nodes (16): REST API Contract (frozen), Backend Subagent (Python/FastAPI/Supabase), File: frontend/src/diff_view.js, File: backend/main.py (FastAPI entrypoint), Rationale: FastAPI over Flask (async + Pydantic + cold start), Rationale: Local sentence-transformers over OpenAI embeddings, Rationale: Supabase over raw PostgreSQL (free tier + pgvector), Supabase Schema (checkpoints, embeddings, baseline_embeddings) (+8 more)

### Community 7 - "Project Identity + Inspiration"
Cohesion: 0.17
Nodes (12): TimeWarp Project Identity, Bennett 1973: Reversible Computation (cited concept), Mozilla rr: Time-Travel Debugging (cited concept), WinDbg TTD: Time-Travel Debugging (cited concept), Claude Code Agentic Team Hackathon, CognitiveOS (Alternative Project), Demo Timing Schedule, GitHub Copilot x Azure Hackathon (+4 more)

### Community 8 - "compute_delta Implementation"
Cohesion: 0.33
Nodes (4): compute_delta(), JSON diff between two states — only changed keys with {old, new} pairs.      Fir, When prev_state is empty, delta stores the full initial state., TestComputeDelta

### Community 9 - "Azure Deployment"
Cohesion: 0.5
Nodes (4): Phase 4: Azure Deploy + Polish (30 min), Tech: Azure Container Apps (Deployment), Plan: Azure Container Apps Deploy Commands, Plan Phase 4: Azure Deploy + Polish Tasks

### Community 10 - "WebSocket Broadcast"
Cohesion: 0.5
Nodes (2): Remove a disconnected WebSocket., Send a JSON message to all connected clients.          Silently removes dead con

### Community 11 - "WebSocket Manager"
Cohesion: 0.67
Nodes (1): WebSocket connection manager — broadcasts checkpoint events to all connected cli

### Community 12 - "Phase 0 Setup"
Cohesion: 1.0
Nodes (2): Phase 0: Setup (30 min), Plan Phase 0: Environment Setup Tasks

### Community 13 - "Judge Persona"
Cohesion: 1.0
Nodes (1): Primary Persona: Hackathon Judge (Microsoft PE)

### Community 14 - "Enterprise Customer"
Cohesion: 1.0
Nodes (1): Primary Customer: AI Platform Engineers Fortune 500

### Community 15 - "Community 15"
Cohesion: 1.0
Nodes (1): Track 1: Hackathon Win Demo Loop

### Community 16 - "Community 16"
Cohesion: 1.0
Nodes (1): Track 3: Post-Hackathon SaaS Open Source

### Community 17 - "Community 17"
Cohesion: 1.0
Nodes (1): Test Subagent (tests/)

### Community 18 - "Community 18"
Cohesion: 1.0
Nodes (1): File: frontend/src/replay_controls.js

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (1): Dependency: uvicorn[standard]==0.31.0

### Community 20 - "Community 20"
Cohesion: 1.0
Nodes (1): Dependency: websockets==13.1

### Community 21 - "Community 21"
Cohesion: 1.0
Nodes (1): Dependency: pydantic==2.10.0

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (1): Dependency: pytest==8.3.3

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): Number of currently active WebSocket connections.

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): insert_embedding

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): get_baseline_embedding

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): run_id fixture

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): sentence-transformers==3.3.1

## Ambiguous Edges - Review These
- `compute_delta` → `deepdiff==8.0.1`  [AMBIGUOUS]
  backend/snapshot_engine.py · relation: references

## Knowledge Gaps
- **81 isolated node(s):** `NYTechWeek Hackathon 2026`, `GitHub Copilot x Azure Hackathon`, `CognitiveOS (Alternative Project)`, `Demo Timing Schedule`, `Primary Persona: Hackathon Judge (Microsoft PE)` (+76 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `WebSocket Broadcast`** (4 nodes): `Remove a disconnected WebSocket.`, `Send a JSON message to all connected clients.          Silently removes dead con`, `.broadcast()`, `.disconnect()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WebSocket Manager`** (3 nodes): `websocket_manager.py`, `connection_count()`, `WebSocket connection manager — broadcasts checkpoint events to all connected cli`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Phase 0 Setup`** (2 nodes): `Phase 0: Setup (30 min)`, `Plan Phase 0: Environment Setup Tasks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Judge Persona`** (1 nodes): `Primary Persona: Hackathon Judge (Microsoft PE)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Enterprise Customer`** (1 nodes): `Primary Customer: AI Platform Engineers Fortune 500`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 15`** (1 nodes): `Track 1: Hackathon Win Demo Loop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (1 nodes): `Track 3: Post-Hackathon SaaS Open Source`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 17`** (1 nodes): `Test Subagent (tests/)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (1 nodes): `File: frontend/src/replay_controls.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `Dependency: uvicorn[standard]==0.31.0`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (1 nodes): `Dependency: websockets==13.1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 21`** (1 nodes): `Dependency: pydantic==2.10.0`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `Dependency: pytest==8.3.3`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `Number of currently active WebSocket connections.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `insert_embedding`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `get_baseline_embedding`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `run_id fixture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `sentence-transformers==3.3.1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `compute_delta` and `deepdiff==8.0.1`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `WebSocketManager` connect `Demo Agent + Instrumentation` to `WebSocket Manager`, `WebSocket Broadcast`, `FastAPI App + Models`?**
  _High betweenness centrality (0.112) - this node is a cross-community bridge._
- **Why does `Checkpoint` connect `Snapshot Engine + Storage` to `compute_delta Implementation`, `Demo Agent + Instrumentation`, `FastAPI App + Models`, `Test Harness`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Why does `WebSocketMessage` connect `Demo Agent + Instrumentation` to `Snapshot Engine + Storage`, `FastAPI App + Models`?**
  _High betweenness centrality (0.067) - this node is a cross-community bridge._
- **Are the 24 inferred relationships involving `WebSocketManager` (e.g. with `TimeWarpMiddleware` and `TimeWarp LangGraph instrumentation middleware.  Wraps every agent node function`) actually correct?**
  _`WebSocketManager` has 24 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `Checkpoint` (e.g. with `Async Supabase interface for TimeWarp checkpoint storage.  All public functions` and `Lazy-init singleton Supabase client.`) actually correct?**
  _`Checkpoint` has 17 INFERRED edges - model-reasoned connections that need verification._
- **Are the 14 inferred relationships involving `TimeWarpMiddleware` (e.g. with `WebSocketMessage` and `WebSocketManager`) actually correct?**
  _`TimeWarpMiddleware` has 14 INFERRED edges - model-reasoned connections that need verification._