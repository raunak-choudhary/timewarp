import test from "node:test";
import assert from "node:assert/strict";

import {
  clampTimestamp,
  createReplayRequestUrl,
  shouldShowBranchButton,
} from "../src/replay_controls.js";

test("clampTimestamp keeps scrubber values inside the run range", () => {
  assert.equal(clampTimestamp(90, 100, 200), 100);
  assert.equal(clampTimestamp(250, 100, 200), 200);
  assert.equal(clampTimestamp(150, 100, 200), 150);
});

test("createReplayRequestUrl encodes the replay REST contract", () => {
  assert.equal(
    createReplayRequestUrl("http://localhost:8000", "run-1", 123),
    "http://localhost:8000/replay/123?run_id=run-1",
  );
});

test("shouldShowBranchButton appears only after rewinding before the latest checkpoint", () => {
  assert.equal(shouldShowBranchButton(100, 200), true);
  assert.equal(shouldShowBranchButton(200, 200), false);
});
