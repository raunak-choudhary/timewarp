export const CAMERA_POSITION = { x: 0, y: 8, z: 26 };
export const CAMERA_TARGET = { x: 0, y: 0, z: 0 };
export const NODE_RADIUS = 0.74;
export const RAIL_WIDTH = 18;
export const RAIL_HEIGHT = 5.4;
export const RAIL_DEPTH = 4.2;

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

export function calculateBoundedNodeLayout(checkpoints) {
  const sorted = checkpoints.map(normalizeCheckpoint).sort((a, b) => a.timestamp_ns - b.timestamp_ns);
  const count = Math.max(sorted.length, 1);
  const positions = new Map();

  sorted.forEach((checkpoint, index) => {
    const progress = count === 1 ? 0.5 : index / (count - 1);
    const angle = -Math.PI * 0.92 + progress * Math.PI * 1.84;
    const x = Math.cos(angle) * (RAIL_WIDTH / 2);
    const y = Math.sin(angle) * (RAIL_HEIGHT / 2) + Math.sin(progress * Math.PI * 2) * 0.35;
    const z = Math.sin(progress * Math.PI) * RAIL_DEPTH - RAIL_DEPTH / 2;
    positions.set(checkpoint.checkpoint_id, { x, y, z, progress, index });
  });

  return positions;
}

export function getFitCameraPose(checkpoints) {
  const count = Math.max(checkpoints.length, 1);
  const distance = Math.min(34, Math.max(22, 16 + count * 0.42));
  return {
    position: { x: 0, y: 8.5, z: distance },
    target: { x: 0, y: 0, z: 0 },
  };
}

export function getFocusCameraPose(position) {
  return {
    position: {
      x: position.x + 1.6,
      y: position.y + 3.2,
      z: position.z + 8.4,
    },
    target: {
      x: position.x,
      y: position.y,
      z: position.z,
    },
  };
}

export class TimeWarpTimeline {
  constructor(root, options = {}) {
    this.root = root;
    this.onSelect = options.onSelect || (() => {});
    this.nodes = new Map();
    this.edges = new Map();
    this.labels = new Map();
    this.chamberObjects = [];
    this.checkpoints = [];
    this.anomalyPath = [];
    this.sceneReady = false;
    this.focusedCheckpointId = null;
    this.cameraTarget = { ...CAMERA_TARGET };
    this.desiredCamera = {
      position: { ...CAMERA_POSITION },
      target: { ...CAMERA_TARGET },
    };
    this.debugFrameIndex = 0;
    this.pointer = null;
    this.raycaster = null;
  }

  async initScene() {
    const THREE = await import("three");
    this.THREE = THREE;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06110f);

    this.camera = new THREE.PerspectiveCamera(52, this.root.clientWidth / this.root.clientHeight, 0.1, 1000);
    this.camera.position.set(CAMERA_POSITION.x, CAMERA_POSITION.y, CAMERA_POSITION.z);
    this.camera.lookAt(CAMERA_TARGET.x, CAMERA_TARGET.y, CAMERA_TARGET.z);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    this.renderer.setSize(this.root.clientWidth, this.root.clientHeight);
    this.renderer.domElement.setAttribute("aria-label", "Interactive 3D checkpoint timeline");
    this.root.replaceChildren(this.renderer.domElement);
    this.renderer.domElement.addEventListener("pointerdown", (event) => this.handlePointerDown(event));

