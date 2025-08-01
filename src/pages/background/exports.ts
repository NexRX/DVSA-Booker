import { type PlayAudioOptions } from "./audio";

export type BackgroundMessage =
  | {
      action: "playAlert";
      options: PlayAudioOptions;
    }
  | {
      action: "stopAlert";
    };

export function play(soundUrl: string, loop: boolean = false) {
  chrome.runtime.sendMessage({ action: "playAlert", options: { soundUrl, loop } } as BackgroundMessage);
}

export function stop() {
  chrome.runtime.sendMessage({ action: "stopAlert" } as BackgroundMessage);
}
