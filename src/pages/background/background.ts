import { playAudio, stopAudio, type PlayAudioOptions } from "./audio";
import { BackgroundMessage } from "./exports";

chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
  console.log(chrome.runtime.getURL("/audio.html"));
  if (message?.action === "playAlert") playAudio(message.options);
  else if (message?.action === "stopAlert") stopAudio();
  else console.log("Unknown background message", message);
});
