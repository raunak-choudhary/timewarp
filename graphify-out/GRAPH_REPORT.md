# Graph Report - timewarp  (2026-06-04)

## Corpus Check
- 29 files · ~21,259 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 388 nodes · 691 edges · 46 communities detected
- Extraction: 59% EXTRACTED · 41% INFERRED · 0% AMBIGUOUS · INFERRED: 285 edges (avg confidence: 0.59)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]

## God Nodes (most connected - your core abstractions)
1. `Checkpoint` - 51 edges
2. `WebSocketManager` - 48 edges
3. `TimeWarpTimeline` - 30 edges
4. `TimeWarpMiddleware` - 28 edges
5. `PersistentSegmentTree` - 25 edges
6. `BehaviorDAG` - 23 edges
7. `StateSnapshot` - 18 edges
8. `BranchRequest` - 17 edges
9. `DriftDetector` - 15 edges
10. `System Architecture Overview` - 13 edges

## Surprising Connections (you probably didn't know these)
- `Tests for backend/drift_detector.py - Phase 2 semantic drift scoring.` --uses--> `DriftDetector`  [INFERRED]
  tests/test_drift_detector.py → backend/drift_detector.py
- `Manual cosine similarity returns a low score for divergent vectors.` --uses--> `DriftDetector`  [INFERRED]
  tests/test_drift_detector.py → backend/drift_detector.py
- `Sentence embeddings put unrelated strings below the anomaly threshold.` --uses--> `DriftDetector`  [INFERRED]
  tests/test_drift_detector.py → backend/drift_detector.py
- `_checkpoint()` --calls--> `Checkpoint`  [INFERRED]
  tests/test_anomaly_graph.py → backend/models.py
- `Tests for backend/anomaly_graph.py - Phase 2 Bellman-Ford anomaly paths.` --uses--> `Checkpoint`  [INFERRED]
  tests/test_anomaly_graph.py → backend/models.py

