export const CAMERA_POSITION = { x: 0, y: 15, z: 40 };
export const CAMERA_TARGET = { x: 0, y: 0, z: 0 };
export const NODE_RADIUS = 0.8;
export const NODE_SPACING_Y = 3;
export const NODE_JITTER_XZ = 2;

export const STATUS_COLORS = {
  success: 0x1d9e75,
  drift: 0xef9f27,
  anomaly: 0xe24b4a,
  branch: 0x378add,
  pending: 0x888780,
};

export function normalizeCheckpoint(checkpoint) {
  const checkpointId = checkpoint.checkpoint_id || checkpoint.id;
  return {
    ...checkpoint,
    checkpoint_id: checkpointId,
    id: checkpoint.id || checkpointId,
    status: checkpoint.status || statusFromCheckpoint(checkpoint),
    drift_score: checkpoint.drift_score ?? 1,
    timestamp_ns: Number(checkpoint.timestamp_ns),
  };
}

export function statusFromCheckpoint(checkpoint) {
  if (checkpoint.status) {
    return checkpoint.status;
  }
  if (checkpoint.is_anomaly) {
    return "anomaly";
  }
  if ((checkpoint.drift_score ?? 1) < 0.72) {
    return "drift";
  }
  if (checkpoint.branch_id) {
    return "branch";
  }
  return "success";
}

export function buildTimelineState(checkpoints) {
  const sorted = checkpoints.map(normalizeCheckpoint).sort((a, b) => a.timestamp_ns - b.timestamp_ns);
  return {
    checkpoints: sorted,
    minTimestampNs: sorted[0]?.timestamp_ns ?? 0,
    maxTimestampNs: sorted.at(-1)?.timestamp_ns ?? 0,
  };
}

export function visibleCheckpointIdsAt(checkpoints, timestampNs) {
  return checkpoints
    .map(normalizeCheckpoint)
    .filter((checkpoint) => checkpoint.timestamp_ns <= timestampNs)
    .sort((a, b) => a.timestamp_ns - b.timestamp_ns)
    .map((checkpoint) => checkpoint.checkpoint_id);
}

