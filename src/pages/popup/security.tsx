import { resetCaptchaBackoff, resetBannedBackoff, resetAllSecurity, setManualPause } from "@src/state";
import { securityState, setSecurityState } from "@src/state/solid";
import { Component, createSignal } from "solid-js";
import InputGroup from "./components/input-group";
import ToolTip from "./components/tooltip";
import TextBox from "./components/textbox";

export const Security: Component = () => (
  <div class="flex flex-col gap-4 w-full">
    <div class="border border-gray-500 rounded p-3 flex flex-col gap-1 text-sm">
      <p>Captcha Count: {securityState().captchaCount}</p>
      <p>Banned Count: {securityState().bannedCount}</p>
      <p>Captcha Backoff Level: {securityState().backoffLevelCaptcha}</p>
      <p>Banned Backoff Level: {securityState().backoffLevelBanned}</p>
      <p>
        Next Captcha Retry:{" "}
        {securityState().nextRetryCaptcha ? Math.max(0, Math.ceil((securityState().nextRetryCaptcha - Date.now()) / 1000)) + "s" : "ready"}
      </p>
      <p>
        Next Banned Retry:{" "}
        {securityState().nextRetryBanned ? Math.max(0, Math.ceil((securityState().nextRetryBanned - Date.now()) / 1000)) + "s" : "ready"}
      </p>
      <p>
        Manual Pause Remaining:{" "}
        {securityState().manualPauseUntil ? Math.max(0, Math.ceil((securityState().manualPauseUntil - Date.now()) / 1000)) + "s" : "none"}
      </p>
    </div>
    <div class="flex items-center gap-2">
      <InputGroup name="Manual Pause (s)">
        <ToolTip>Number of seconds to pause before retries.</ToolTip>
        <TextBox
          value={securityState().manualPauseUntil}
          numbersOnly
          setter={(value) => setSecurityState({ ...securityState(), manualPauseUntil: Number(value) })}
        />
      </InputGroup>
      <button
        class="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
        onClick={() => setSecurityState({ ...securityState(), manualPauseUntil: 0 })}
      >
        Clear
      </button>
    </div>
    <div class="flex flex-wrap gap-2">
      <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm" onClick={() => resetCaptchaBackoff()}>
        Reset Captcha Backoff
      </button>
      <button class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm" onClick={() => resetBannedBackoff()}>
        Reset Banned Backoff
      </button>
      <button class="bg-red-700 hover:bg-red-800 text-white px-3 py-1 rounded text-sm" onClick={() => resetAllSecurity()}>
        Reset All Security
      </button>
    </div>
    <p class="text-xs text-gray-400">Backoff reduces aggressive retries when captcha or Error 15 (banned) responses occur.</p>
  </div>
);
