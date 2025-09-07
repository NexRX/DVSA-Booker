import { Component, JSX } from "solid-js";
import { config, setConfig } from "@src/state/solid";
import InputGroup from "./components/input-group";
import TextBox from "./components/textbox";
import ToolTip from "./components/tooltip";
import drivingLicenceExample from "@assets/img/driving-licence-sample.jpg";
import { getYMD } from "@src/logic/date";

const Config: Component = () => {
  return (
    <div class="flex flex-col gap-4">
      <InputGroup name="Refresh Timing">
        <ToolTip>Number of seconds before refreshing after all test centers have been searched.</ToolTip>
        <TextBox value={config().timingRefresh} numbersOnly setter={(value) => setConfig({ ...config(), timingRefresh: Number(value) })} />
      </InputGroup>
      <InputGroup name="Timing Randomizer">
        <ToolTip>Percentage number (0-100) of seconds before taking certain actions, helps to appear more human.</ToolTip>
        <TextBox
          value={config().timingRandomizePercent}
          numbersOnly
          setter={(value) => {
            const timingRandomizePercent = Number(value);
            if (!Number.isNaN(timingRandomizePercent) && timingRandomizePercent >= 0 && timingRandomizePercent <= 100)
              setConfig({ ...config(), timingRandomizePercent });
          }}
        />
      </InputGroup>
    </div>
  );
};

export default Config;
