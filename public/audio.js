console.log("Loading audio.js");

/**
 * @typedef {Object} OffscreenPlayMessage
 * @property {"offscreenPlay" | "offscreenStop} action
 * @property {string} soundUrl
 * @property {boolean} loop
 */

chrome.runtime.onMessage.addListener(( /** @type {OffscreenPlayMessage} */ message, sender, sendResponse) => {
  /** @type {HTMLAudioElement} */
  const audioElement = document.getElementById("notification-sound");

  if (message.action === 'offscreenPlay') {

    audioElement.src = message.soundUrl;
    audioElement.loop = message.loop;
    audioElement.play();
  } else if (message.action === 'offscreenStop') {
    audioElement.pause();
    audioElement.loop = false
  }
});
