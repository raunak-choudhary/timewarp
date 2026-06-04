"""Tests for backend/replay_engine.py - Phase 2 replay queries."""
from __future__ import annotations

from uuid import uuid4

from backend.models import Checkpoint
from backend.replay_engine import PersistentSegmentTree
from backend.snapshot_engine import compute_delta, compute_hash


def _checkpoint(
    *,
    run_id,
    node_name: str,
    timestamp_ns: int,
    prev_state: dict,
    curr_state: dict,
    parent_id=None,
    parent_hash: str = "",
) -> Checkpoint:
    delta = compute_delta(prev_state, curr_state)
    return Checkpoint(
        id=uuid4(),
        run_id=run_id,
        parent_id=parent_id,
        node_name=node_name,
        timestamp_ns=timestamp_ns,
        state_delta=delta,
        state_hash=compute_hash(delta, parent_hash),
    )


def test_query_returns_checkpoint_at_or_before_arbitrary_timestamp(run_id) -> None:
    """Segment tree queries return the nearest historical checkpoint at or before T."""
    tree = PersistentSegmentTree()
    states = [
        {"step": 1, "plan": "draft"},
        {"step": 2, "plan": "draft", "analysis": "patterns found"},
        {"step": 3, "plan": "draft", "analysis": "patterns found", "done": True},
    ]
    checkpoints = []
    prev_state = {}
    parent_id = None
    parent_hash = ""

    for index, state in enumerate(states):
        checkpoint = _checkpoint(
            run_id=run_id,
            node_name=f"node_{index}",
            timestamp_ns=(index + 1) * 100,
            prev_state=prev_state,
            curr_state=state,
            parent_id=parent_id,
            parent_hash=parent_hash,
        )
        checkpoints.append(checkpoint)
        tree.insert(checkpoint)
        prev_state = state
        parent_id = checkpoint.id
        parent_hash = checkpoint.state_hash

    assert tree.query(50) is None
    assert tree.query(100).id == checkpoints[0].id
    assert tree.query(250).id == checkpoints[1].id
    assert tree.query(999).id == checkpoints[2].id


def test_get_state_at_reconstructs_state_at_nearest_checkpoint(run_id) -> None:
    """Replay reconstructs the state as of the nearest checkpoint at or before T."""
    tree = PersistentSegmentTree()
    states = [
        {"task": "debug", "plan": ""},
        {"task": "debug", "plan": "inspect checkpoints"},
        {"task": "debug", "plan": "inspect checkpoints", "analysis": "drift found"},
    ]
    checkpoints = []
    prev_state = {}
    parent_id = None
    parent_hash = ""

    for index, state in enumerate(states):
        checkpoint = _checkpoint(
            run_id=run_id,
            node_name=f"node_{index}",
            timestamp_ns=(index + 1) * 1_000,
            prev_state=prev_state,
            curr_state=state,
            parent_id=parent_id,
            parent_hash=parent_hash,
        )
        checkpoints.append(checkpoint)
        tree.insert(checkpoint)
        prev_state = state
        parent_id = checkpoint.id
        parent_hash = checkpoint.state_hash

    assert tree.get_state_at(2_500, checkpoints) == states[1]
