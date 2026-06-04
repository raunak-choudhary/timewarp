"""Behavior DAG and Bellman-Ford anomaly path detection."""
from __future__ import annotations

import os
from collections import defaultdict
from typing import Optional
from uuid import UUID

from dotenv import load_dotenv

from backend.models import Checkpoint

load_dotenv(override=True)


class BehaviorDAG:
    """Directed behavior graph of checkpoint execution with drift-weighted edges."""

    def __init__(self, threshold: Optional[float] = None) -> None:
        self.threshold = (
            threshold
            if threshold is not None
            else float(os.getenv("DRIFT_THRESHOLD", "0.72"))
        )
        self.nodes: dict[str, dict] = {}
        self.edges: list[tuple[str, str, float]] = []
        self._run_nodes: dict[str, set[str]] = defaultdict(set)

    def add_node(self, checkpoint: Checkpoint, drift_score: float) -> None:
        """Add a checkpoint node and parent edge weighted by divergence."""
        node_id = str(checkpoint.id)
        run_id = str(checkpoint.run_id)
        normalized_score = max(0.0, min(1.0, drift_score))
        self.nodes[node_id] = {
            "run_id": run_id,
            "node_name": checkpoint.node_name,
            "timestamp_ns": checkpoint.timestamp_ns,
            "drift_score": normalized_score,
            "is_anomaly": normalized_score < self.threshold,
        }
        self._run_nodes[run_id].add(node_id)

        if checkpoint.parent_id is not None:
            parent_id = str(checkpoint.parent_id)
            divergence_weight = 1.0 - normalized_score
            self._replace_edge(parent_id, node_id, divergence_weight)

    def bellman_ford_earliest_divergence(
        self, start_id: str, end_id: str
    ) -> list[str]:
        """Return the maximum-divergence path from start_id to end_id."""
        if start_id not in self.nodes or end_id not in self.nodes:
            return []
        if start_id == end_id:
            return [start_id]

        distance = {node_id: float("inf") for node_id in self.nodes}
        predecessor: dict[str, Optional[str]] = {node_id: None for node_id in self.nodes}
        distance[start_id] = 0.0

        for _ in range(max(len(self.nodes) - 1, 0)):
            changed = False
            for source, target, divergence_weight in self.edges:
                weight = -divergence_weight
                if distance[source] + weight < distance[target]:
                    distance[target] = distance[source] + weight
                    predecessor[target] = source
                    changed = True
            if not changed:
                break

        if distance[end_id] == float("inf"):
            return []

        path: list[str] = []
        current: Optional[str] = end_id
        while current is not None:
            path.append(current)
            if current == start_id:
                break
            current = predecessor[current]

        if not path or path[-1] != start_id:
            return []
        return list(reversed(path))

    def get_anomaly_path(self, run_id: UUID) -> list[str]:
        """Return checkpoint IDs from run start to the earliest anomalous node."""
        run_key = str(run_id)
        run_node_ids = self._run_nodes.get(run_key, set())
        if not run_node_ids:
            return []

        ordered_nodes = sorted(
            run_node_ids, key=lambda node_id: self.nodes[node_id]["timestamp_ns"]
        )
        anomaly_nodes = [
            node_id for node_id in ordered_nodes if self.nodes[node_id]["is_anomaly"]
        ]
        if not anomaly_nodes:
            return []

        return self.bellman_ford_earliest_divergence(
            ordered_nodes[0], anomaly_nodes[0]
        )

    def get_node_names(self, path: list[str]) -> list[str]:
        """Return node names for a checkpoint ID path."""
        return [self.nodes[node_id]["node_name"] for node_id in path if node_id in self.nodes]

    def _replace_edge(self, source: str, target: str, weight: float) -> None:
        self.edges = [
            edge for edge in self.edges if not (edge[0] == source and edge[1] == target)
        ]
        self.edges.append((source, target, weight))


_behavior_dag: Optional[BehaviorDAG] = None


def get_behavior_dag() -> BehaviorDAG:
    """Return process-wide behavior DAG for live WebSocket anomaly updates."""
    global _behavior_dag
    if _behavior_dag is None:
        _behavior_dag = BehaviorDAG()
    return _behavior_dag
