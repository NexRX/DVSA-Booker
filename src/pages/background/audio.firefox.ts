import { PlayAudioOptions } from "./exports";

let audio: HTMLAudioElement | null = null;
let loopTimeout: number | null = null;

export function playAudio(options: PlayAudioOptions) {
  stopAudio();

  audio = new Audio(options.soundUrl);
  audio.loop = !!options.loop && typeof options.loop !== "number";

  if (typeof options.loop === "number") {
    audio.addEventListener("ended", () => {
      loopTimeout = window.setTimeout(() => {
        playAudio(options);
      }, options.loop as number);
    });
  }

  audio.play();
}

export function stopAudio() {
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
  if (loopTimeout) {
    clearTimeout(loopTimeout);
    loopTimeout = null;
  }
}
