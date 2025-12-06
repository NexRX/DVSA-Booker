import { getState } from "@src/state";
import { contentMachine } from "./state-machine";
import { mountContentUI, waitUI, setMessage } from "./content-ui";
import { stop } from "../background/exports";

async function main() {
  const enabled = (await getState()).enabled;
  if (!enabled) return;

  // Mount overlay UI (message + countdown) once.
  mountContentUI();

  // Inject UI helpers into the state machine (for wait + messaging).
  contentMachine.injectUi({ waitUI, setMessage });

  // Begin routing logic.
  await contentMachine.route();
}

// Run on DOM ready.
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", () => void main());
} else {
  void main();
}

// Ensure sounds stopped on unload.
window.addEventListener("beforeunload", stop);
