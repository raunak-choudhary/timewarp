"""TimeWarp Pydantic data models — shared across backend, instrumentation, and tests."""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class Checkpoint(BaseModel):
    """A single snapshot of agent state at one node execution."""

    id: UUID = Field(default_factory=uuid4)
    run_id: UUID
    parent_id: Optional[UUID] = None
    node_name: str
    timestamp_ns: int
    state_delta: dict[str, Any]
    state_hash: str
    drift_score: Optional[float] = None
    is_anomaly: bool = False
    branch_id: Optional[UUID] = None
    created_at: Optional[datetime] = None


class StateSnapshot(BaseModel):
    """Reconstructed agent state at a specific timestamp (returned by /replay/{ts})."""

    run_id: UUID
    timestamp_ns: int
    reconstructed_state: dict[str, Any]
    checkpoints_applied: int


class DriftEvent(BaseModel):
    """Result of comparing an LLM output against its baseline embedding."""

    checkpoint_id: UUID
    node_name: str
    drift_score: float
    baseline_score: float
    is_anomaly: bool


class BranchRequest(BaseModel):
    """Request body for POST /branch — create an alternate timeline."""

    run_id: UUID
    from_timestamp_ns: int
    new_prompt: str
    node_name: str


class WebSocketMessage(BaseModel):
    """Frozen WebSocket message schema — do not change (AGENTS.md)."""

    type: str = "checkpoint"
    run_id: str
    checkpoint_id: str
    node_name: str
    timestamp_ns: int
    status: str  # success | drift | anomaly | branch
    drift_score: Optional[float] = None
    is_anomaly: bool = False
    anomaly_path: Optional[list[str]] = None
