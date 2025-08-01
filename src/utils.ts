type SimulateTypingOptions = {
  speed?: number;
  randomizedPercentage?: number;
  clear?: boolean;
};

/** Function to simulate typing into a text field
 * @example
 * const textField = document.querySelector("#myTextField");
 * simulateTyping(textField, "Hello, world!");
 * // or
 * simulateTyping("myTextField", "Hello, world!")
 */
export async function simulateTyping(elementOrId: HTMLInputElement | string, text: string, opt: SimulateTypingOptions = {}) {
  const element = getElement(elementOrId);
  const speed = opt.speed ?? 150;
  const randomizedPercentage = opt.randomizedPercentage ?? 0.1;
  const clear = opt.clear ?? true;

  if (clear) {
    element.value = "";
  }

  let index = 0;
  return new Promise<void>((resolve) => {
    function typeCharacter() {
      if (index < text.length) {
        // Append the next character to the text field
        element.value += text[index];
        index++;

        // Schedule the next character to be typed
        let currentSpeed = randomVariation(speed, randomizedPercentage);
        setTimeout(typeCharacter, currentSpeed);
      } else {
        resolve();
      }
    }
    typeCharacter();
  });
}

export function wait(ms: number, randomizedPercentage: number = 10) {
  return new Promise((resolve) => setTimeout(resolve, randomVariation(ms, randomizedPercentage)));
}

/**
 * Introduce a random variation to a given numeric value.
 *
 * Logic
 * 1. **`Math.random()`**: Generates a random number between `0` and `1`.
 * 2. **`Math.random() * 2 - 1`**: Scales the random number to a range between `-1` and `1`. This ensures the variation can be both positive and negative.
 * 3. **`value * percentageVariation`**: Calculates the maximum amount by which the `value` can vary.
 * 4. **`(Math.random() * 2 - 1) * value * percentageVariation`**: Computes the actual variation by multiplying the random factor (between `-1` and `1`) with the maximum variation.
 * 5. **`value + ...`**: Adds the computed variation to the original `value`.
 * @param percentageVariation
 * @returns A
 */
export function randomVariation(value: number, percentageVariation: number) {
  return value + (Math.random() * 2 - 1) * value * percentageVariation;
}

export function click<T extends HTMLElement>(elementOrId: T | string) {
  getElement(elementOrId).click();
}

/**
 * Returns the given element or finds it by its id
 * @param elementOrId The Input element or id of one
 * @throws Error - "No element found" if element is null/un-found
 * @returns
 */
function getElement<T extends HTMLElement>(elementOrId: T | string): T {
  const element = typeof elementOrId == "string" ? (document.getElementById(elementOrId) as T | null) : elementOrId;
  if (!element) {
    throw new Error("No element found");
  }
  return element;
}

/** Navigates to a DVSA page */
export function navigateTo(to: "login", openNew?: boolean) {
  const domain = "https://driverpracticaltest.dvsa.gov.uk";
  function navigate(path: string, target?: string) {
    if (openNew) {
      window.open(`${domain}${path}`, target);
    } else {
      window.location.href = `${domain}${path}`;
    }
  }
  switch (to) {
    case "login":
      return navigate("/login");
      break;
  }
}

export function dateToDisplay(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function getYMD(dateOrMs: Date | number): string {
  const date = typeof dateOrMs === "number" ? new Date(dateOrMs) : dateOrMs;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "2020-01-01"; // default fallback
  }

  const year = date.getFullYear();
  if (year < 1000 || year > 9999) {
    return "2020-01-01"; // prevent malformed year values
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
type PlayAudioOptions = {
  /** If truthy, loop the audio and if number the delay between loops in milliseconds */
  loop?: boolean | number;
};

type AudioHandler = {
  readonly stop: () => void;
};

let currentAudio: AudioHandler | null = null;
let audioContext: AudioContext | null = null;

export function playAudio(soundUrl: string, opt: PlayAudioOptions = {}): AudioHandler {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }

  let stopped = false;
  let timeoutId: number | null = null;
  let source: AudioBufferSourceNode | null = null;

  // Stop any currently playing audio
  if (currentAudio !== null) {
    currentAudio.stop();
  }

  // Helper to stop playback
  const stop = () => {
    stopped = true;
    if (source) {
      source.stop();
      source.disconnect();
      source = null;
    }
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };

  // Function to play the buffer, with optional looping
  const playBuffer = (buffer: AudioBuffer) => {
    if (stopped) return;
    source = audioContext!.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext!.destination);

    if (opt.loop && typeof opt.loop === "boolean") {
      source.loop = true;
      source.start(0);
    } else {
      source.loop = false;
      source.start(0);
      source.onended = () => {
        if (stopped) return;
        if (opt.loop && typeof opt.loop === "number") {
          timeoutId = window.setTimeout(() => playBuffer(buffer), opt.loop);
        }
      };
    }
  };

  // Fetch and decode the audio file
  fetch(chrome.runtime.getURL(soundUrl))
    .then((res) => res.arrayBuffer())
    .then((data) => audioContext!.decodeAudioData(data))
    .then((buffer) => {
      if (!stopped) playBuffer(buffer);
    });

  const handler: AudioHandler = { stop };
  currentAudio = handler;
  return handler;
}

export function stopAudio() {
  if (currentAudio !== null) {
    currentAudio.stop();
    currentAudio = null;
  }
}

export function exists(query: string) {
  return document.querySelector(query) !== null;
}
