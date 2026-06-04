"""Shared pytest fixtures for TimeWarp tests."""
from __future__ import annotations

import pytest
from uuid import uuid4


@pytest.fixture
def run_id():
    """A fresh UUID for each test."""
    return uuid4()


@pytest.fixture
def sample_state_v1():
    return {
        "task": "research AI agent failures",
        "plan": "",
        "search_results": [],
        "analysis": "",
        "synthesis": "",
        "final_output": "",
    }


@pytest.fixture
def sample_state_v2(sample_state_v1):
    updated = dict(sample_state_v1)
    updated["plan"] = "Step 1: search. Step 2: analyze. Step 3: summarize."
    updated["search_results"] = ["result A", "result B"]
    return updated
