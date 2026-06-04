"""TimeWarp snapshot engine — delta compression + Git-style checkpoint chain.

Algorithm 1 (from CLAUDE.md):
  Every agent state is stored as a diff against the previous checkpoint.
  Structure: {checkpoint_id, parent_id, timestamp_ns, state_delta, hash}
  The hash chains them — like Git commits.
  Reconstruction is O(depth): walk chain from root to T, applying deltas.
"""
from __future__ import annotations

import hashlib
import json
import logging
import time
from typing import Any, Optional
from uuid import UUID

from deepdiff import DeepDiff

from backend import supabase_client
from backend.models import Checkpoint

logger = logging.getLogger(__name__)


def compute_delta(
    prev_state: dict[str, Any], curr_state: dict[str, Any]
) -> dict[str, Any]:
    """JSON diff between two states — only changed keys with {old, new} pairs.

    First checkpoint (prev_state empty) stores the full initial state.
    Compares top-level keys directly — handles strings, lists, and nested dicts
    without DeepDiff path-notation edge cases.
    """
    if not prev_state:
        return {"__initial__": curr_state}

    all_keys = set(prev_state.keys()) | set(curr_state.keys())
    delta: dict[str, Any] = {}

    for key in all_keys:
        prev_val = prev_state.get(key)
        curr_val = curr_state.get(key)
        if prev_val != curr_val:
            delta[key] = {"old": prev_val, "new": curr_val}

    return delta


def compute_hash(state_delta: dict[str, Any], parent_hash: str) -> str:
    """SHA-256(serialised_delta + parent_hash) — chains checkpoints like Git commits."""
    payload = json.dumps(state_delta, sort_keys=True, default=str) + parent_hash
    return hashlib.sha256(payload.encode()).hexdigest()


def reconstruct_state(checkpoints: list[dict[str, Any]]) -> dict[str, Any]:
    """Apply deltas in order from root to leaf. Returns the final reconstructed state.

    This is the lossless reconstruction guarantee: reconstruct(checkpoints) == original_state.
    """
    state: dict[str, Any] = {}

    for cp in checkpoints:
        delta = cp.get("state_delta", {})

        if "__initial__" in delta:
            state = dict(delta["__initial__"])
            continue

        if "__full_state__" in delta:
            state = dict(delta["__full_state__"])
            continue

        for key, change in delta.items():
            if not isinstance(change, dict) or "new" not in change:
                continue
            if change["new"] is None:
                state.pop(key, None)
            else:
                state[key] = change["new"]

    return state


async def snapshot_node_execution(
    run_id: UUID,
    node_name: str,
    prev_state: dict[str, Any],
    curr_state: dict[str, Any],
    parent_id: Optional[UUID],
    parent_hash: str = "",
    branch_id: Optional[UUID] = None,
) -> Checkpoint:
    """Compute delta + hash, persist to Supabase, return the saved Checkpoint.

    This is the main entry point called by TimeWarpMiddleware after each node.
    """
    delta = compute_delta(prev_state, curr_state)
    state_hash = compute_hash(delta, parent_hash)
    timestamp_ns = time.time_ns()

    checkpoint = Checkpoint(
        run_id=run_id,
        parent_id=parent_id,
        node_name=node_name,
        timestamp_ns=timestamp_ns,
        state_delta=delta,
        state_hash=state_hash,
        branch_id=branch_id,
    )

    inserted_id = await supabase_client.insert_checkpoint(checkpoint)

    # Update the id with the Supabase-assigned UUID
    from uuid import UUID as _UUID
    checkpoint.id = _UUID(inserted_id)

    logger.info(
        f"[snapshot] run={run_id} node={node_name!r} "
        f"checkpoint={checkpoint.id} delta_keys={list(delta.keys())}"
    )
    return checkpoint
