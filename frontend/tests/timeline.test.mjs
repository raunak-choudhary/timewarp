import test from "node:test";
import assert from "node:assert/strict";

import {
  STATUS_COLORS,
  buildTimelineState,
  formatRelativeTime,
  visibleCheckpointIdsAt,
} from "../src/timeline.js";

const checkpoints = [
  { checkpoint_id: "a", id: "a", timestamp_ns: 1_000_000_000, status: "success" },
  { checkpoint_id: "b", id: "b", timestamp_ns: 1_250_000_000, status: "drift" },
  { checkpoint_id: "c", id: "c", timestamp_ns: 1_500_000_000, status: "anomaly" },
];

test("timeline exposes the frozen status color mapping", () => {
  assert.equal(STATUS_COLORS.success, 0x1d9e75);
  assert.equal(STATUS_COLORS.drift, 0xef9f27);
  assert.equal(STATUS_COLORS.anomaly, 0xe24b4a);
  assert.equal(STATUS_COLORS.branch, 0x378add);
});

test("visibleCheckpointIdsAt rewinds to checkpoints at or before time T", () => {
  assert.deepEqual(visibleCheckpointIdsAt(checkpoints, 1_300_000_000), ["a", "b"]);
});

test("buildTimelineState sorts checkpoints and computes range", () => {
  const state = buildTimelineState([checkpoints[2], checkpoints[0], checkpoints[1]]);

  assert.equal(state.minTimestampNs, 1_000_000_000);
  assert.equal(state.maxTimestampNs, 1_500_000_000);
  assert.deepEqual(
    state.checkpoints.map((checkpoint) => checkpoint.checkpoint_id),
    ["a", "b", "c"],
  );
});

test("formatRelativeTime renders milliseconds since run start", () => {
  assert.equal(formatRelativeTime(1_250_000_000, 1_000_000_000), "T+00:00.250");
});
