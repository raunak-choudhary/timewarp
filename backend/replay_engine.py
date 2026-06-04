"""Replay engine for O(log n) checkpoint lookup over a run timeline."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Optional

from backend.models import Checkpoint
from backend.snapshot_engine import reconstruct_state


@dataclass(frozen=True)
class SegmentTreeNode:
    """Persistent segment tree node storing the newest checkpoint in its range."""

    left: Optional["SegmentTreeNode"] = None
    right: Optional["SegmentTreeNode"] = None
    checkpoint: Optional[Checkpoint] = None
    timestamp_range: tuple[int, int] = (0, 0)


class PersistentSegmentTree:
    """Persistent segment tree over nanosecond checkpoint timestamps."""

    def __init__(self, max_timestamp: int = (1 << 63) - 1) -> None:
        self.root: Optional[SegmentTreeNode] = None
        self.max_timestamp = max_timestamp

    def insert(self, checkpoint: Checkpoint) -> None:
        """Insert a checkpoint in O(log U), where U is the timestamp range."""
        if checkpoint.timestamp_ns < 0:
            raise ValueError("checkpoint timestamp_ns must be non-negative")
        self.root = self._insert(self.root, 0, self.max_timestamp, checkpoint)

    def query(self, timestamp_ns: int) -> Optional[Checkpoint]:
        """Return the checkpoint at or immediately before timestamp_ns in O(log U)."""
        if timestamp_ns < 0 or self.root is None:
            return None
        return self._query(self.root, timestamp_ns)

    def get_state_at(
        self, timestamp_ns: int, all_checkpoints: list[Checkpoint | dict[str, Any]]
    ) -> dict[str, Any]:
        """Reconstruct state at the nearest checkpoint at or before timestamp_ns."""
        if self.root is None:
            for checkpoint in self._coerce_checkpoints(all_checkpoints):
                self.insert(checkpoint)

        checkpoint_at_time = self.query(timestamp_ns)
        if checkpoint_at_time is None:
            return {}

        ordered = sorted(
            self._coerce_checkpoints(all_checkpoints), key=lambda cp: cp.timestamp_ns
        )
        checkpoint_dicts = [
            cp.model_dump(mode="json")
            for cp in ordered
            if cp.timestamp_ns <= checkpoint_at_time.timestamp_ns
        ]
        return reconstruct_state(checkpoint_dicts)

    def _insert(
        self,
        node: Optional[SegmentTreeNode],
        left_bound: int,
        right_bound: int,
        checkpoint: Checkpoint,
    ) -> SegmentTreeNode:
        if node is None:
            node = SegmentTreeNode(timestamp_range=(left_bound, right_bound))

        newest = self._newest_checkpoint(node.checkpoint, checkpoint)
        if left_bound == right_bound:
            return SegmentTreeNode(
                checkpoint=newest,
                timestamp_range=(left_bound, right_bound),
            )

        midpoint = (left_bound + right_bound) // 2
        left_child = node.left
        right_child = node.right
        if checkpoint.timestamp_ns <= midpoint:
            left_child = self._insert(left_child, left_bound, midpoint, checkpoint)
        else:
            right_child = self._insert(right_child, midpoint + 1, right_bound, checkpoint)

        return SegmentTreeNode(
            left=left_child,
            right=right_child,
            checkpoint=newest,
            timestamp_range=(left_bound, right_bound),
        )

    def _query(
        self, node: Optional[SegmentTreeNode], timestamp_ns: int
    ) -> Optional[Checkpoint]:
        if node is None:
            return None

        left_bound, right_bound = node.timestamp_range
        if left_bound > timestamp_ns:
            return None
        if right_bound <= timestamp_ns:
            return node.checkpoint

        right_result = self._query(node.right, timestamp_ns)
        if right_result is not None:
            return right_result
        return self._query(node.left, timestamp_ns)

    def _newest_checkpoint(
        self,
        current: Optional[Checkpoint],
        candidate: Checkpoint,
    ) -> Checkpoint:
        if current is None:
            return candidate
        if candidate.timestamp_ns >= current.timestamp_ns:
            return candidate
        return current

    def _coerce_checkpoints(
        self, checkpoints: list[Checkpoint | dict[str, Any]]
    ) -> list[Checkpoint]:
        return [
            cp if isinstance(cp, Checkpoint) else Checkpoint.model_validate(cp)
            for cp in checkpoints
        ]
