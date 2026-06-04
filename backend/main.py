"""TimeWarp FastAPI application — REST endpoints + WebSocket live stream.

REST API Contract (frozen — from AGENTS.md):
  GET  /checkpoints?run_id={uuid}
  GET  /replay/{timestamp_ns}?run_id={uuid}
  GET  /anomaly/path?run_id={uuid}      ← Phase 2 stub
  POST /branch
  GET  /runs
  POST /runs/start
  WS   /ws/live

Start:
  uvicorn backend.main:app --reload --port 8000
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from uuid import UUID, uuid4

from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend import supabase_client
from backend import snapshot_engine
from backend.models import BranchRequest, StateSnapshot
from backend.websocket_manager import WebSocketManager

load_dotenv(override=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(name)-30s  %(levelname)s  %(message)s",
)
logger = logging.getLogger(__name__)

# Shared WebSocket manager — single instance for the process lifetime
ws_manager = WebSocketManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: verify Supabase is reachable."""
    ok = await supabase_client.ping()
    if ok:
        logger.info("✅ Supabase connected")
    else:
        logger.error("❌ Supabase connection FAILED — check .env SUPABASE_URL / SUPABASE_KEY")
    yield
    logger.info("TimeWarp shutting down")


app = FastAPI(
    title="TimeWarp API",
    description="AI Agent Time-Travel Debugger",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── REST Endpoints ───────────────────────────────────────────────────────────

@app.get("/checkpoints", summary="All checkpoints for a run")
async def get_checkpoints(run_id: UUID):
    """Return every checkpoint for run_id, ordered by timestamp_ns ASC."""
    try:
        data = await supabase_client.get_checkpoints_for_run(run_id)
        return {"run_id": str(run_id), "checkpoints": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/replay/{timestamp_ns}", summary="Reconstruct state at time T")
async def replay_at_time(timestamp_ns: int, run_id: UUID):
    """Reconstruct the full agent state at any historical timestamp."""
    try:
        checkpoints = await supabase_client.get_checkpoints_in_range(
            run_id, 0, timestamp_ns
        )
        if not checkpoints:
            raise HTTPException(
                status_code=404,
                detail=f"No checkpoints found before timestamp {timestamp_ns}",
            )
        reconstructed = snapshot_engine.reconstruct_state(checkpoints)
        return StateSnapshot(
            run_id=run_id,
            timestamp_ns=timestamp_ns,
            reconstructed_state=reconstructed,
            checkpoints_applied=len(checkpoints),
        ).model_dump(mode="json")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/anomaly/path", summary="Bellman-Ford root-cause path (Phase 2)")
async def get_anomaly_path(run_id: UUID):
    """Return the Bellman-Ford anomaly path. Phase 2 — stub for Phase 1."""
    return {
        "run_id": str(run_id),
        "anomaly_path": [],
        "message": "Anomaly detection coming in Phase 2",
    }


@app.post("/branch", summary="Create an alternate timeline with a modified prompt")
async def create_branch(request: BranchRequest, background_tasks: BackgroundTasks):
    """Start a new agent run branching from from_timestamp_ns with new_prompt injected."""
    from agent_demo.demo_agent import run_demo_agent

    branch_run_id = uuid4()
    background_tasks.add_task(
        run_demo_agent,
        branch_run_id,
        ws_manager,
        injected_prompt=request.new_prompt,
        branch_id=request.run_id,
    )
    logger.info(
        f"Branch started: {branch_run_id} from run {request.run_id} "
        f"at node {request.node_name!r}"
    )
    return {
        "branch_run_id": str(branch_run_id),
        "from_run_id": str(request.run_id),
        "status": "started",
    }


@app.get("/runs", summary="List recent agent runs")
async def list_runs():
    """Return all runs with summary stats (node count, anomaly flag, timestamps)."""
    try:
        runs = await supabase_client.get_all_runs()
        return {"runs": runs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/runs/start", summary="Start a new demo agent run")
async def start_run(background_tasks: BackgroundTasks):
    """Kick off the demo agent. Returns run_id immediately; agent runs in background."""
    from agent_demo.demo_agent import run_demo_agent

    run_id = uuid4()
    background_tasks.add_task(run_demo_agent, run_id, ws_manager)
    logger.info(f"Started new demo run: {run_id}")
    return {"run_id": str(run_id), "status": "started"}


# ─── WebSocket ────────────────────────────────────────────────────────────────

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time checkpoint stream — connect once, receive all events."""
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client may send ping text
            await websocket.receive_text()
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        await ws_manager.disconnect(websocket)
