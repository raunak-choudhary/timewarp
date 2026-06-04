export function buildWebSocketUrl(apiBase) {
  const url = new URL(apiBase.replace(/\/$/, ""));
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/ws/live";
  url.search = "";
  return url.toString();
}

export function routeCheckpointMessage(message, timeline) {
  if (message.type !== "checkpoint") {
    return;
  }
  timeline.addNode(message);
  if (message.status) {
    timeline.updateNodeColor(message.checkpoint_id, message.status);
  }
  if (message.anomaly_path?.length) {
    timeline.highlightAnomalyPath(message.anomaly_path);
  }
}

export class TimeWarpSocket {
  constructor({ apiBase, timeline, onStatus }) {
    this.apiBase = apiBase;
    this.timeline = timeline;
    this.onStatus = onStatus || (() => {});
    this.reconnectDelayMs = 1200;
    this.closed = false;
  }

  connect() {
    this.closed = false;
    const wsUrl = buildWebSocketUrl(this.apiBase);
    this.socket = new WebSocket(wsUrl);
    this.onStatus("Connecting");

    this.socket.addEventListener("open", () => {
      this.onStatus("Live");
      this.socket.send("ping");
    });

    this.socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      routeCheckpointMessage(message, this.timeline);
    });

    this.socket.addEventListener("close", () => {
      this.onStatus("Reconnecting");
      if (!this.closed) {
        setTimeout(() => this.connect(), this.reconnectDelayMs);
      }
    });

    this.socket.addEventListener("error", () => {
      this.onStatus("Socket error");
    });
  }

  disconnect() {
    this.closed = true;
    this.socket?.close();
  }
}
