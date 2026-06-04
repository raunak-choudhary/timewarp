"""CLI entry point for running a poisoned TimeWarp demo agent execution."""
from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
from uuid import UUID, uuid4

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv(override=True)

from agent_demo.demo_agent import POISON_PROMPT, run_demo_agent
from backend.websocket_manager import WebSocketManager

logger = logging.getLogger(__name__)


def parse_args() -> argparse.Namespace:
    """Parse failure injection CLI arguments."""
    parser = argparse.ArgumentParser(
        description="Run the demo agent with a poison prompt at a selected node."
    )
    parser.add_argument(
        "--inject_at_node",
        required=True,
        help="Node name to poison, for example analyze_results.",
    )
    parser.add_argument(
        "--run_id",
        default=None,
        help="Optional run UUID. A new UUID is generated when omitted.",
    )
    return parser.parse_args()


async def main() -> None:
    """Run a poisoned demo agent execution and persist checkpoints."""
    args = parse_args()
    run_id = UUID(args.run_id) if args.run_id else uuid4()
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s  %(name)-30s  %(levelname)s  %(message)s",
    )

    logger.info(
        "Starting poisoned TimeWarp run %s at node %s",
        run_id,
        args.inject_at_node,
    )
    await run_demo_agent(
        run_id=run_id,
        ws_manager=WebSocketManager(),
        injected_prompt=POISON_PROMPT,
        inject_at_node=args.inject_at_node,
    )
    logger.info("Poisoned run complete: %s", run_id)


if __name__ == "__main__":
    asyncio.run(main())
