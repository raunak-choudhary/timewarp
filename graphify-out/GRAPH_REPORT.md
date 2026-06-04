# Graph Report - .  (2026-06-04)

## Corpus Check
- Corpus is ~6,880 words - fits in a single context window. You may not need a graph.

## Summary
- 97 nodes · 117 edges · 19 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Core Algorithms + Demo|Core Algorithms + Demo]]
- [[_COMMUNITY_Backend Architecture|Backend Architecture]]
- [[_COMMUNITY_Project Identity + Inspiration|Project Identity + Inspiration]]
- [[_COMMUNITY_Frontend + WebSocket|Frontend + WebSocket]]
- [[_COMMUNITY_Demo Agent + Human Partner|Demo Agent + Human Partner]]
- [[_COMMUNITY_Embedding + Storage Layer|Embedding + Storage Layer]]
- [[_COMMUNITY_API Contract + FastAPI|API Contract + FastAPI]]
- [[_COMMUNITY_Azure Deployment|Azure Deployment]]
- [[_COMMUNITY_Phase 0 Setup|Phase 0 Setup]]
- [[_COMMUNITY_Judge Persona|Judge Persona]]
- [[_COMMUNITY_Enterprise Customer|Enterprise Customer]]
- [[_COMMUNITY_Hackathon Track 1|Hackathon Track 1]]
- [[_COMMUNITY_Post-Hackathon SaaS|Post-Hackathon SaaS]]
- [[_COMMUNITY_Test Subagent|Test Subagent]]
- [[_COMMUNITY_Replay Controls UI|Replay Controls UI]]
- [[_COMMUNITY_Uvicorn Dependency|Uvicorn Dependency]]
- [[_COMMUNITY_WebSockets Dependency|WebSockets Dependency]]
- [[_COMMUNITY_Pydantic Dependency|Pydantic Dependency]]
- [[_COMMUNITY_Pytest Dependency|Pytest Dependency]]

## God Nodes (most connected - your core abstractions)
1. `System Architecture Overview` - 13 edges
2. `File: backend/instrumentation.py` - 9 edges
3. `File: backend/drift_detector.py` - 8 edges
4. `TimeWarp Project` - 7 edges
5. `Data Flow: LangGraph to WebSocket to Frontend` - 7 edges
6. `File: backend/snapshot_engine.py` - 7 edges
7. `Reversible Computation Approach` - 6 edges
8. `Algorithm: Persistent Segment Tree (Replay Engine)` - 6 edges
9. `Algorithm: Bellman-Ford on Behavior DAG` - 6 edges
10. `Algorithm: Transformer Embedding Drift Detection` - 6 edges

## Surprising Connections (you probably didn't know these)
- `TimeWarp Project` --conceptually_related_to--> `Reversible Computation Approach`  [INFERRED]
  README.md → STRATEGY.md
- `Backend Subagent (Python/FastAPI/Supabase)` --references--> `Tech: Supabase (PostgreSQL + pgvector)`  [EXTRACTED]
  AGENTS.md → CLAUDE.md
- `File: backend/instrumentation.py` --references--> `WebSocket Message Schema (frozen)`  [EXTRACTED]
  CLAUDE.md → AGENTS.md
- `Dependency: numpy==2.1.3` --implements--> `Algorithm: Transformer Embedding Drift Detection`  [INFERRED]
  requirements.txt → CLAUDE.md
- `Dependency: deepdiff==8.0.1` --implements--> `File: backend/snapshot_engine.py`  [INFERRED]
  requirements.txt → CLAUDE.md

