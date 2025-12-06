import type { PlayAudioOptions, OffscreenPlayMessage, OffscreenStopMessage } from "./exports";

let offscreenDocumentCreated = false;

export async function playAudio(options: PlayAudioOptions) {
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
  const url = `${chrome.runtime.getURL("/audio.html")}?sound=${options.soundUrl}&loop=${options.loop}`;

  try {
    // @ts-ignore
    if (!chrome || !chrome?.offscreen || !chrome?.offscreen.createDocument) {
      throw new Error("Offscreen API is not available.");
    }

    // @ts-ignore
    await chrome.offscreen.createDocument({
      url,
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play notification sounds and alerts for user interactions",
    });
    offscreenDocumentCreated = true;
  } catch (error: any) {
    if (error.message && error.message.includes("Only a single offscreen document may be created")) {
      offscreenDocumentCreated = true;
    } else {
      throw error;
    }
  }
}
