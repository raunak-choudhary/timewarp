import test from "node:test";
import assert from "node:assert/strict";

import { buildBranchPayload, extractPromptFromState } from "../src/diff_view.js";

test("extractPromptFromState prefers the task prompt for branch editing", () => {
  assert.equal(
    extractPromptFromState({
      task: "Research agent failures",
      plan: "Plan text",
    }),
    "Research agent failures",
  );
});

test("buildBranchPayload matches the frozen POST /branch contract", () => {
  assert.deepEqual(
    buildBranchPayload({
      runId: "run-1",
      timestampNs: 456,
      newPrompt: "Corrected prompt",
      nodeName: "analyze_results",
    }),
    {
      run_id: "run-1",
      from_timestamp_ns: 456,
      new_prompt: "Corrected prompt",
      node_name: "analyze_results",
    },
  );
});
