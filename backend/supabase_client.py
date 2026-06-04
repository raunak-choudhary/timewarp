"""Async Supabase interface for TimeWarp checkpoint storage.

All public functions are async - they wrap the sync supabase-py client
in asyncio.to_thread so the FastAPI event loop is never blocked.
All calls are wrapped in try/except with specific error messages.
"""
from __future__ import annotations

import asyncio
import logging
import os
from typing import Optional
from uuid import UUID

from dotenv import load_dotenv
from supabase import create_client, Client

from backend.models import Checkpoint

load_dotenv(override=True)
logger = logging.getLogger(__name__)

_client: Optional[Client] = None


def _get_client() -> Client:
    """Lazy-init singleton Supabase client."""
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")
        _client = create_client(url, key)
    return _client


async def ping() -> bool:
    """Test Supabase connection. Returns True if reachable."""
    try:
        client = _get_client()
        await asyncio.to_thread(
            lambda: client.table("checkpoints").select("id").limit(1).execute()
        )
        return True
    except Exception as e:
        logger.error(f"Supabase ping failed: {e}")
        return False


async def insert_checkpoint(checkpoint: Checkpoint) -> str:
    """Insert a checkpoint row. Returns the Supabase-assigned UUID string."""
    try:
        client = _get_client()
        data = checkpoint.model_dump(mode="json")
        data.pop("created_at", None)
        # Ensure all UUID fields are plain strings
        for field in ("id", "run_id", "parent_id", "branch_id"):
            if data.get(field) is not None:
                data[field] = str(data[field])
        result = await asyncio.to_thread(
            lambda: client.table("checkpoints").insert(data).execute()
        )
        inserted_id: str = result.data[0]["id"]
        logger.debug(f"Inserted checkpoint {inserted_id} for run {checkpoint.run_id}")
        return inserted_id
    except Exception as e:
        logger.error(f"insert_checkpoint failed for run {checkpoint.run_id}: {e}")
        raise


async def get_checkpoints_for_run(run_id: UUID) -> list[dict]:
    """All checkpoints for a run, ordered by timestamp_ns ASC."""
    try:
        client = _get_client()
        result = await asyncio.to_thread(
            lambda: client.table("checkpoints")
            .select("*")
            .eq("run_id", str(run_id))
            .order("timestamp_ns")
            .execute()
        )
        return result.data
    except Exception as e:
        logger.error(f"get_checkpoints_for_run failed for run {run_id}: {e}")
        raise


async def get_checkpoints_in_range(
    run_id: UUID, start_ns: int, end_ns: int
) -> list[dict]:
    """Checkpoints in [start_ns, end_ns] range - used by the segment tree replay."""
    try:
        client = _get_client()
        result = await asyncio.to_thread(
            lambda: client.table("checkpoints")
            .select("*")
            .eq("run_id", str(run_id))
            .gte("timestamp_ns", start_ns)
            .lte("timestamp_ns", end_ns)
            .order("timestamp_ns")
            .execute()
        )
        return result.data
    except Exception as e:
        logger.error(
            f"get_checkpoints_in_range failed for run {run_id} "
            f"[{start_ns}, {end_ns}]: {e}"
        )
        raise


async def get_all_runs() -> list[dict]:
    """Recent runs grouped by run_id with summary stats."""
    try:
        client = _get_client()
        result = await asyncio.to_thread(
            lambda: client.table("checkpoints")
            .select("run_id, node_name, timestamp_ns, is_anomaly, branch_id")
            .order("timestamp_ns", desc=True)
            .limit(500)
            .execute()
        )
        runs: dict[str, dict] = {}
        for row in result.data:
            rid = row["run_id"]
            if rid not in runs:
                runs[rid] = {
                    "run_id": rid,
                    "min_timestamp_ns": row["timestamp_ns"],
                    "max_timestamp_ns": row["timestamp_ns"],
                    "node_count": 0,
                    "has_anomaly": False,
                    "is_branch": row["branch_id"] is not None,
                }
            runs[rid]["node_count"] += 1
            runs[rid]["min_timestamp_ns"] = min(
                runs[rid]["min_timestamp_ns"], row["timestamp_ns"]
            )
            runs[rid]["max_timestamp_ns"] = max(
                runs[rid]["max_timestamp_ns"], row["timestamp_ns"]
            )
            if row["is_anomaly"]:
                runs[rid]["has_anomaly"] = True
        return list(runs.values())
    except Exception as e:
        logger.error(f"get_all_runs failed: {e}")
        raise


async def insert_embedding(checkpoint_id: UUID, embedding: list[float]) -> None:
    """Store a 384-dim embedding vector for drift detection (Phase 2)."""
    try:
        client = _get_client()
        data = {
            "checkpoint_id": str(checkpoint_id),
            "embedding": embedding,
        }
        await asyncio.to_thread(
            lambda: client.table("embeddings").insert(data).execute()
        )
        logger.debug(f"Inserted embedding for checkpoint {checkpoint_id}")
    except Exception as e:
        logger.error(f"insert_embedding failed for checkpoint {checkpoint_id}: {e}")
        raise


async def insert_baseline_embedding(node_name: str, embedding: list[float]) -> None:
    """Store a baseline embedding sample for a node."""
    try:
        client = _get_client()
        data = {
            "node_name": node_name,
            "embedding": embedding,
        }
        await asyncio.to_thread(
            lambda: client.table("baseline_embeddings").insert(data).execute()
        )
        logger.debug(f"Inserted baseline embedding for node {node_name}")
    except Exception as e:
        logger.error(f"insert_baseline_embedding failed for node {node_name}: {e}")
        raise


async def update_checkpoint_drift(
    checkpoint_id: UUID, drift_score: float, is_anomaly: bool
) -> None:
    """Persist drift score and anomaly flag onto an existing checkpoint row."""
    try:
        client = _get_client()
        data = {
            "drift_score": drift_score,
            "is_anomaly": is_anomaly,
        }
        await asyncio.to_thread(
            lambda: client.table("checkpoints")
            .update(data)
            .eq("id", str(checkpoint_id))
            .execute()
        )
        logger.debug(
            f"Updated drift for checkpoint {checkpoint_id}: "
            f"score={drift_score:.3f} anomaly={is_anomaly}"
        )
    except Exception as e:
        logger.error(f"update_checkpoint_drift failed for checkpoint {checkpoint_id}: {e}")
        raise


async def get_baseline_embedding(node_name: str) -> Optional[list[float]]:
    """Most recent baseline embedding for a node (Phase 2)."""
    try:
        client = _get_client()
        result = await asyncio.to_thread(
            lambda: client.table("baseline_embeddings")
            .select("embedding")
            .eq("node_name", node_name)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        return result.data[0]["embedding"] if result.data else None
    except Exception as e:
        logger.error(f"get_baseline_embedding failed for node {node_name}: {e}")
        raise
