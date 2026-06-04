import { getApiBase, getAnomalyPath, getCheckpoints, listRuns, replayAt, startRun } from "./api.js";
import { DiffView } from "./diff_view.js";
import { ReplayController, shouldShowBranchButton } from "./replay_controls.js";
import { buildTimelineState, formatRelativeTime, renderScrubber, TimeWarpTimeline } from "./timeline.js";
import { TimeWarpSocket } from "./websocket.js";

const apiBase = getApiBase();
const runSelector = document.querySelector("#run-selector");
const refreshButton = document.querySelector("#refresh-runs");
const exitFocusButton = document.querySelector("#exit-focus");
const startRunButton = document.querySelector("#start-run");
const injectFailureButton = document.querySelector("#inject-failure");
const connectionStatus = document.querySelector("#connection-status");
const currentNode = document.querySelector("#current-node");
const currentDrift = document.querySelector("#current-drift");
const detailRun = document.querySelector("#detail-run");
const detailNode = document.querySelector("#detail-node");
const detailTime = document.querySelector("#detail-time");
const detailPath = document.querySelector("#detail-path");
const statePreview = document.querySelector("#state-preview");
const openBranchButton = document.querySelector("#open-branch");
const playPauseButton = document.querySelector("#play-pause");
const timeLabel = document.querySelector("#time-label");

let currentRunId = null;
let currentRunState = buildTimelineState([]);
let selectedTimestampNs = 0;
let selectedNodeName = "analyze_results";
let selectedState = {};

const timeline = new TimeWarpTimeline(document.querySelector("#timeline-root"), {
  onSelect: (checkpoint) => selectCheckpoint(checkpoint),
});
globalThis.__timewarpTimeline = timeline;

const replayController = new ReplayController({
  timeline,
  getRunState: () => currentRunState,
  onTick: async (timestampNs) => {
    selectedTimestampNs = timestampNs;
    timeLabel.textContent = formatRelativeTime(timestampNs, currentRunState.minTimestampNs);
    await updateReplayState(timestampNs);
    updateBranchButton();
  },
});

const diffView = new DiffView({
  panel: document.querySelector("#diff-panel"),
  originalInput: document.querySelector("#original-prompt"),
  editedInput: document.querySelector("#edited-prompt"),
  replayButton: document.querySelector("#replay-branch"),
  closeButton: document.querySelector("#close-diff"),
  apiBase,
});

const socket = new TimeWarpSocket({
  apiBase,
  timeline,
  onStatus: (status) => {
    connectionStatus.textContent = status;
  },
});

refreshButton.addEventListener("click", () => loadRuns());
exitFocusButton.addEventListener("click", () => timeline.exitFocus());
runSelector.addEventListener("change", () => loadRun(runSelector.value));
startRunButton.addEventListener("click", async () => {
  const result = await startRun(apiBase);
  currentRunId = result.run_id;
  await loadRuns();
});
injectFailureButton.addEventListener("click", async () => {
  injectFailureButton.disabled = true;
  injectFailureButton.textContent = "Injecting";
  try {
    await fetch(`${apiBase}/runs/start`, { method: "POST" });
    window.alert("Use the CLI for node-specific injection: python agent_demo/inject_failure.py --inject_at_node analyze_results");
  } finally {
    injectFailureButton.disabled = false;
    injectFailureButton.textContent = "Inject Failure";
  }
});
playPauseButton.addEventListener("click", () => replayController.toggle());
openBranchButton.addEventListener("click", () => {
  if (!currentRunId) {
    return;
  }
  diffView.open({
    runId: currentRunId,
    timestampNs: selectedTimestampNs,
    nodeName: selectedNodeName,
    reconstructedState: selectedState,
  });
});

bootstrap().catch((error) => {
  connectionStatus.textContent = "Startup failed";
  statePreview.textContent = JSON.stringify({ error: error.message }, null, 2);
});

async function bootstrap() {
  await timeline.initScene();
  socket.connect();
  await loadRuns();
}

async function loadRuns() {
  const result = await listRuns(apiBase);
  const runs = result.runs || [];
  runSelector.replaceChildren(
    ...runs.map((run) => {
      const option = document.createElement("option");
      option.value = run.run_id;
      option.textContent = `${run.run_id.slice(0, 8)} · ${run.node_count} nodes${run.has_anomaly ? " · anomaly" : ""}`;
      return option;
    }),
  );
  if (runs.length === 0) {
    currentNode.textContent = "No runs";
    return;
  }
  const selectedRun = currentRunId && runs.some((run) => run.run_id === currentRunId) ? currentRunId : runs[0].run_id;
  runSelector.value = selectedRun;
  await loadRun(selectedRun);
}

async function loadRun(runId) {
  currentRunId = runId;
  const result = await getCheckpoints(apiBase, runId);
  const checkpoints = result.checkpoints || [];
  currentRunState = buildTimelineState(checkpoints);
  selectedTimestampNs = currentRunState.maxTimestampNs;
  timeline.setCheckpoints(checkpoints);
  await renderScrubber({
    container: document.querySelector("#scrubber"),
    sparkline: document.querySelector("#drift-sparkline"),
    checkpoints,
    onScrub: (timestampNs) => replayController.scrubTo(timestampNs),
  });
  if (checkpoints.length > 0) {
    const latest = currentRunState.checkpoints.at(-1);
    await selectCheckpoint(latest);
    await updateAnomalyPath(runId);
  }
  updateBranchButton();
}

async function selectCheckpoint(checkpoint) {
  if (!checkpoint) {
    return;
  }
  selectedTimestampNs = checkpoint.timestamp_ns;
  selectedNodeName = checkpoint.node_name || "analyze_results";
  detailRun.textContent = currentRunId ? currentRunId.slice(0, 8) : "-";
  detailNode.textContent = checkpoint.node_name || "-";
  detailTime.textContent = formatRelativeTime(checkpoint.timestamp_ns, currentRunState.minTimestampNs);
  currentNode.textContent = checkpoint.node_name || "checkpoint";
  currentDrift.textContent = Number(checkpoint.drift_score ?? 1).toFixed(2);
  timeLabel.textContent = formatRelativeTime(checkpoint.timestamp_ns, currentRunState.minTimestampNs);
  await updateReplayState(checkpoint.timestamp_ns);
}

async function updateReplayState(timestampNs) {
  if (!currentRunId || timestampNs === 0) {
    return;
  }
  try {
    const snapshot = await replayAt(apiBase, currentRunId, timestampNs);
    selectedState = snapshot.reconstructed_state || {};
    statePreview.textContent = JSON.stringify(selectedState, null, 2);
  } catch (error) {
    statePreview.textContent = JSON.stringify({ error: error.message }, null, 2);
  }
}

async function updateAnomalyPath(runId) {
  const result = await getAnomalyPath(apiBase, runId);
  const path = result.anomaly_path || [];
  const names = result.anomaly_nodes || [];
  detailPath.textContent = names.length ? names.join(" > ") : "-";
  if (path.length) {
    timeline.highlightAnomalyPath(path);
  }
}

function updateBranchButton() {
  openBranchButton.disabled = !shouldShowBranchButton(selectedTimestampNs, currentRunState.maxTimestampNs);
}
