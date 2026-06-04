"""Tests for backend/snapshot_engine.py — Phase 1 milestone gate.

Key guarantee: checkpoint delta compression is lossless.
reconstruct_state(checkpoints) must equal the original state at every step.
"""
from __future__ import annotations

import pytest
from backend.snapshot_engine import (
    compute_delta,
    compute_hash,
    reconstruct_state,
)


# ─── compute_delta ────────────────────────────────────────────────────────────

class TestComputeDelta:
    def test_first_checkpoint_stores_full_state(self):
        """When prev_state is empty, delta stores the full initial state."""
        curr = {"task": "research", "plan": "", "results": []}
        delta = compute_delta({}, curr)
        assert "__initial__" in delta
        assert delta["__initial__"] == curr

    def test_unchanged_state_produces_empty_delta(self):
        state = {"task": "research", "plan": "done"}
        delta = compute_delta(state, state)
        assert delta == {}

    def test_changed_value_captured(self):
        prev = {"plan": "old plan", "task": "t"}
        curr = {"plan": "new plan", "task": "t"}
        delta = compute_delta(prev, curr)
        assert "plan" in delta
        assert delta["plan"]["old"] == "old plan"
        assert delta["plan"]["new"] == "new plan"

    def test_new_key_captured(self):
        prev = {"task": "t"}
        curr = {"task": "t", "analysis": "found something"}
        delta = compute_delta(prev, curr)
        assert "analysis" in delta
        assert delta["analysis"]["new"] == "found something"

    def test_removed_key_captured(self):
        prev = {"task": "t", "temp": "scratch"}
        curr = {"task": "t"}
        delta = compute_delta(prev, curr)
        assert "temp" in delta
        assert delta["temp"]["new"] is None


# ─── compute_hash ─────────────────────────────────────────────────────────────

class TestComputeHash:
    def test_deterministic(self):
        delta = {"plan": {"old": "", "new": "step 1"}}
        h1 = compute_hash(delta, "")
        h2 = compute_hash(delta, "")
        assert h1 == h2

    def test_different_parent_produces_different_hash(self):
        delta = {"plan": {"old": "", "new": "step 1"}}
        h1 = compute_hash(delta, "parent_hash_A")
        h2 = compute_hash(delta, "parent_hash_B")
        assert h1 != h2

    def test_hash_is_64_char_hex(self):
        h = compute_hash({"k": "v"}, "")
        assert len(h) == 64
        assert all(c in "0123456789abcdef" for c in h)


# ─── reconstruct_state ────────────────────────────────────────────────────────

class TestReconstructState:
    def test_empty_checkpoints_returns_empty_state(self):
        assert reconstruct_state([]) == {}

    def test_single_initial_checkpoint(self):
        initial = {"task": "research", "plan": ""}
        checkpoints = [{"state_delta": {"__initial__": initial}}]
        assert reconstruct_state(checkpoints) == initial

    def test_lossless_roundtrip_two_checkpoints(
        self, sample_state_v1, sample_state_v2
    ):
        """Core guarantee: reconstruct(checkpoints) == original state at each step."""
        delta1 = compute_delta({}, sample_state_v1)
        delta2 = compute_delta(sample_state_v1, sample_state_v2)

        checkpoints = [
            {"state_delta": delta1},
            {"state_delta": delta2},
        ]
        reconstructed = reconstruct_state(checkpoints)
        assert reconstructed == sample_state_v2

    def test_lossless_roundtrip_five_steps(self):
        """Simulate 5 sequential state transitions and verify full reconstruction."""
        states = [
            {"task": "t", "step": 0, "output": ""},
            {"task": "t", "step": 1, "output": "", "plan": "p1"},
            {"task": "t", "step": 2, "output": "", "plan": "p1", "results": ["r"]},
            {"task": "t", "step": 3, "output": "", "plan": "p1", "results": ["r"], "analysis": "a"},
            {"task": "t", "step": 4, "output": "done", "plan": "p1", "results": ["r"], "analysis": "a"},
        ]

        checkpoints = []
        prev = {}
        for state in states:
            delta = compute_delta(prev, state)
            checkpoints.append({"state_delta": delta})
            prev = state

        reconstructed = reconstruct_state(checkpoints)
        assert reconstructed == states[-1]

    def test_full_state_fallback_roundtrip(self):
        """__full_state__ fallback also reconstructs correctly."""
        state = {"task": "t", "plan": "p"}
        checkpoints = [{"state_delta": {"__full_state__": state}}]
        assert reconstruct_state(checkpoints) == state
