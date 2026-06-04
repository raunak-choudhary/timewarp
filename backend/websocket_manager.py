"""WebSocket connection manager — broadcasts checkpoint events to all connected clients."""
from __future__ import annotations

import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Thread-safe (within asyncio) manager for active WebSocket connections."""

    def __init__(self) -> None:
        self._connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        """Accept and register a new WebSocket connection."""
        await websocket.accept()
        self._connections.append(websocket)
        logger.info(
            f"WebSocket connected — total active: {len(self._connections)}"
        )

    async def disconnect(self, websocket: WebSocket) -> None:
        """Remove a disconnected WebSocket."""
        if websocket in self._connections:
            self._connections.remove(websocket)
        logger.info(
            f"WebSocket disconnected — total active: {len(self._connections)}"
        )

    async def broadcast(self, message: dict[str, Any]) -> None:
        """Send a JSON message to all connected clients.

        Silently removes dead connections — a failed send means the client disconnected.
        """
        dead: list[WebSocket] = []
        for ws in self._connections:
            try:
                await ws.send_json(message)
            except Exception as e:
                logger.warning(f"WebSocket send failed, marking dead: {e}")
                dead.append(ws)
        for ws in dead:
            await self.disconnect(ws)

    @property
    def connection_count(self) -> int:
        """Number of currently active WebSocket connections."""
        return len(self._connections)
