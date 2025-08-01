import { create } from "node:domain";

export interface PlayAudioOptions {
  soundUrl: string;
  /** If truthy, loop the audio and if number the delay between loops in milliseconds */
  loop?: boolean;
}

interface OffscreenPlayMessage extends PlayAudioOptions {
  action: "offscreenPlay";
}

interface OffscreenStopMessage {
  action: "offscreenStop";
}

let offscreenDocumentCreated = false;

export async function playAudio(options: PlayAudioOptions) {
  console.log("Audio Request", options);
  if (offscreenDocumentCreated) stopAudio();
  await createOffscreenDocument(options);

  chrome.runtime.sendMessage({
    action: "offscreenPlay",
    ...options,
  } as OffscreenPlayMessage);
}

export async function stopAudio() {
  chrome.runtime.sendMessage({
    action: "offscreenStop",
  } as OffscreenStopMessage);
}

/**
 * Create offscreen document for audio playback
 */
async function createOffscreenDocument(options: PlayAudioOptions) {
  // if (offscreenDocumentCreated) {
  //   return;
  // }
  const url = `${chrome.runtime.getURL("/audio.html")}?sound=${options.soundUrl}&loop=${options.loop}`;

  try {
    // @ts-ignore
    if (!chrome || !chrome?.offscreen || !chrome?.offscreen.createDocument) {
      console.error("Offscreen API is not available.");
      throw new Error("Offscreen API is not available.");
    }

    // @ts-ignore
    await chrome.offscreen.createDocument({
      url,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play notification sounds and alerts for user interactions",
    });
    offscreenDocumentCreated = true;
    console.log("Offscreen document created for audio playback");
  } catch (error) {
    if (error.message.includes("Only a single offscreen document may be created")) {
      offscreenDocumentCreated = true;
      console.log("Offscreen document already exists");
    } else {
      console.error("Failed to create offscreen document:", error);
      throw error;
    }
  }
}
