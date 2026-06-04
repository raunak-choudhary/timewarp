"""Transformer embedding drift detector for TimeWarp checkpoints."""
from __future__ import annotations

import ast
import logging
import math
import os
from typing import Optional
from uuid import UUID, uuid4

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

from backend import supabase_client
from backend.models import DriftEvent

load_dotenv(override=True)
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
logger = logging.getLogger(__name__)


class DriftDetector:
    """Scores node output against baseline semantic embeddings."""

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        threshold: Optional[float] = None,
        load_model: bool = True,
    ) -> None:
        self.model_name = model_name
        self.threshold = (
            threshold
            if threshold is not None
            else float(os.getenv("DRIFT_THRESHOLD", "0.72"))
        )
        self.model: Optional[SentenceTransformer] = (
            SentenceTransformer(model_name) if load_model else None
        )

    def embed(self, text: str) -> list[float]:
        """Embed text into a 384-dimensional vector."""
        if self.model is None:
            raise RuntimeError("SentenceTransformer model is not loaded")
        vector = self.model.encode(text or "", normalize_embeddings=False)
        return [float(value) for value in vector.tolist()]

    def cosine_similarity(self, a: list[float], b: list[float]) -> float:
        """Return cosine similarity in [0, 1] for two embedding vectors."""
        if not a or not b or len(a) != len(b):
            return 0.0

        dot_product = sum(left * right for left, right in zip(a, b))
        norm_a = math.sqrt(sum(value * value for value in a))
        norm_b = math.sqrt(sum(value * value for value in b))
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
        return max(0.0, min(1.0, dot_product / (norm_a * norm_b)))

    async def score(
        self,
        node_name: str,
        output_text: str,
        checkpoint_id: Optional[UUID] = None,
    ) -> DriftEvent:
        """Compare output_text to the baseline embedding for node_name."""
        event_checkpoint_id = checkpoint_id or uuid4()
        embedding = self.embed(output_text)

        if checkpoint_id is not None:
            try:
                await supabase_client.insert_embedding(checkpoint_id, embedding)
            except Exception as exc:
                logger.error(
                    "Drift embedding insert failed for checkpoint %s: %s",
                    checkpoint_id,
                    exc,
                )

        baseline = await supabase_client.get_baseline_embedding(node_name)
        if baseline is None:
            await self.update_baseline(node_name, output_text, embedding=embedding)
            return DriftEvent(
                checkpoint_id=event_checkpoint_id,
                node_name=node_name,
                drift_score=1.0,
                baseline_score=1.0,
                is_anomaly=False,
            )

        baseline_embedding = self._coerce_embedding(baseline)
        similarity = self.cosine_similarity(embedding, baseline_embedding)
        is_anomaly = similarity < self.threshold

        if not is_anomaly:
            await self.update_baseline(node_name, output_text, embedding=embedding)

        return DriftEvent(
            checkpoint_id=event_checkpoint_id,
            node_name=node_name,
            drift_score=similarity,
            baseline_score=similarity,
            is_anomaly=is_anomaly,
        )

    async def update_baseline(
        self,
        node_name: str,
        output_text: str,
        embedding: Optional[list[float]] = None,
    ) -> None:
        """Store output_text embedding as a new baseline sample for node_name."""
        baseline_embedding = embedding or self.embed(output_text)
        await supabase_client.insert_baseline_embedding(node_name, baseline_embedding)

    def _coerce_embedding(self, value: object) -> list[float]:
        if isinstance(value, list):
            return [float(item) for item in value]
        if isinstance(value, str):
            parsed = ast.literal_eval(value)
            if isinstance(parsed, list):
                return [float(item) for item in parsed]
        raise ValueError("baseline embedding must be a list or vector string")


_drift_detector: Optional[DriftDetector] = None


def get_drift_detector() -> DriftDetector:
    """Return process-wide drift detector with model loaded once."""
    global _drift_detector
    if _drift_detector is None:
        _drift_detector = DriftDetector()
    return _drift_detector
