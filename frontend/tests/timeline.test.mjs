import test from "node:test";
import assert from "node:assert/strict";

import {
  STATUS_COLORS,
  buildTimelineState,
  calculateBoundedNodeLayout,
  getFocusCameraPose,
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

test("calculateBoundedNodeLayout keeps long runs inside a fixed visual rail", () => {
  const manyCheckpoints = Array.from({ length: 24 }, (_, index) => ({
    checkpoint_id: `cp-${index}`,
    id: `cp-${index}`,
    timestamp_ns: 1_000 + index,
    status: index === 12 ? "anomaly" : "success",
  }));

  const positions = calculateBoundedNodeLayout(manyCheckpoints);

  assert.equal(positions.size, 24);
  for (const position of positions.values()) {
    assert.ok(Math.abs(position.x) <= 10);
    assert.ok(Math.abs(position.y) <= 4);
    assert.ok(Math.abs(position.z) <= 4);
  }
});

test("getFocusCameraPose moves camera close to the selected node", () => {
  const pose = getFocusCameraPose({ x: 2, y: 1, z: -1 });

  assert.deepEqual(pose.target, { x: 2, y: 1, z: -1 });
  assert.ok(pose.position.z > 6);
  assert.ok(pose.position.y > 2);
});
