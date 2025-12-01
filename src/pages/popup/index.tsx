import { render } from "solid-js/web";
import logo from "@assets/img/logo.png";
import { createSignal } from "solid-js";
import { Tabs } from "./components/tabs";
import { state } from "@src/state/solid";
import Home from "./home";
import Settings from "./settings";
import Config from "./config";

const appContainer = document.querySelector("#app-container");
if (!appContainer) {
  throw new Error("Can not find AppContainer");
}

function Popup() {
  const [selectedTab, setSelectedTab] = createSignal(0);

  return (
    <div id="app" class="flex flex-col gap-4 w-[28rem] p-4 text-white bg-gray-700">
      <div class="flex flex-row items-center justify-center w-full border border-red-500 rounded-lg gap-6 ">
        <img src={logo} class="w-20" alt="DVSA Test Booker Logo" />
        <h1 class="text-2xl font-bold">DVSA Test Booker</h1>
      </div>
      <Tabs
        tabs={[
          { label: "Home", content: <Home /> },
          { label: "Test Details", content: <Settings /> },
          { label: "Search Config", content: <Config /> },
        ]}
      />
      <footer class="text-center text-gray-500 text-xs">
        Developed by Nex - V{state().version} © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

render(Popup, appContainer);
