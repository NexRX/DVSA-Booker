import { state, type ManageState, updatedState } from "@src/state";
import { search } from "@src/state/solid";
import { config as configState } from "@src/state";
import { Component, Match, Show, Switch, createSignal } from "solid-js";
import { render } from "solid-js/web";
import { play, stop } from "../background/exports";
import { randomVariation } from "@src/logic/simulate";
import onLogin from "./on-login";
import onManage from "./on-manage";
import warn from "@assets/sounds/warn.mp3";
import styles from "@src/styles/index.css?url";
import Button from "../popup/components/button";
import Config from "../popup/config";

const [waiting, setWaiting] = createSignal<number | undefined>(undefined);
const [waitingPause, setWaitingPause] = createSignal<boolean>(false);

async function main() {
  if ((await state.get()).enabled) {
    console.log("DVSA Booker Enabled & Routing");
    renderUI();

    const state = await updatedState();
    if (state === "captcha") play(warn, true);
    else if (state === "banned") play(warn, true);
    else if (state === "login") onLogin();
    else if (state.startsWith("manage-")) onManage(state as ManageState);
    else {
      console.log("Error", "Unknown page returning to homepage in 65 seconds: ", state);
      play(warn, false);
      // setTimeout(() => navigateTo("login"), 65);
    }
  }
}

export async function waitUI() {
  const { timingRefresh, timingRandomizePercent } = await configState.get();
  setWaiting(randomVariation(timingRefresh, timingRandomizePercent));
  setWaitingPause(false);

  return new Promise<void>((resolve) => {
    const countdown = () => {
      if (waiting() === undefined) return;
      if (waitingPause()) {
        // Poll every 500ms until unpaused, then continue countdown
        const pollPause = () => {
          if (waitingPause()) {
            setTimeout(pollPause, 500);
          } else {
            setTimeout(countdown, 1000);
          }
        };
        pollPause();
        return;
      }
      setWaiting((prev) => {
        if (prev === undefined) return undefined;
        const next = prev - 1;
        if (next < 0.5) {
          console.log("Countdown is less than 0.5 seconds!");
        }
        return next;
      });
      if (waiting() !== undefined && waiting() >= 0.5) {
        setTimeout(countdown, 1000);
      } else {
        resolve();
      }
    };

    setTimeout(countdown, 1000);
  });
}

function renderUI() {
  const App: Component = () => (
    <div class="fixed bottom-8 left-8 bg-slate-700/50 p-4 rounded-md">
      <h3>DVSA Test Booker</h3>
      <p>State: {search().state}</p>
      <Show when={waiting()}>
        <p>Waiting before continuing: {Math.floor(waiting() ?? 0)}</p>
        <Switch>
          <Match when={waitingPause() === false}>
            <Button onClick={() => setWaitingPause(true)}>Pause</Button>
          </Match>
          <Match when={waitingPause() === true}>
            <Button onClick={() => setWaitingPause(false)}>Resume</Button>
          </Match>
        </Switch>
      </Show>
      <Button onClick={stop}>Stop Alert Sounds (If Any)</Button>
    </div>
  );

  console.log("Rendering UI");

  // Ensure the container exists
  const containerId = "dvsa-booker-extension-root";
  const container =
    document.getElementById(containerId) ||
    (() => {
      const el = document.createElement("div");
      el.id = containerId;
      document.body.appendChild(el);
      return el;
    })();

  // Add stylesheet to document head if not already present
  if (!document.querySelector('link[href="/src/styles/index.css"]')) {
    const link = document.createElement("link");
    link.href = chrome.runtime.getURL(styles);
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }

  render(() => <App />, container);
}

window.addEventListener("beforeunload", stop);
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", main);
} else {
  await main();
}
