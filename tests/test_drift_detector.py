"""Tests for backend/drift_detector.py - Phase 2 semantic drift scoring."""
from __future__ import annotations

from backend.drift_detector import DriftDetector


def test_cosine_similarity_detects_opposite_vectors() -> None:
    """Manual cosine similarity returns a low score for divergent vectors."""
    detector = DriftDetector(load_model=False)

    assert detector.cosine_similarity([1.0, 0.0], [0.0, 1.0]) == 0.0


def test_semantically_divergent_strings_score_below_threshold() -> None:
    """Sentence embeddings put unrelated strings below the anomaly threshold."""
    detector = DriftDetector(threshold=0.72)

    baseline = detector.embed(
        "AI agent audit logs detect silent production failures and prompt drift."
    )
    divergent = detector.embed(
        "A banana smoothie recipe uses ripe fruit, yogurt, honey, and ice."
    )

    assert detector.cosine_similarity(baseline, divergent) < detector.threshold
