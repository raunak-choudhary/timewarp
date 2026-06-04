export function extractPromptFromState(state) {
  if (!state) {
    return "";
  }
  return state.task || state.prompt || state.analysis || state.plan || "";
}

export function buildBranchPayload({ runId, timestampNs, newPrompt, nodeName }) {
  return {
    run_id: runId,
    from_timestamp_ns: timestampNs,
    new_prompt: newPrompt,
    node_name: nodeName,
  };
}

export class DiffView {
  constructor({ panel, originalInput, editedInput, replayButton, closeButton, apiBase }) {
    this.panel = panel;
    this.originalInput = originalInput;
    this.editedInput = editedInput;
    this.replayButton = replayButton;
    this.closeButton = closeButton;
    this.apiBase = apiBase;
    this.context = null;
    this.closeButton.addEventListener("click", () => this.close());
    this.replayButton.addEventListener("click", () => this.createBranch());
  }

  open({ runId, timestampNs, nodeName, reconstructedState }) {
    const prompt = extractPromptFromState(reconstructedState);
    this.context = { runId, timestampNs, nodeName };
    this.originalInput.value = prompt;
    this.editedInput.value = prompt;
    this.panel.classList.add("open");
    this.panel.setAttribute("aria-hidden", "false");
  }

  close() {
    this.panel.classList.remove("open");
    this.panel.setAttribute("aria-hidden", "true");
  }

  async createBranch() {
    if (!this.context) {
      return;
    }
    const payload = buildBranchPayload({
      ...this.context,
      newPrompt: this.editedInput.value,
    });
    await fetch(`${this.apiBase}/branch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    this.close();
  }
}
