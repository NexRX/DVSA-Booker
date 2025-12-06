import { Component, JSX } from "solid-js";
import { config, setConfig } from "@src/state/solid";
import InputGroup from "./components/input-group";
import TextBox from "./components/textbox";
import ToolTip from "./components/tooltip";
import Toggle from "./components/toggle";

const Config: Component = () => {
  return (
    <div class="flex flex-col gap-4 w-full">
      <InputGroup name="Refresh Timing (s)">
        <ToolTip>Number of seconds before refreshing after all test centers have been searched.</ToolTip>
        <TextBox value={config().timingRefresh} numbersOnly setter={(value) => setConfig({ ...config(), timingRefresh: Number(value) })} />
      </InputGroup>
      <InputGroup name="See More Timing (s)">
        <ToolTip>Number of seconds before expanding search to more test centers.</ToolTip>
        <TextBox value={config().timingSeeMore} numbersOnly setter={(value) => setConfig({ ...config(), timingSeeMore: Number(value) })} />
      </InputGroup>
      <InputGroup name="Timing Randomizer (%)">
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
      <InputGroup name="Max Test Centers">
        <ToolTip>Number of test centers to display before fully restarting search.</ToolTip>
        <TextBox
          value={config().showCentersMax}
          numbersOnly
          setter={(value) => setConfig({ ...config(), showCentersMax: Number(value) })}
        />
      </InputGroup>
      <InputGroup name="Fallback Restart (s)">
        <ToolTip>Number of seconds before restarting when a fallback is needed (e.g. stuck on a unknown page).</ToolTip>
        <TextBox
          value={config().fallbackRestartSeconds}
          numbersOnly
          setter={(value) => setConfig({ ...config(), fallbackRestartSeconds: Number(value) })}
        />
      </InputGroup>
      <InputGroup name="Dont Inject/Show UI on Security Pages">
        <ToolTip>
          When enabled, the UI will not be injected or shown on security pages. You may want to enable this to avoid being detected as a
          bot.
        </ToolTip>
        <Toggle
          checked={config().dontInjectUIOnSecurityPages}
          setter={(enabled) => setConfig({ ...config(), dontInjectUIOnSecurityPages: enabled })}
        />
      </InputGroup>
      <InputGroup name="Dont Inject/Show UI on Unknown Pages">
        <ToolTip>
          When enabled, the UI will not be injected or shown on unknown pages. You may want to enable this to avoid being detected as a bot.
        </ToolTip>
        <Toggle
          checked={config().dontInjectUIOnUnknownPages}
          setter={(enabled) => setConfig({ ...config(), dontInjectUIOnUnknownPages: enabled })}
        />
      </InputGroup>
    </div>
  );
};

export default Config;