## Hyperedges (group relationships)
- **Core Algorithm Suite** — claude_algo_delta_compression, claude_algo_segment_tree, claude_algo_bellman_ford, claude_algo_drift_detection [EXTRACTED 1.00]
- **Backend Python Modules** — claude_file_main_py, claude_file_snapshot_engine, claude_file_replay_engine, claude_file_drift_detector, claude_file_anomaly_graph, claude_file_instrumentation, claude_file_models, claude_file_supabase_client [EXTRACTED 1.00]
- **Frontend JavaScript Modules** — claude_file_timeline_js, claude_file_websocket_js, claude_file_replay_controls_js, claude_file_diff_view_js [EXTRACTED 1.00]
- **Multi-Agent Dispatch System** — agents_subagent_backend, agents_subagent_frontend, agents_subagent_demo, agents_subagent_test [EXTRACTED 1.00]
- **6-Hour Hackathon Sprint Phases** — claude_phase0, claude_phase1, claude_phase2, claude_phase3, claude_phase4 [EXTRACTED 1.00]
- **Full Tech Stack** — claude_tech_fastapi, claude_tech_langgraph, claude_tech_supabase, claude_tech_sentence_transformers, claude_tech_threejs, claude_tech_d3, claude_tech_azure, claude_tech_anthropic_sdk [EXTRACTED 1.00]
- **Python Dependencies** — req_fastapi, req_uvicorn, req_websockets, req_supabase, req_langgraph, req_anthropic, req_sentence_transformers, req_torch, req_pydantic, req_pytest, req_deepdiff, req_numpy [EXTRACTED 1.00]
- **Key Engineering Design Rationales** — claude_rationale_fastapi_over_flask, claude_rationale_local_embeddings, claude_rationale_threejs_over_d3, claude_rationale_supabase, claude_rationale_segment_tree, claude_rationale_bellman_ford [EXTRACTED 1.00]

## Communities

### Community 0 - "Core Algorithms + Demo"
Cohesion: 0.13
Nodes (18): Algorithm: Bellman-Ford on Behavior DAG, Algorithm: Delta Compression + Checkpoint Chain, Algorithm: Transformer Embedding Drift Detection, Algorithm: Persistent Segment Tree (Replay Engine), Demo Script: 3-minute Judge Presentation, File: agent_demo/inject_failure.py, Rationale: Bellman-Ford over Dijkstra (zero-weight edges + negative cycle detection), Rationale: Persistent segment tree over naive replay (O(log n)) (+10 more)

### Community 1 - "Backend Architecture"
Cohesion: 0.25
Nodes (16): System Architecture Overview, Data Flow: LangGraph to WebSocket to Frontend, File: backend/anomaly_graph.py, File: backend/drift_detector.py, File: backend/instrumentation.py, File: backend/models.py, File: backend/replay_engine.py, File: backend/snapshot_engine.py (+8 more)

### Community 2 - "Project Identity + Inspiration"
Cohesion: 0.17
Nodes (12): TimeWarp Project Identity, Bennett 1973: Reversible Computation (cited concept), Mozilla rr: Time-Travel Debugging (cited concept), WinDbg TTD: Time-Travel Debugging (cited concept), Claude Code Agentic Team Hackathon, CognitiveOS (Alternative Project), Demo Timing Schedule, GitHub Copilot x Azure Hackathon (+4 more)

### Community 3 - "Frontend + WebSocket"
Cohesion: 0.22
Nodes (11): Frontend Subagent (Three.js/D3/WebSocket), WebSocket Message Schema (frozen), File: frontend/src/timeline.js, File: frontend/src/websocket.js, Phase 3: 4D Frontend Visualization (60 min), Rationale: Three.js over D3 for 3D (WebGL vs SVG), Tech: D3.js (Time Scrubber / Charts), Tech: Three.js (3D Visualization) (+3 more)

### Community 4 - "Demo Agent + Human Partner"
Cohesion: 0.25
Nodes (8): Raunak Choudhary (Human Partner), Demo Subagent (agent_demo/ seed data), File: agent_demo/demo_agent.py, File: agent_demo/seed_data.py, Tech: Claude Sonnet 4.5 via Anthropic SDK, Tech: LangGraph (Agent Framework), Dependency: anthropic==0.40.0, Dependency: langgraph==0.2.50

### Community 5 - "Embedding + Storage Layer"
Cohesion: 0.25
Nodes (8): Rationale: Local sentence-transformers over OpenAI embeddings, Rationale: Supabase over raw PostgreSQL (free tier + pgvector), Supabase Schema (checkpoints, embeddings, baseline_embeddings), Tech: sentence-transformers all-MiniLM-L6-v2, Tech: Supabase (PostgreSQL + pgvector), Dependency: sentence-transformers==3.3.1, Dependency: supabase==2.9.0, Dependency: torch==2.5.1

### Community 6 - "API Contract + FastAPI"
Cohesion: 0.25
Nodes (8): REST API Contract (frozen), Backend Subagent (Python/FastAPI/Supabase), File: frontend/src/diff_view.js, File: backend/main.py (FastAPI entrypoint), Rationale: FastAPI over Flask (async + Pydantic + cold start), Tech: FastAPI (Python Backend), Implementation: WebSocketManager class, Dependency: fastapi==0.115.0

