"""Tests for backend/anomaly_graph.py - Phase 2 Bellman-Ford anomaly paths."""
from __future__ import annotations

from uuid import uuid4

from backend.anomaly_graph import BehaviorDAG
from backend.models import Checkpoint


def _checkpoint(run_id, node_name: str, timestamp_ns: int, parent_id=None) -> Checkpoint:
    return Checkpoint(
        id=uuid4(),
        run_id=run_id,
        parent_id=parent_id,
        node_name=node_name,
        timestamp_ns=timestamp_ns,
        state_delta={"node": {"old": None, "new": node_name}},
        state_hash=f"hash-{node_name}",
    )


def test_bellman_ford_path_ends_at_injected_failure_node(run_id) -> None:
    """The anomaly path traces the chain ending at the first anomalous node."""
    graph = BehaviorDAG()
    plan = _checkpoint(run_id, "plan_task", 100)
    search = _checkpoint(run_id, "search_web", 200, plan.id)
    analyze = _checkpoint(run_id, "analyze_results", 300, search.id)
    synthesize = _checkpoint(run_id, "synthesize", 400, analyze.id)

    graph.add_node(plan, drift_score=0.98)
    graph.add_node(search, drift_score=0.96)
    graph.add_node(analyze, drift_score=0.31)
    graph.add_node(synthesize, drift_score=0.88)

    path = graph.get_anomaly_path(run_id)

    assert path
    assert path[-1] == str(analyze.id)
    assert graph.nodes[path[-1]]["node_name"] == "analyze_results"