export function formatRelativeTime(timestampNs, startNs) {
  const elapsedMs = Math.max(0, Math.round((timestampNs - startNs) / 1_000_000));
  const minutes = Math.floor(elapsedMs / 60_000);
  const seconds = Math.floor((elapsedMs % 60_000) / 1_000);
  const millis = elapsedMs % 1_000;
  return `T+${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

export class TimeWarpTimeline {
  constructor(root, options = {}) {
    this.root = root;
    this.onSelect = options.onSelect || (() => {});
    this.nodes = new Map();
    this.edges = new Map();
    this.checkpoints = [];
    this.anomalyPath = [];
    this.sceneReady = false;
  }

  async initScene() {
    const THREE = await import("three");
    this.THREE = THREE;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x08110f);

    this.camera = new THREE.PerspectiveCamera(52, this.root.clientWidth / this.root.clientHeight, 0.1, 1000);
    this.camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
    this.camera.lookAt(CAMERA_TARGET.x, CAMERA_TARGET.y, CAMERA_TARGET.z);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.root.clientWidth, this.root.clientHeight);
    this.root.replaceChildren(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xcfece4, 1.4);
    const key = new THREE.DirectionalLight(0xffffff, 2.2);
    key.position.set(8, 18, 12);
    this.scene.add(ambient, key);

    const grid = new THREE.GridHelper(24, 12, 0x25534a, 0x14352f);
    grid.rotation.x = Math.PI / 2;
    this.scene.add(grid);

    globalThis.addEventListener("resize", () => this.resize());
    this.sceneReady = true;
    this.animate();
  }

  setCheckpoints(checkpoints) {
    this.clear();
    const state = buildTimelineState(checkpoints);
    this.checkpoints = state.checkpoints;
    this.checkpoints.forEach((checkpoint) => this.addNode(checkpoint));
    this.rebuildEdges();
    if (this.checkpoints.length > 0) {
      this.onSelect(this.checkpoints.at(-1));
    }
  }

  addNode(checkpoint) {
    const normalized = normalizeCheckpoint(checkpoint);
    const index = this.checkpoints.findIndex((item) => item.checkpoint_id === normalized.checkpoint_id);
    if (index === -1) {
      this.checkpoints.push(normalized);
      this.checkpoints.sort((a, b) => a.timestamp_ns - b.timestamp_ns);
    }
    if (!this.sceneReady || this.nodes.has(normalized.checkpoint_id)) {
      this.updateNodeColor(normalized.checkpoint_id, normalized.status);
      return normalized;
    }

    const sortedIndex = this.checkpoints.findIndex((item) => item.checkpoint_id === normalized.checkpoint_id);
    const x = this.stableJitter(normalized.checkpoint_id, 0) * NODE_JITTER_XZ;
    const y = sortedIndex * NODE_SPACING_Y - (this.checkpoints.length * NODE_SPACING_Y) / 2;
    const z = this.stableJitter(normalized.checkpoint_id, 1) * NODE_JITTER_XZ;
    const geometry = new this.THREE.SphereGeometry(NODE_RADIUS, 32, 20);
    const material = new this.THREE.MeshStandardMaterial({
      color: STATUS_COLORS[normalized.status] ?? STATUS_COLORS.pending,
      emissive: STATUS_COLORS[normalized.status] ?? STATUS_COLORS.pending,
      emissiveIntensity: normalized.status === "anomaly" ? 0.55 : 0.18,
      roughness: 0.35,
      metalness: 0.2,
    });
    const mesh = new this.THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.userData.checkpoint = normalized;
    mesh.visible = true;
    this.scene.add(mesh);
    this.nodes.set(normalized.checkpoint_id, mesh);
    this.rebuildEdges();
    this.onSelect(normalized);
    return normalized;
  }

  addEdge(fromId, toId) {
    if (!this.sceneReady || this.edges.has(`${fromId}:${toId}`)) {
      return;
    }
    const from = this.nodes.get(fromId);
    const to = this.nodes.get(toId);
    if (!from || !to) {
      return;
    }
    const curve = new this.THREE.CatmullRomCurve3([from.position, to.position]);
    const geometry = new this.THREE.TubeGeometry(curve, 24, 0.045, 8, false);
    const material = new this.THREE.MeshBasicMaterial({ color: 0x9cd8ca, transparent: true, opacity: 0.62 });
    const mesh = new this.THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    this.edges.set(`${fromId}:${toId}`, mesh);
  }

  updateNodeColor(checkpointId, status) {
    const mesh = this.nodes.get(checkpointId);
    if (!mesh) {
      return;
    }
    const color = STATUS_COLORS[status] ?? STATUS_COLORS.pending;
    mesh.material.color.setHex(color);
    mesh.material.emissive.setHex(color);
    mesh.material.emissiveIntensity = status === "anomaly" ? 0.75 : 0.18;
    mesh.userData.checkpoint.status = status;
  }

  rewindToTime(timestampNs) {
    const visible = new Set(visibleCheckpointIdsAt(this.checkpoints, timestampNs));
    for (const [checkpointId, mesh] of this.nodes.entries()) {
      mesh.visible = visible.has(checkpointId);
    }
    for (const [edgeKey, mesh] of this.edges.entries()) {
      const [fromId, toId] = edgeKey.split(":");
      mesh.visible = visible.has(fromId) && visible.has(toId);
    }
    const active = this.checkpoints.filter((checkpoint) => checkpoint.timestamp_ns <= timestampNs).at(-1);
    if (active) {
      this.onSelect(active);
    }
  }

  highlightAnomalyPath(nodeIds) {
    this.anomalyPath = nodeIds || [];
    const highlighted = new Set(this.anomalyPath);
    for (const [checkpointId, mesh] of this.nodes.entries()) {
      if (highlighted.has(checkpointId)) {
        mesh.scale.setScalar(1.28);
        mesh.material.emissiveIntensity = 0.95;
      }
    }
    for (const [edgeKey, mesh] of this.edges.entries()) {
      const [fromId, toId] = edgeKey.split(":");
      if (highlighted.has(fromId) && highlighted.has(toId)) {
        mesh.material.color.setHex(STATUS_COLORS.anomaly);
        mesh.material.opacity = 0.95;
      }
    }
  }

  clear() {
    if (!this.sceneReady) {
      this.checkpoints = [];
      return;
    }
    for (const mesh of [...this.nodes.values(), ...this.edges.values()]) {
      this.scene.remove(mesh);
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    }
    this.nodes.clear();
    this.edges.clear();
    this.checkpoints = [];
  }

  rebuildEdges() {
    if (!this.sceneReady) {
      return;
    }
    const ordered = [...this.checkpoints].sort((a, b) => a.timestamp_ns - b.timestamp_ns);
    for (let index = 1; index < ordered.length; index += 1) {
      this.addEdge(ordered[index - 1].checkpoint_id, ordered[index].checkpoint_id);
    }
  }

  stableJitter(value, salt) {
    let hash = salt + 17;
    for (const char of String(value)) {
      hash = (hash * 31 + char.charCodeAt(0)) % 997;
    }
    return hash / 498.5 - 1;
  }

  resize() {
    if (!this.sceneReady) {
      return;
    }
    const width = this.root.clientWidth;
    const height = this.root.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    if (!this.sceneReady) {
      return;
    }
    requestAnimationFrame(() => this.animate());
    const time = performance.now() * 0.001;
    for (const mesh of this.nodes.values()) {
      mesh.rotation.y = time * 0.4;
      if (mesh.userData.checkpoint.status === "anomaly") {
        mesh.scale.setScalar(1.1 + Math.sin(time * 5) * 0.12);
      }
    }
    this.renderer.render(this.scene, this.camera);
  }
}

export async function renderScrubber({ container, sparkline, checkpoints, onScrub }) {
  const d3 = await import("d3");
  const state = buildTimelineState(checkpoints);
  container.replaceChildren();
  sparkline.replaceChildren();
  if (state.checkpoints.length === 0) {
    return;
  }

  const width = Math.max(360, container.clientWidth || 600);
  const height = 44;
  const svg = d3.select(container).append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("class", "scrubber-svg");
  const x = d3.scaleLinear().domain([state.minTimestampNs, state.maxTimestampNs]).range([24, width - 24]);
  svg.append("line").attr("x1", 24).attr("x2", width - 24).attr("y1", 22).attr("y2", 22).attr("class", "scrubber-track");
  svg
    .selectAll("circle.checkpoint-tick")
    .data(state.checkpoints)
    .enter()
    .append("circle")
    .attr("class", "checkpoint-tick")
    .attr("cx", (checkpoint) => x(checkpoint.timestamp_ns))
    .attr("cy", 22)
    .attr("r", 4);
  const handle = svg.append("circle").attr("class", "scrubber-handle").attr("cx", x(state.maxTimestampNs)).attr("cy", 22).attr("r", 8);
  const moveToX = (rawX) => {
    const timestampNs = Math.round(x.invert(Math.max(24, Math.min(width - 24, rawX))));
    handle.attr("cx", x(timestampNs));
    onScrub(timestampNs);
  };
  svg.on("click", (event) => {
    const [pointerX] = d3.pointer(event);
    moveToX(pointerX);
  });
  svg.call(
    d3.drag().on("drag", (event) => {
      moveToX(event.x);
    }),
  );

  const driftWidth = 600;
  const driftHeight = 52;
  const sx = d3.scaleLinear().domain([state.minTimestampNs, state.maxTimestampNs]).range([18, driftWidth - 18]);
  const sy = d3.scaleLinear().domain([0, 1]).range([driftHeight - 12, 10]);
  const line = d3
    .line()
    .x((checkpoint) => sx(checkpoint.timestamp_ns))
    .y((checkpoint) => sy(checkpoint.drift_score ?? 1));
  d3.select(sparkline)
    .append("path")
    .datum(state.checkpoints)
    .attr("class", "sparkline-path")
    .attr("d", line);
}