### Community 7 - "Azure Deployment"
Cohesion: 0.5
Nodes (4): Phase 4: Azure Deploy + Polish (30 min), Tech: Azure Container Apps (Deployment), Plan: Azure Container Apps Deploy Commands, Plan Phase 4: Azure Deploy + Polish Tasks

### Community 8 - "Phase 0 Setup"
Cohesion: 1.0
Nodes (2): Phase 0: Setup (30 min), Plan Phase 0: Environment Setup Tasks

### Community 9 - "Judge Persona"
Cohesion: 1.0
Nodes (1): Primary Persona: Hackathon Judge (Microsoft PE)

### Community 10 - "Enterprise Customer"
Cohesion: 1.0
Nodes (1): Primary Customer: AI Platform Engineers Fortune 500

### Community 11 - "Hackathon Track 1"
Cohesion: 1.0
Nodes (1): Track 1: Hackathon Win Demo Loop

### Community 12 - "Post-Hackathon SaaS"
Cohesion: 1.0
Nodes (1): Track 3: Post-Hackathon SaaS Open Source

### Community 13 - "Test Subagent"
Cohesion: 1.0
Nodes (1): Test Subagent (tests/)

### Community 14 - "Replay Controls UI"
Cohesion: 1.0
Nodes (1): File: frontend/src/replay_controls.js

### Community 15 - "Uvicorn Dependency"
Cohesion: 1.0
Nodes (1): Dependency: uvicorn[standard]==0.31.0

### Community 16 - "WebSockets Dependency"
Cohesion: 1.0
Nodes (1): Dependency: websockets==13.1

### Community 17 - "Pydantic Dependency"
Cohesion: 1.0
Nodes (1): Dependency: pydantic==2.10.0

### Community 18 - "Pytest Dependency"
Cohesion: 1.0
Nodes (1): Dependency: pytest==8.3.3

## Knowledge Gaps
- **50 isolated node(s):** `NYTechWeek Hackathon 2026`, `GitHub Copilot x Azure Hackathon`, `CognitiveOS (Alternative Project)`, `Demo Timing Schedule`, `Primary Persona: Hackathon Judge (Microsoft PE)` (+45 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Phase 0 Setup`** (2 nodes): `Phase 0: Setup (30 min)`, `Plan Phase 0: Environment Setup Tasks`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Judge Persona`** (1 nodes): `Primary Persona: Hackathon Judge (Microsoft PE)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Enterprise Customer`** (1 nodes): `Primary Customer: AI Platform Engineers Fortune 500`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Hackathon Track 1`** (1 nodes): `Track 1: Hackathon Win Demo Loop`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Post-Hackathon SaaS`** (1 nodes): `Track 3: Post-Hackathon SaaS Open Source`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Test Subagent`** (1 nodes): `Test Subagent (tests/)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Replay Controls UI`** (1 nodes): `File: frontend/src/replay_controls.js`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Uvicorn Dependency`** (1 nodes): `Dependency: uvicorn[standard]==0.31.0`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `WebSockets Dependency`** (1 nodes): `Dependency: websockets==13.1`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pydantic Dependency`** (1 nodes): `Dependency: pydantic==2.10.0`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Pytest Dependency`** (1 nodes): `Dependency: pytest==8.3.3`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `System Architecture Overview` connect `Backend Architecture` to `Core Algorithms + Demo`, `Frontend + WebSocket`, `Demo Agent + Human Partner`, `API Contract + FastAPI`?**
  _High betweenness centrality (0.296) - this node is a cross-community bridge._
- **Why does `Reversible Computation Approach` connect `Core Algorithms + Demo` to `Project Identity + Inspiration`?**
  _High betweenness centrality (0.212) - this node is a cross-community bridge._
- **Why does `TimeWarp Project` connect `Project Identity + Inspiration` to `Core Algorithms + Demo`?**
  _High betweenness centrality (0.176) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `File: backend/drift_detector.py` (e.g. with `Tech: sentence-transformers all-MiniLM-L6-v2` and `File: backend/supabase_client.py`) actually correct?**
  _`File: backend/drift_detector.py` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `NYTechWeek Hackathon 2026`, `GitHub Copilot x Azure Hackathon`, `CognitiveOS (Alternative Project)` to the rest of the system?**
  _50 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Core Algorithms + Demo` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._