import { playAudio, stopAudio } from "./audio.firefox";
import { BackgroundMessage } from "./exports";

chrome.runtime.onMessage.addListener((message: BackgroundMessage, sender, sendResponse) => {
  console.log(chrome.runtime.getURL("/audio.html"));
  if (message?.action === "playAlert") playAudio(message.options);
  else if (message?.action === "stopAlert") stopAudio();
  else console.log("Unknown background message", message);
});
