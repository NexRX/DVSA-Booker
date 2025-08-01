import { state, type ManageState, updatedState } from "@src/state";
import { search } from "@src/state/solid";
import onLogin from "./on-login";
import onManage from "./on-manage";
import { navigateTo, playAudio } from "@src/utils";
import { Component } from "solid-js";
import { render } from "solid-js/web";
import warn from "@assets/sounds/warn.mp3";
import { play, stop } from "../background/exports";
import styles from "@src/styles/index.css?url";
import Button from "../popup/components/button";

async function main() {
  console.log("yo");
  if ((await state.get()).enabled) {
    console.log("DVSA Booker Enabled & Routing");
    renderUI();

    const state = await updatedState();
    if (state === "captcha") play(warn, true);
    else if (state === "banned") play(warn, false);
    else if (state === "login") onLogin();
    else if (state.startsWith("manage-")) onManage(state as ManageState);
    else {
      console.log("Error", "Unknown page returning to homepage in 65 seconds: ", state);
      play(warn, false);
      // setTimeout(() => navigateTo("login"), 65);
    }
  }
}

function renderUI() {
  const App: Component = () => (
    <div class="fixed bottom-8 left-8 bg-slate-700/50 p-4 rounded-md">
      <h3>DVSA Test Booker</h3>
      <p>State: {search().state}</p>
      <p>This is a reactive UI injected by your extension!</p>
      <Button onClick={stop}>Stop Alerts</Button>
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
