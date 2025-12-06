/**
 * Content Script UI Module
 *
 * Separates the in-page status overlay (message + countdown) and timing logic
 * from the main routing / state-machine code.
 *
 * Responsibilities:
 *  - Expose reactive signals: message, waitingSeconds, paused
 *  - Provide waitUI() for countdowns that integrate with pause/resume buttons
 *  - Provide mountContentUI() to inject / render the overlay once
 *
 * Integrations:
 *  - State machine can import { waitUI, setMessage } instead of depending on index.tsx
 *  - Background audio control still handled elsewhere; Stop button delegates to exports.ts
 *
 * Notes:
 *  - waitUI() returns a Promise that resolves when countdown finishes
 *  - If paused, countdown polling switches to a lightweight 500ms check.
 *  - Randomization uses config.timingRandomizePercent unless overridden.
 */

import { Component, createSignal, Show, Switch, Match } from "solid-js";
import { render } from "solid-js/web";
import { search } from "@src/state/solid";
import { getConfig } from "@src/state";
import { randomVariation } from "@src/logic/simulate";
import { stop } from "../background/exports";
import styles from "@src/styles/index.css?url";
import Button from "../popup/components/button";

/* -------------------------------------------------------------------------- */
/* Reactive Signals                                                           */
/* -------------------------------------------------------------------------- */

/** Human-readable status message. */
export const [message, setMessageInner] = createSignal<string | undefined>(undefined);
export function setMessage(message: string | undefined) {
  console.log("Message:", message);
  setMessageInner(message);
}

/** Remaining seconds (float) in the active wait countdown; undefined if inactive. */
export const [waitingSeconds, setWaitingSeconds] = createSignal<number | undefined>(undefined);

/** Whether the current countdown is paused. */
export const [isPaused, setIsPaused] = createSignal<boolean>(false);

/** Internal handle for active countdown resolver. */
let activeResolve: (() => void) | null = null;

/* -------------------------------------------------------------------------- */
/* Countdown Logic                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Begin a UI-aware wait countdown.
 * @param explicitSeconds Optional override for base timing (otherwise uses config.timingRefresh)
 * @param randomize Whether to apply percentage randomization
 */
export async function waitUI(explicitSeconds?: number, randomize: boolean = true): Promise<void> {
  const cfg = await getConfig();
  let base = explicitSeconds ?? cfg.timingRefresh;
  const pct = randomize ? cfg.timingRandomizePercent : 0;

  const total = randomVariation(base, pct);
  setWaitingSeconds(Math.max(0, total));
  setIsPaused(false);

  // Ensure any previous resolver is cleared
  activeResolve = null;

  return new Promise<void>((resolve) => {
    activeResolve = resolve;

    const tick = () => {
      if (waitingSeconds() === undefined) {
        // Already cleaned externally
        cleanup();
        return;
      }
      if (isPaused()) {
        // Poll lightly while paused
        setTimeout(tick, 500);
        return;
      }
      setWaitingSeconds((prev) => {
        if (prev === undefined) return undefined;
        const next = prev - 1;
        return next < 0 ? 0 : next;
      });
      const remaining = waitingSeconds();
      if (remaining !== undefined && remaining > 0) {
        setTimeout(tick, 1000);
      } else {
        cleanup();
      }
    };

    function cleanup() {
      setWaitingSeconds(undefined);
      const r = activeResolve;
      activeResolve = null;
      if (r) r();
    }

    // Kick off first tick after 1s (for a full second display)
    setTimeout(tick, 1000);
  });
}

/**
 * Reset countdown state without resolving the Promise.
 * Primarily used if the UI needs to forcibly clear display without signaling completion.
 */
export function resetWaiting() {
  setWaitingSeconds(undefined);
  setIsPaused(false);
}

/* -------------------------------------------------------------------------- */
/* UI Mounting                                                                */
/* -------------------------------------------------------------------------- */

/** ID used for injected container element. */
const CONTAINER_ID = "dvsa-booker-extension-root";

/** Whether the overlay has been mounted. */
let mounted = false;

/**
 * Injects and renders the overlay UI. Idempotent.
 * Call once early in main execution path (e.g., after enabling logic).
 */
export function mountContentUI() {
  if (mounted) return;
  mounted = true;

  const container =
    document.getElementById(CONTAINER_ID) ||
    (() => {
      const el = document.createElement("div");
      el.id = CONTAINER_ID;
      document.body.appendChild(el);
      return el;
    })();

  ensureStyles();

  const Overlay: Component = () => {
    return (
      <div class="!fixed !bottom-8 !left-8 !bg-slate-700/70 !p-4 !rounded-md !max-w-96 !z-[999999]">
        <h3 class="text-white border border-black p-1 rounded font-semibold">DVSA Test Booker</h3>
        <p class="text-white border border-black p-1 rounded">
          State: <span class="font-mono">{search().state}</span>
        </p>
        <p class="text-white border border-black p-1 rounded">
          Message: <span class="font-mono">{message() ?? "idle..."}</span>
        </p>
        <Show when={waitingSeconds() !== undefined}>
          <p class="text-white border border-black p-1 rounded">
            Waiting: <span class="font-mono">{Math.floor(waitingSeconds() ?? 0)}</span>s
          </p>
          <Switch>
            <Match when={!isPaused()}>
              <Button onClick={() => setIsPaused(true)}>Pause</Button>
            </Match>
            <Match when={isPaused()}>
              <Button onClick={() => setIsPaused(false)}>Resume</Button>
            </Match>
          </Switch>
        </Show>
        <Button onClick={stop} class="!mt-2">
          Stop Alert Sounds
        </Button>
      </div>
    );
  };

  render(() => <Overlay />, container);
}

/* -------------------------------------------------------------------------- */
/* Styles                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Ensure stylesheet is available. Uses chrome.runtime.getURL for extension path resolution.
 */
function ensureStyles() {
  const existing = document.querySelector(`link[href*="styles/index.css"]`);
  if (existing) return;
  const link = document.createElement("link");
  link.href = chrome.runtime.getURL(styles);
  link.rel = "stylesheet";
  document.head.appendChild(link);
}

/* -------------------------------------------------------------------------- */
/* Convenience Exports                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Shorthand to set both message and start a wait in one call.
 * @example await messageAndWait("Retrying soon", 30);
 */
export async function messageAndWait(msg: string, seconds?: number, randomize: boolean = true) {
  setMessage(msg);
  await waitUI(seconds, randomize);
}

/**
 * True if a countdown is currently active.
 */
export function isWaitingActive(): boolean {
  return waitingSeconds() !== undefined;
}

/**
 * Remaining whole seconds convenience accessor.
 */
export function remainingWholeSeconds(): number | null {
  const v = waitingSeconds();
  return v === undefined ? null : Math.floor(v);
}

/* -------------------------------------------------------------------------- */
/* Auto-cleanup on page unload                                                */
/* -------------------------------------------------------------------------- */

window.addEventListener("beforeunload", () => {
  stop();
});

/* -------------------------------------------------------------------------- */
/* End                                                                        */
/* -------------------------------------------------------------------------- */