## Hyperedges (group relationships)
- **Checkpoint creation pipeline** - instrumentation_wrapnode, snapshot_engine_snapshotnodeexecution, supabase_client_insertcheckpoint, models_checkpoint [EXTRACTED 1.00]
- **WebSocket live broadcast pipeline** - instrumentation_wrapnode, websocket_manager_broadcast, models_websocketmessage, main_websocket_endpoint [EXTRACTED 1.00]
- **State reconstruction pipeline** - main_replay_at_time, supabase_client_getcheckpointsinrange, snapshot_engine_reconstructstate, models_statesnapshot [EXTRACTED 1.00]
- **LangGraph 5-node research pipeline** - demo_agent_plan_task, demo_agent_search_web, demo_agent_analyze_results, demo_agent_synthesize, demo_agent_format_output [EXTRACTED 1.00]
- **Branch run execution path** - main_create_branch, demo_agent_run_demo_agent, instrumentation_timewarp_middleware, models_branchrequest [EXTRACTED 1.00]
- **Delta compression + hash chaining algorithms** - snapshot_engine_computedelta, snapshot_engine_computehash, snapshot_engine_reconstructstate, snapshot_engine_deltachainpattern [EXTRACTED 0.95]
- **Snapshot engine test harness** - test_snapshot_engine_testcomputedelta, test_snapshot_engine_testcomputehash, test_snapshot_engine_testreconstructstate, conftest_sample_state_v1, conftest_sample_state_v2 [EXTRACTED 1.00]

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (48): Reconstruct the full agent state at any historical timestamp., replay_at_time(), Checkpoint, PersistentSegmentTree, Replay engine for O(log n) checkpoint lookup over a run timeline., Persistent segment tree node storing the newest checkpoint in its range., Persistent segment tree over nanosecond checkpoint timestamps., Insert a checkpoint in O(log U), where U is the timestamp range. (+40 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (53): Raunak Choudhary (Human Partner), Demo Subagent (agent_demo/ seed data), Frontend Subagent (Three.js/D3/WebSocket), WebSocket Message Schema (frozen), Algorithm: Bellman-Ford on Behavior DAG, Algorithm: Delta Compression + Checkpoint Chain, Algorithm: Transformer Embedding Drift Detection, Algorithm: Persistent Segment Tree (Replay Engine) (+45 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (44): AgentState, analyze_results(), build_demo_graph(), _call_claude(), format_output(), plan_task(), _prompt_for_node(), TimeWarp demo agent - a 5-node LangGraph research pipeline.  Each node is wrappe (+36 more)

### Community 3 - "Community 3"
Cohesion: 0.11
Nodes (8): calculateBoundedNodeLayout(), getFitCameraPose(), getFocusCameraPose(), normalizeCheckpoint(), statusFromCheckpoint(), TimeWarpTimeline, visibleCheckpointIdsAt(), routeCheckpointMessage()

### Community 4 - "Community 4"
Cohesion: 0.14
Nodes (25): create_branch(), get_checkpoints(), lifespan(), list_runs(), TimeWarp FastAPI application - REST endpoints + WebSocket live stream.  REST API, Return the Bellman-Ford anomaly path. Phase 2 - stub for Phase 1., Start a new agent run branching from from_timestamp_ns with new_prompt injected., Return all runs with summary stats (node count, anomaly flag, timestamps). (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.12
Nodes (15): BehaviorDAG, get_behavior_dag(), Behavior DAG and Bellman-Ford anomaly path detection., Return node names for a checkpoint ID path., Return process-wide behavior DAG for live WebSocket anomaly updates., Directed behavior graph of checkpoint execution with drift-weighted edges., Add a checkpoint node and parent edge weighted by divergence., Return the maximum-divergence path from start_id to end_id. (+7 more)

### Community 6 - "Community 6"
Cohesion: 0.17
Nodes (15): DriftDetector, get_drift_detector(), Transformer embedding drift detector for TimeWarp checkpoints., Store output_text embedding as a new baseline sample for node_name., Return process-wide drift detector with model loaded once., Scores node output against baseline semantic embeddings., Embed text into a 384-dimensional vector., Return cosine similarity in [0, 1] for two embedding vectors. (+7 more)

### Community 7 - "Community 7"
Cohesion: 0.17
Nodes (17): fetchJson(), getAnomalyPath(), getCheckpoints(), listRuns(), replayAt(), startRun(), bootstrap(), loadRun() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (16): REST API Contract (frozen), Backend Subagent (Python/FastAPI/Supabase), File: frontend/src/diff_view.js, File: backend/main.py (FastAPI entrypoint), Rationale: FastAPI over Flask (async + Pydantic + cold start), Rationale: Local sentence-transformers over OpenAI embeddings, Rationale: Supabase over raw PostgreSQL (free tier + pgvector), Supabase Schema (checkpoints, embeddings, baseline_embeddings) (+8 more)

### Community 9 - "Community 9"
Cohesion: 0.19
Nodes (5): buildBranchPayload(), DiffView, extractPromptFromState(), buildWebSocketUrl(), TimeWarpSocket

### Community 10 - "Community 10"
Cohesion: 0.17
Nodes (12): TimeWarp Project Identity, Bennett 1973: Reversible Computation (cited concept), Mozilla rr: Time-Travel Debugging (cited concept), WinDbg TTD: Time-Travel Debugging (cited concept), Claude Code Agentic Team Hackathon, CognitiveOS (Alternative Project), Demo Timing Schedule, GitHub Copilot x Azure Hackathon (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.31
Nodes (2): clampTimestamp(), ReplayController

### Community 12 - "Community 12"
Cohesion: 0.5
Nodes (4): Phase 4: Azure Deploy + Polish (30 min), Tech: Azure Container Apps (Deployment), Plan: Azure Container Apps Deploy Commands, Plan Phase 4: Azure Deploy + Polish Tasks

### Community 13 - "Community 13"
Cohesion: 1.0
Nodes (3): sample_state_v1 fixture, sample_state_v2 fixture, TestReconstructState

### Community 14 - "Community 14"
Cohesion: 1.0
Nodes (2): Phase 0: Setup (30 min), Plan Phase 0: Environment Setup Tasks

### Community 19 - "Community 19"
Cohesion: 1.0
Nodes (1): run_id fixture

### Community 22 - "Community 22"
Cohesion: 1.0
Nodes (1): broadcast

### Community 24 - "Community 24"
Cohesion: 1.0
Nodes (1): Primary Persona: Hackathon Judge (Microsoft PE)

### Community 25 - "Community 25"
Cohesion: 1.0
Nodes (1): Primary Customer: AI Platform Engineers Fortune 500

### Community 26 - "Community 26"
Cohesion: 1.0
Nodes (1): Track 1: Hackathon Win Demo Loop

### Community 27 - "Community 27"
Cohesion: 1.0
Nodes (1): Track 3: Post-Hackathon SaaS Open Source

### Community 28 - "Community 28"
Cohesion: 1.0
Nodes (1): Test Subagent (tests/)

### Community 29 - "Community 29"
Cohesion: 1.0
Nodes (1): File: frontend/src/replay_controls.js

### Community 30 - "Community 30"
Cohesion: 1.0
Nodes (1): Dependency: uvicorn[standard]==0.31.0

### Community 31 - "Community 31"
Cohesion: 1.0
Nodes (1): Dependency: websockets==13.1

### Community 32 - "Community 32"
Cohesion: 1.0
Nodes (1): Dependency: pydantic==2.10.0

### Community 33 - "Community 33"
Cohesion: 1.0
Nodes (1): Dependency: pytest==8.3.3

### Community 34 - "Community 34"
Cohesion: 1.0
Nodes (1): Shared pytest fixtures for TimeWarp tests.

### Community 35 - "Community 35"
Cohesion: 1.0
Nodes (1): A fresh UUID for each test.

### Community 36 - "Community 36"
Cohesion: 1.0
Nodes (1): Tests for backend/snapshot_engine.py - Phase 1 milestone gate.  Key guarantee: c

### Community 37 - "Community 37"
Cohesion: 1.0
Nodes (1): When prev_state is empty, delta stores the full initial state.

### Community 38 - "Community 38"
Cohesion: 1.0
Nodes (1): Core guarantee: reconstruct(checkpoints) == original state at each step.

### Community 39 - "Community 39"
Cohesion: 1.0
Nodes (1): Simulate 5 sequential state transitions and verify full reconstruction.

### Community 40 - "Community 40"
Cohesion: 1.0
Nodes (1): __full_state__ fallback also reconstructs correctly.

### Community 41 - "Community 41"
Cohesion: 1.0
Nodes (1): TimeWarp Pydantic data models - shared across backend, instrumentation, and test

### Community 42 - "Community 42"
Cohesion: 1.0
Nodes (1): A single snapshot of agent state at one node execution.

### Community 43 - "Community 43"
Cohesion: 1.0
Nodes (1): Reconstructed agent state at a specific timestamp (returned by /replay/{ts}).

### Community 44 - "Community 44"
Cohesion: 1.0
Nodes (1): Result of comparing an LLM output against its baseline embedding.

### Community 45 - "Community 45"
Cohesion: 1.0
Nodes (1): Request body for POST /branch - create an alternate timeline.

### Community 46 - "Community 46"
Cohesion: 1.0
Nodes (1): Frozen WebSocket message schema - do not change (AGENTS.md).

### Community 47 - "Community 47"
Cohesion: 1.0
Nodes (1): WebSocket connection manager - broadcasts checkpoint events to all connected cli

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): Thread-safe (within asyncio) manager for active WebSocket connections.

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): Accept and register a new WebSocket connection.

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): Remove a disconnected WebSocket.

### Community 51 - "Community 51"
Cohesion: 1.0
Nodes (1): Send a JSON message to all connected clients.          Silently removes dead con

### Community 52 - "Community 52"
Cohesion: 1.0
Nodes (1): Number of currently active WebSocket connections.

## Knowledge Gaps
- **78 isolated node(s):** `run_id fixture`, `TestComputeDelta`, `TestComputeHash`, `broadcast`, `NYTechWeek Hackathon 2026` (+73 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (9 nodes): `replay_controls.js`, `clampTimestamp()`, `createReplayRequestUrl()`, `ReplayController`, `.constructor()`, `.pause()`, `.play()`, `.scrubTo()`, `.toggle()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 14`** (2 nodes): `Phase 0: Setup (30 min)`, `Plan Phase 0: Environment Setup Tasks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (1 nodes): `run_id fixture`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 22`** (1 nodes): `broadcast`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (1 nodes): `Primary Persona: Hackathon Judge (Microsoft PE)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 25`** (1 nodes): `Primary Customer: AI Platform Engineers Fortune 500`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 26`** (1 nodes): `Track 1: Hackathon Win Demo Loop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 27`** (1 nodes): `Track 3: Post-Hackathon SaaS Open Source`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 28`** (1 nodes): `Test Subagent (tests/)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 29`** (1 nodes): `File: frontend/src/replay_controls.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 30`** (1 nodes): `Dependency: uvicorn[standard]==0.31.0`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 31`** (1 nodes): `Dependency: websockets==13.1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 32`** (1 nodes): `Dependency: pydantic==2.10.0`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 33`** (1 nodes): `Dependency: pytest==8.3.3`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 34`** (1 nodes): `Shared pytest fixtures for TimeWarp tests.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 35`** (1 nodes): `A fresh UUID for each test.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 36`** (1 nodes): `Tests for backend/snapshot_engine.py - Phase 1 milestone gate.  Key guarantee: c`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 37`** (1 nodes): `When prev_state is empty, delta stores the full initial state.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 38`** (1 nodes): `Core guarantee: reconstruct(checkpoints) == original state at each step.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 39`** (1 nodes): `Simulate 5 sequential state transitions and verify full reconstruction.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 40`** (1 nodes): `__full_state__ fallback also reconstructs correctly.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 41`** (1 nodes): `TimeWarp Pydantic data models - shared across backend, instrumentation, and test`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 42`** (1 nodes): `A single snapshot of agent state at one node execution.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 43`** (1 nodes): `Reconstructed agent state at a specific timestamp (returned by /replay/{ts}).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 44`** (1 nodes): `Result of comparing an LLM output against its baseline embedding.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 45`** (1 nodes): `Request body for POST /branch - create an alternate timeline.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 46`** (1 nodes): `Frozen WebSocket message schema - do not change (AGENTS.md).`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 47`** (1 nodes): `WebSocket connection manager - broadcasts checkpoint events to all connected cli`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `Thread-safe (within asyncio) manager for active WebSocket connections.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `Accept and register a new WebSocket connection.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `Remove a disconnected WebSocket.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 51`** (1 nodes): `Send a JSON message to all connected clients.          Silently removes dead con`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 52`** (1 nodes): `Number of currently active WebSocket connections.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `websocket_endpoint()` connect `Community 4` to `Community 9`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Why does `Real-time checkpoint stream - connect once, receive all events.` connect `Community 4` to `Community 0`, `Community 2`, `Community 5`?**
  _High betweenness centrality (0.174) - this node is a cross-community bridge._
- **Why does `Checkpoint` connect `Community 0` to `Community 2`, `Community 4`, `Community 5`, `Community 6`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Are the 50 inferred relationships involving `Checkpoint` (e.g. with `DriftEvent` and `Tests for backend/replay_engine.py - Phase 2 replay queries.`) actually correct?**
  _`Checkpoint` has 50 INFERRED edges - model-reasoned connections that need verification._
- **Are the 48 inferred relationships involving `WebSocketManager` (e.g. with `TimeWarpMiddleware` and `TimeWarp LangGraph instrumentation middleware.  Wraps every agent node function`) actually correct?**
  _`WebSocketManager` has 48 INFERRED edges - model-reasoned connections that need verification._
- **Are the 23 inferred relationships involving `TimeWarpMiddleware` (e.g. with `WebSocketMessage` and `WebSocketManager`) actually correct?**
  _`TimeWarpMiddleware` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 17 inferred relationships involving `PersistentSegmentTree` (e.g. with `Tests for backend/replay_engine.py - Phase 2 replay queries.` and `Segment tree queries return the nearest historical checkpoint at or before T.`) actually correct?**
  _`PersistentSegmentTree` has 17 INFERRED edges - model-reasoned connections that need verification._