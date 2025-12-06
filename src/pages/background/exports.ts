export interface PlayAudioOptions {
  soundUrl: string;
  /** If truthy, loop the audio and if number the delay between loops in milliseconds */
  loop?: boolean | number;
}

export interface OffscreenPlayMessage extends PlayAudioOptions {
  action: "offscreenPlay";
}

export interface OffscreenStopMessage {
  action: "offscreenStop";
}

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
