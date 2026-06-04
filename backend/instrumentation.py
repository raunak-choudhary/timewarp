"""TimeWarp LangGraph instrumentation middleware.

Wraps every agent node function so that:
  1. State before/after execution is captured as a delta
  2. Delta is persisted to Supabase via snapshot_engine
  3. A WebSocket checkpoint event is broadcast to all connected clients

Usage (in demo_agent.py):
    middleware = TimeWarpMiddleware(run_id, ws_manager)
    builder.add_node("researcher", middleware.wrap_node(researcher_fn, "researcher"))
"""
from __future__ import annotations

import logging
import json
from typing import Any, Callable, Optional
from uuid import UUID

from backend.models import WebSocketMessage
from backend import snapshot_engine, supabase_client
from backend.anomaly_graph import get_behavior_dag
from backend.drift_detector import get_drift_detector
from backend.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)


class TimeWarpMiddleware:
    """Stateful middleware instance for one agent run."""

    def __init__(
        self,
        run_id: UUID,
        ws_manager: WebSocketManager,
        branch_id: Optional[UUID] = None,
    ) -> None:
        self.run_id = run_id
        self.ws_manager = ws_manager
        self.branch_id = branch_id
        self._prev_state: dict[str, Any] = {}
        self._last_checkpoint: Optional[Any] = None  # backend.models.Checkpoint
        self._last_hash: str = ""
        self._drift_detector = get_drift_detector()
        self._anomaly_graph = get_behavior_dag()

    def wrap_node(self, node_fn: Callable, node_name: str) -> Callable:
        """Return an async-wrapped version of node_fn with TimeWarp instrumentation.

        The wrapper:
          - Executes the real node function (sync or async)
          - Snapshots state before and after
          - Broadcasts a WebSocket checkpoint event
          - Returns the original node result unchanged
        """
        middleware = self  # capture for closure

        async def wrapped(state: dict[str, Any]) -> dict[str, Any]:
            prev_state = dict(middleware._prev_state)

            # --- Execute the real node ---
            import asyncio
            if asyncio.iscoroutinefunction(node_fn):
                result = await node_fn(state)
            else:
                result = await asyncio.to_thread(node_fn, state)

            # Build curr_state = full state after this node ran
            curr_state = {**dict(state), **(result or {})}
            middleware._prev_state = curr_state

            # --- Snapshot + broadcast (non-blocking; never crashes the agent) ---
            parent_id = (
                middleware._last_checkpoint.id
                if middleware._last_checkpoint
                else None
            )
            try:
                checkpoint = await snapshot_engine.snapshot_node_execution(
                    run_id=middleware.run_id,
                    node_name=node_name,
                    prev_state=prev_state,
                    curr_state=curr_state,
                    parent_id=parent_id,
                    parent_hash=middleware._last_hash,
                    branch_id=middleware.branch_id,
                )
                middleware._last_checkpoint = checkpoint
                middleware._last_hash = checkpoint.state_hash

                output_text = middleware._extract_output_text(result or curr_state)
                drift_event = await middleware._drift_detector.score(
                    node_name=node_name,
                    output_text=output_text,
                    checkpoint_id=checkpoint.id,
                )
                checkpoint.drift_score = drift_event.drift_score
                checkpoint.is_anomaly = drift_event.is_anomaly

                try:
                    await supabase_client.update_checkpoint_drift(
                        checkpoint.id,
                        drift_event.drift_score,
                        drift_event.is_anomaly,
                    )
                except Exception as e:
                    logger.error(
                        f"[middleware] Drift update failed for checkpoint "
                        f"{checkpoint.id}: {e}"
                    )

                middleware._anomaly_graph.add_node(
                    checkpoint, drift_event.drift_score
                )
                anomaly_path = (
                    middleware._anomaly_graph.get_anomaly_path(middleware.run_id)
                    if drift_event.is_anomaly
                    else None
                )
                status = "anomaly" if drift_event.is_anomaly else "success"

                msg = WebSocketMessage(
                    type="checkpoint",
                    run_id=str(middleware.run_id),
                    checkpoint_id=str(checkpoint.id),
                    node_name=node_name,
                    timestamp_ns=checkpoint.timestamp_ns,
                    status=status,
                    drift_score=checkpoint.drift_score,
                    is_anomaly=checkpoint.is_anomaly,
                    anomaly_path=anomaly_path,
                )
                await middleware.ws_manager.broadcast(msg.model_dump())

            except Exception as e:
                logger.error(
                    f"[middleware] Snapshot failed for node {node_name!r}: {e}"
                )
                # Do NOT re-raise - snapshot failure must never crash the agent

            return result or {}

        wrapped.__name__ = getattr(node_fn, "__name__", node_name)
        return wrapped

    def _extract_output_text(self, result: dict[str, Any]) -> str:
        """Convert node output into stable text for embedding."""
        if not result:
            return ""

        values: list[str] = []
        for value in result.values():
            if isinstance(value, str):
                values.append(value)
            else:
                values.append(json.dumps(value, sort_keys=True, default=str))
        return "\n".join(values)
