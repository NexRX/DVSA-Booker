import { getConfig, getSearch, getState } from "@src/state";
import { contentMachine } from "./state-machine";
import { mountContentUI, waitUI } from "./content-ui";
import { setMessage } from "@src/state";
import { stop } from "../background/exports";

async function main() {
  const enabled = (await getState()).enabled;
  if (!enabled) return;

  // Mount overlay UI (message + countdown) once.
  if (await shouldInjectUI()) mountContentUI();

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

// Helper to avoid inject UI on security pages
async function shouldInjectUI() {
  const { dontInjectUIOnSecurityPages, dontInjectUIOnUnknownPages } = await getConfig();
  if (!dontInjectUIOnSecurityPages && !dontInjectUIOnUnknownPages) {
    console.log("Allow UI injection because both flags are false");
    return true;
  }

  const state = (await getSearch()).state;

  if (dontInjectUIOnSecurityPages && (state === "banned" || state === "captcha")) {
    console.log("Disallow UI injection because security page");
    return false;
  }
  if (dontInjectUIOnUnknownPages && state === "unknown") {
    console.log("Disallow UI injection because unknown page");
    return false;
  }

  console.log("Allow UI injection", state);
  return true;
}
