export function getApiBase() {
  const stored = globalThis.localStorage?.getItem("timewarp.apiBase");
  if (stored) {
    return stored.replace(/\/$/, "");
  }

  const viteBase = import.meta.env?.VITE_API_BASE_URL;
  if (viteBase) {
    return viteBase.replace(/\/$/, "");
  }

  return "http://localhost:8000";
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${detail}`);
  }
  return response.json();
}

export async function listRuns(apiBase) {
  return fetchJson(`${apiBase}/runs`);
}

export async function getCheckpoints(apiBase, runId) {
  return fetchJson(`${apiBase}/checkpoints?run_id=${encodeURIComponent(runId)}`);
}

export async function getAnomalyPath(apiBase, runId) {
  return fetchJson(`${apiBase}/anomaly/path?run_id=${encodeURIComponent(runId)}`);
}

export async function startRun(apiBase) {
  return fetchJson(`${apiBase}/runs/start`, { method: "POST" });
}

export async function replayAt(apiBase, runId, timestampNs) {
  return fetchJson(`${apiBase}/replay/${timestampNs}?run_id=${encodeURIComponent(runId)}`);
}