    const ambient = new THREE.AmbientLight(0xd7ece7, 1.05);
    const key = new THREE.DirectionalLight(0xffffff, 2.5);
    key.position.set(8, 16, 14);
    const rim = new THREE.PointLight(0x61e8c8, 4, 36);
    rim.position.set(-8, 4, 10);
    this.scene.add(ambient, key, rim);
    this.addSceneShell();
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    globalThis.addEventListener("resize", () => this.resize());
    this.sceneReady = true;
    this.animate();
  }

  setCheckpoints(checkpoints) {
    this.clear();
    const state = buildTimelineState(checkpoints);
    this.checkpoints = state.checkpoints;
    this.layoutPositions = calculateBoundedNodeLayout(this.checkpoints);
    this.checkpoints.forEach((checkpoint) => this.addNode(checkpoint));
    this.rebuildEdges();
    this.fitToRun();
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

    this.layoutPositions = calculateBoundedNodeLayout(this.checkpoints);
    const position = this.layoutPositions.get(normalized.checkpoint_id) || { x: 0, y: 0, z: 0 };
    const geometry = new this.THREE.SphereGeometry(NODE_RADIUS, 40, 28);
    const material = new this.THREE.MeshStandardMaterial({
      color: STATUS_COLORS[normalized.status] ?? STATUS_COLORS.pending,
      emissive: STATUS_COLORS[normalized.status] ?? STATUS_COLORS.pending,
      emissiveIntensity: normalized.status === "anomaly" ? 0.55 : 0.18,
      roughness: 0.22,
      metalness: 0.45,
    });
    const mesh = new this.THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    mesh.userData.checkpoint = normalized;
    mesh.visible = true;
    this.scene.add(mesh);
    this.nodes.set(normalized.checkpoint_id, mesh);
    this.addNodeHalo(normalized, mesh);
    this.relayoutNodes();
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
    const midpoint = from.position.clone().lerp(to.position, 0.5);
    midpoint.y += 0.45;
    const curve = new this.THREE.CatmullRomCurve3([from.position, midpoint, to.position]);
    const geometry = new this.THREE.TubeGeometry(curve, 32, 0.055, 10, false);
    const material = new this.THREE.MeshBasicMaterial({ color: 0x9cd8ca, transparent: true, opacity: 0.52 });
    const mesh = new this.THREE.Mesh(geometry, material);
    this.scene.add(mesh);
    this.edges.set(`${fromId}:${toId}`, mesh);
  }

  clearEdges() {
    for (const mesh of this.edges.values()) {
      this.scene.remove(mesh);
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    }
    this.edges.clear();
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
      this.focusNode(active.checkpoint_id, { showChamber: false });
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

  focusNode(checkpointId, options = {}) {
    const mesh = this.nodes.get(checkpointId);
    if (!mesh) {
      return;
    }
    this.focusedCheckpointId = checkpointId;
    this.onSelect(mesh.userData.checkpoint);
    this.setCameraPose(getFocusCameraPose(mesh.position));
    if (options.showChamber !== false) {
      this.showFocusOnly(checkpointId);
      this.showNodeChamber(mesh);
    }
  }

  exitFocus() {
    this.focusedCheckpointId = null;
    this.clearNodeChamber();
    this.showFullRun();
    this.fitToRun();
  }

  fitToRun() {
    this.setCameraPose(getFitCameraPose(this.checkpoints));
  }

  setCameraPose(pose) {
    this.desiredCamera = {
      position: { ...pose.position },
      target: { ...pose.target },
    };
  }

  clear() {
    if (!this.sceneReady) {
      this.checkpoints = [];
      return;
    }
    this.clearNodeChamber();
    for (const mesh of [...this.nodes.values(), ...this.edges.values(), ...this.labels.values()]) {
      this.scene.remove(mesh);
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    }
    this.nodes.clear();
    this.edges.clear();
    this.labels.clear();
    this.checkpoints = [];
  }

  rebuildEdges() {
    if (!this.sceneReady) {
      return;
    }
    this.clearEdges();
    const ordered = [...this.checkpoints].sort((a, b) => a.timestamp_ns - b.timestamp_ns);
    for (let index = 1; index < ordered.length; index += 1) {
      this.addEdge(ordered[index - 1].checkpoint_id, ordered[index].checkpoint_id);
    }
  }

  relayoutNodes() {
    this.layoutPositions = calculateBoundedNodeLayout(this.checkpoints);
    for (const [checkpointId, mesh] of this.nodes.entries()) {
      const position = this.layoutPositions.get(checkpointId);
      if (!position) {
        continue;
      }
      mesh.position.set(position.x, position.y, position.z);
      const halo = this.labels.get(`halo:${checkpointId}`);
      if (halo) {
        halo.position.copy(mesh.position);
        halo.lookAt(this.camera.position);
      }
    }
  }

  showFocusOnly(checkpointId) {
    for (const [nodeId, mesh] of this.nodes.entries()) {
      mesh.visible = nodeId === checkpointId;
    }
    for (const mesh of this.edges.values()) {
      mesh.visible = false;
    }
    for (const [labelId, mesh] of this.labels.entries()) {
      mesh.visible = labelId.endsWith(checkpointId);
    }
  }

  showFullRun() {
    for (const mesh of this.nodes.values()) {
      mesh.visible = true;
    }
    for (const mesh of this.edges.values()) {
      mesh.visible = true;
    }
    for (const mesh of this.labels.values()) {
      mesh.visible = true;
    }
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
    this.camera.position.lerp(
      new this.THREE.Vector3(
        this.desiredCamera.position.x,
        this.desiredCamera.position.y,
        this.desiredCamera.position.z,
      ),
      0.075,
    );
    this.cameraTarget.x += (this.desiredCamera.target.x - this.cameraTarget.x) * 0.075;
    this.cameraTarget.y += (this.desiredCamera.target.y - this.cameraTarget.y) * 0.075;
    this.cameraTarget.z += (this.desiredCamera.target.z - this.cameraTarget.z) * 0.075;
    this.camera.lookAt(this.cameraTarget.x, this.cameraTarget.y, this.cameraTarget.z);
    for (const mesh of this.nodes.values()) {
      mesh.rotation.y = time * 0.4;
      if (mesh.userData.checkpoint.status === "anomaly") {
        mesh.scale.setScalar(1.1 + Math.sin(time * 5) * 0.12);
      } else if (mesh.userData.checkpoint.checkpoint_id === this.focusedCheckpointId) {
        mesh.scale.setScalar(1.18 + Math.sin(time * 3) * 0.05);
      } else {
        mesh.scale.lerp(new this.THREE.Vector3(1, 1, 1), 0.1);
      }
    }
    for (const halo of this.labels.values()) {
      halo.lookAt(this.camera.position);
    }
    for (const object of this.chamberObjects) {
      if (object.userData.orbit) {
        object.rotation.y = -time * 0.12;
      }
    }
    this.publishDebugState();
    this.renderer.render(this.scene, this.camera);
  }

  handlePointerDown(event) {
    if (!this.raycaster || !this.pointer) {
      return;
    }
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.nodes.values()], false);
    if (hits.length === 0) {
      return;
    }
    const checkpoint = hits[0].object.userData.checkpoint;
    this.focusNode(checkpoint.checkpoint_id);
  }

  addSceneShell() {
    const railMaterial = new this.THREE.MeshBasicMaterial({ color: 0x46615b, transparent: true, opacity: 0.16 });
    const floorGeometry = new this.THREE.RingGeometry(7.5, 11.5, 96, 1, Math.PI * 0.06, Math.PI * 0.88);
    const floor = new this.THREE.Mesh(floorGeometry, railMaterial);
    floor.rotation.x = -Math.PI / 2.7;
    floor.position.set(0, -2.6, -1.5);
    this.scene.add(floor);

    const spine = new this.THREE.TorusGeometry(8.8, 0.025, 8, 128, Math.PI * 1.84);
    const spineMesh = new this.THREE.Mesh(
      spine,
      new this.THREE.MeshBasicMaterial({ color: 0x58d7c0, transparent: true, opacity: 0.42 }),
    );
    spineMesh.rotation.z = Math.PI * 0.04;
    spineMesh.position.set(0, 0, -0.7);
    this.scene.add(spineMesh);
  }

  addNodeHalo(checkpoint, mesh) {
    const haloGeometry = new this.THREE.RingGeometry(NODE_RADIUS * 1.32, NODE_RADIUS * 1.48, 36);
    const haloMaterial = new this.THREE.MeshBasicMaterial({
      color: STATUS_COLORS[checkpoint.status] ?? STATUS_COLORS.pending,
      transparent: true,
      opacity: checkpoint.status === "anomaly" ? 0.48 : 0.2,
      side: this.THREE.DoubleSide,
    });
    const halo = new this.THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.copy(mesh.position);
    halo.lookAt(this.camera.position);
    halo.userData.checkpointId = checkpoint.checkpoint_id;
    this.scene.add(halo);
    this.labels.set(`halo:${checkpoint.checkpoint_id}`, halo);
  }

  showNodeChamber(mesh) {
    this.clearNodeChamber();
    const checkpoint = mesh.userData.checkpoint;
    const center = mesh.position.clone();
    const panelData = [
      { label: "Input", value: checkpoint.node_name || "node" },
      { label: "Drift", value: Number(checkpoint.drift_score ?? 1).toFixed(2) },
      { label: "Status", value: checkpoint.status },
      { label: "Time", value: `${checkpoint.timestamp_ns}`.slice(-9) },
    ];
    panelData.forEach((panel, index) => {
      const angle = (index / panelData.length) * Math.PI * 2 + Math.PI / 4;
      const pivot = new this.THREE.Group();
      pivot.position.copy(center);
      pivot.rotation.y = angle;
      pivot.userData.orbit = true;

      const sprite = this.createPanelSprite(panel.label, panel.value);
      sprite.position.set(3.2, 0.15, 0);
      pivot.add(sprite);

      const path = new this.THREE.Mesh(
        new this.THREE.CylinderGeometry(0.012, 0.012, 3.2, 6),
        new this.THREE.MeshBasicMaterial({ color: 0x8bd9ca, transparent: true, opacity: 0.28 }),
      );
      path.rotation.z = Math.PI / 2;
      path.position.set(1.6, 0, 0);
      pivot.add(path);

      this.scene.add(pivot);
      this.chamberObjects.push(pivot);
    });

    const ring = new this.THREE.Mesh(
      new this.THREE.TorusGeometry(2.3, 0.025, 8, 96),
      new this.THREE.MeshBasicMaterial({ color: 0x7df1d3, transparent: true, opacity: 0.6 }),
    );
    ring.position.copy(center);
    ring.rotation.x = Math.PI / 2;
    this.scene.add(ring);
    this.chamberObjects.push(ring);
  }

  createPanelSprite(label, value) {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 256;
    const context = canvas.getContext("2d");
    context.fillStyle = "rgba(7, 16, 14, 0.92)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "rgba(113, 224, 196, 0.72)";
    context.lineWidth = 5;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    context.fillStyle = "#8db4aa";
    context.font = "600 28px Inter, sans-serif";
    context.fillText(label.toUpperCase(), 32, 58);
    context.fillStyle = "#e8f4f1";
    context.font = "700 38px Inter, sans-serif";
    this.wrapCanvasText(context, String(value || "-"), 32, 122, 448, 44);
    const texture = new this.THREE.CanvasTexture(canvas);
    const material = new this.THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new this.THREE.Sprite(material);
    sprite.scale.set(3.4, 1.7, 1);
    return sprite;
  }

  wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
    const words = text.split(/\s+/);
    let line = "";
    let currentY = y;
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (context.measureText(testLine).width > maxWidth && line) {
        context.fillText(line, x, currentY);
        line = word;
        currentY += lineHeight;
      } else {
        line = testLine;
      }
      if (currentY > y + lineHeight * 2) {
        break;
      }
    }
    context.fillText(line, x, currentY);
  }

  clearNodeChamber() {
    for (const object of this.chamberObjects) {
      this.scene.remove(object);
      object.traverse?.((child) => {
        child.geometry?.dispose();
        child.material?.map?.dispose();
        child.material?.dispose();
      });
      object.geometry?.dispose();
      object.material?.map?.dispose();
      object.material?.dispose();
    }
    this.chamberObjects = [];
  }

  getDebugState() {
    if (!this.sceneReady) {
      return { sceneReady: false };
    }
    const bounds = {
      minX: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    };
    let visibleNodeCount = 0;
    const projectedNodes = [];
    for (const mesh of this.nodes.values()) {
      if (!mesh.visible) {
        continue;
      }
      const projected = mesh.position.clone().project(this.camera);
      bounds.minX = Math.min(bounds.minX, projected.x);
      bounds.maxX = Math.max(bounds.maxX, projected.x);
      bounds.minY = Math.min(bounds.minY, projected.y);
      bounds.maxY = Math.max(bounds.maxY, projected.y);
      visibleNodeCount += 1;
      projectedNodes.push({
        checkpointId: mesh.userData.checkpoint.checkpoint_id,
        nodeName: mesh.userData.checkpoint.node_name,
        x: Number(projected.x.toFixed(3)),
        y: Number(projected.y.toFixed(3)),
      });
    }
    return {
      sceneReady: true,
      nodeCount: this.nodes.size,
      visibleNodeCount,
      edgeCount: this.edges.size,
      focusedCheckpointId: this.focusedCheckpointId,
      chamberObjectCount: this.chamberObjects.length,
      cameraPosition: this.camera.position.toArray().map((value) => Number(value.toFixed(3))),
      cameraTarget: [this.cameraTarget.x, this.cameraTarget.y, this.cameraTarget.z].map((value) => Number(value.toFixed(3))),
      projectedBounds: visibleNodeCount > 0 ? bounds : null,
      projectedNodes,
    };
  }

  publishDebugState() {
    this.debugFrameIndex += 1;
    if (this.debugFrameIndex % 20 !== 0) {
      return;
    }
    this.root.dataset.debug = JSON.stringify(this.getDebugState());
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
