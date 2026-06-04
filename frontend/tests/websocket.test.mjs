import test from "node:test";
import assert from "node:assert/strict";

import { buildWebSocketUrl, routeCheckpointMessage } from "../src/websocket.js";

test("buildWebSocketUrl converts an http API URL into ws/live", () => {
  assert.equal(
    buildWebSocketUrl("http://localhost:8000"),
    "ws://localhost:8000/ws/live",
  );
});

test("buildWebSocketUrl converts https API URLs into secure websockets", () => {
  assert.equal(
    buildWebSocketUrl("https://timewarp-api.example.com/"),
    "wss://timewarp-api.example.com/ws/live",
  );
});

test("routeCheckpointMessage adds nodes and highlights anomaly paths", () => {
  const calls = [];
  const timeline = {
    addNode: (checkpoint) => calls.push(["addNode", checkpoint.checkpoint_id]),
    highlightAnomalyPath: (path) => calls.push(["highlight", path]),
  };

  routeCheckpointMessage(
    {
      type: "checkpoint",
      checkpoint_id: "cp-1",
      anomaly_path: ["cp-0", "cp-1"],
    },
    timeline,
  );

  assert.deepEqual(calls, [
    ["addNode", "cp-1"],
    ["highlight", ["cp-0", "cp-1"]],
  ]);
});
