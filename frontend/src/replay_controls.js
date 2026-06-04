export function clampTimestamp(timestampNs, minTimestampNs, maxTimestampNs) {
  return Math.max(minTimestampNs, Math.min(maxTimestampNs, timestampNs));
}

export function createReplayRequestUrl(apiBase, runId, timestampNs) {
  const base = apiBase.replace(/\/$/, "");
  return `${base}/replay/${timestampNs}?run_id=${encodeURIComponent(runId)}`;
}

export function shouldShowBranchButton(selectedTimestampNs, maxTimestampNs) {
  return selectedTimestampNs < maxTimestampNs;
}

export class ReplayController {
  constructor({ timeline, getRunState, onTick }) {
    this.timeline = timeline;
    this.getRunState = getRunState;
    this.onTick = onTick || (() => {});
    this.timer = null;
    this.currentTimestampNs = 0;
  }

  scrubTo(timestampNs) {
    const runState = this.getRunState();
    if (!runState || runState.maxTimestampNs === 0) {
      return;
    }
    this.currentTimestampNs = clampTimestamp(timestampNs, runState.minTimestampNs, runState.maxTimestampNs);
    this.timeline.rewindToTime(this.currentTimestampNs);
    this.onTick(this.currentTimestampNs);
  }

  play() {
    const runState = this.getRunState();
    if (!runState || this.timer) {
      return;
    }
    this.currentTimestampNs = this.currentTimestampNs || runState.minTimestampNs;
    const step = Math.max(1, Math.round((runState.maxTimestampNs - runState.minTimestampNs) / 60));
    this.timer = setInterval(() => {
      if (this.currentTimestampNs >= runState.maxTimestampNs) {
        this.pause();
        return;
      }
      this.scrubTo(this.currentTimestampNs + step);
    }, 80);
  }

  pause() {
    clearInterval(this.timer);
    this.timer = null;
  }

  toggle() {
    if (this.timer) {
      this.pause();
    } else {
      this.play();
    }
  }
}
