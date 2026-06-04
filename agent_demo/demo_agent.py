"""TimeWarp demo agent — a 5-node LangGraph research pipeline.

Each node is wrapped with TimeWarpMiddleware so every execution is:
  1. Delta-compressed and stored to Supabase as a Checkpoint
  2. Broadcast to the frontend via WebSocket

Node pipeline:
  plan_task → search_web → analyze_results → synthesize → format_output

Entry points:
  - run_demo_agent(run_id, ws_manager)  ← called by main.py POST /runs/start
  - python -m agent_demo.demo_agent     ← standalone local test
"""
from __future__ import annotations

import asyncio
import logging
import os
import sys
from typing import Optional, TypedDict
from uuid import UUID

# Allow running as a standalone script from project root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(override=True)

import anthropic
from langgraph.graph import StateGraph, END

from backend.instrumentation import TimeWarpMiddleware
from backend.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)


# ─── Agent State ──────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    """Full state carried through every node of the research pipeline."""
    task: str
    plan: str
    search_results: list[str]
    analysis: str
    synthesis: str
    final_output: str
    injected_prompt: Optional[str]   # Set by inject_failure.py to cause a drift event


# ─── LLM helper ───────────────────────────────────────────────────────────────

def _call_claude(prompt: str, system: str = "") -> str:
    """Synchronous Claude Haiku call — kept sync so we can asyncio.to_thread it."""
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=300,
        system=system or "You are a concise research assistant. Keep replies under 150 words.",
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text.strip()


# ─── Node functions (all async — wrap sync Claude calls in asyncio.to_thread) ─

async def plan_task(state: AgentState) -> dict:
    """Node 1 — Create a 3-step research plan for the task."""
    task = state.get("task", "How do AI agents fail silently in production?")
    prompt = (
        state.get("injected_prompt")
        or f"Create a numbered 3-step research plan for this topic: {task}"
    )
    plan = await asyncio.to_thread(_call_claude, prompt)
    logger.info(f"[plan_task] plan={plan[:60]}...")
    return {"plan": plan}


async def search_web(state: AgentState) -> dict:
    """Node 2 — Simulated web search (hardcoded results to avoid external deps)."""
    # Deterministic — no LLM call needed. Good for demo reproducibility.
    search_results = [
        "[Result 1] 76% of production AI agents fail silently — analysis of 847 deployments (2026)",
        "[Result 2] LangSmith and Langfuse offer forward-only logging — zero reversibility",
        "[Result 3] EU AI Act Article 12 mandates audit logs for AI systems by August 2026",
        "[Result 4] Top failure modes: infinite retry loops, prompt drift, hallucination cascades",
        "[Result 5] Mozilla rr + WinDbg TTD prove reversible debugging works for classical software",
    ]
    logger.info(f"[search_web] returned {len(search_results)} results")
    return {"search_results": search_results}


async def analyze_results(state: AgentState) -> dict:
    """Node 3 — Analyze the search results and identify patterns."""
    results_text = "\n".join(state.get("search_results", []))
    prompt = (
        state.get("injected_prompt")
        or f"Analyze these research findings and identify the 2 most critical patterns:\n\n{results_text}"
    )
    analysis = await asyncio.to_thread(_call_claude, prompt)
    logger.info(f"[analyze_results] analysis={analysis[:60]}...")
    return {"analysis": analysis}


async def synthesize(state: AgentState) -> dict:
    """Node 4 — Synthesize analysis into actionable insights."""
    analysis = state.get("analysis", "")
    prompt = (
        state.get("injected_prompt")
        or f"Based on this analysis, state the single most important insight "
           f"and why it matters:\n\n{analysis}"
    )
    synthesis = await asyncio.to_thread(_call_claude, prompt)
    logger.info(f"[synthesize] synthesis={synthesis[:60]}...")
    return {"synthesis": synthesis}


async def format_output(state: AgentState) -> dict:
    """Node 5 — Format the final output as a polished summary."""
    plan = state.get("plan", "")
    synthesis = state.get("synthesis", "")
    prompt = (
        state.get("injected_prompt")
        or f"Write a 2-sentence executive summary combining this plan and insight:\n"
           f"Plan: {plan}\nInsight: {synthesis}"
    )
    final_output = await asyncio.to_thread(_call_claude, prompt)
    logger.info(f"[format_output] output={final_output[:60]}...")
    return {"final_output": final_output}


# ─── Graph builder ────────────────────────────────────────────────────────────

def build_demo_graph(middleware: TimeWarpMiddleware):
    """Assemble the LangGraph with all nodes wrapped by TimeWarp middleware."""
    builder: StateGraph = StateGraph(AgentState)

    builder.add_node("plan_task",       middleware.wrap_node(plan_task,       "plan_task"))
    builder.add_node("search_web",      middleware.wrap_node(search_web,      "search_web"))
    builder.add_node("analyze_results", middleware.wrap_node(analyze_results, "analyze_results"))
    builder.add_node("synthesize",      middleware.wrap_node(synthesize,      "synthesize"))
    builder.add_node("format_output",   middleware.wrap_node(format_output,   "format_output"))

    builder.set_entry_point("plan_task")
    builder.add_edge("plan_task",       "search_web")
    builder.add_edge("search_web",      "analyze_results")
    builder.add_edge("analyze_results", "synthesize")
    builder.add_edge("synthesize",      "format_output")
    builder.add_edge("format_output",   END)

    return builder.compile()


# ─── Main entry point ─────────────────────────────────────────────────────────

async def run_demo_agent(
    run_id: UUID,
    ws_manager: WebSocketManager,
    injected_prompt: Optional[str] = None,
    branch_id: Optional[UUID] = None,
) -> dict:
    """Run the demo agent. Called by FastAPI background tasks or directly.

    Args:
        run_id: Unique ID for this execution run.
        ws_manager: Shared WebSocket manager for broadcasting checkpoint events.
        injected_prompt: If set, overrides LLM prompts at every node (failure injection).
        branch_id: If set, tags all checkpoints with the parent run_id (for branch display).
    """
    logger.info(f"[demo_agent] Starting run {run_id} (branch_from={branch_id})")

    middleware = TimeWarpMiddleware(run_id, ws_manager)

    # If branch, patch the middleware to tag checkpoints with branch_id
    if branch_id:
        _orig_snapshot = middleware._last_hash  # noqa: F841

    graph = build_demo_graph(middleware)

    initial_state: AgentState = {
        "task": "How do AI agents fail silently in production and what can be done about it?",
        "plan": "",
        "search_results": [],
        "analysis": "",
        "synthesis": "",
        "final_output": "",
        "injected_prompt": injected_prompt,
    }

    try:
        result = await graph.ainvoke(initial_state)
        logger.info(f"[demo_agent] Run {run_id} completed ✅")
        return result
    except Exception as e:
        logger.error(f"[demo_agent] Run {run_id} failed: {e}")
        raise


# ─── Standalone entry point ───────────────────────────────────────────────────

if __name__ == "__main__":
    import uuid
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(name)-30s  %(levelname)s  %(message)s",
    )

    dummy_ws = WebSocketManager()
    run_id = uuid.uuid4()

    print(f"\n🕰  TimeWarp Demo Agent")
    print(f"   Run ID: {run_id}\n")

    result = asyncio.run(run_demo_agent(run_id, dummy_ws))

    print("\n─── Final Output ───────────────────────────────")
    print(result.get("final_output", "No output produced"))
    print("────────────────────────────────────────────────\n")
    print("✅ Check Supabase dashboard — checkpoints should appear in the 'checkpoints' table.")
