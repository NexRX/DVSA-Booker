import { getElement } from "./dom";

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

export function wait(ms: number, randomizedPercentage: number = 0, updateUi = false) {
  const totalMs = randomVariation(ms, randomizedPercentage);
  const totalSeconds = totalMs / 1000;
  if (!updateUi) {
    return new Promise((resolve) => setTimeout(resolve, totalMs));
  }
  console.log("Seconds: ", totalSeconds);
  return new Promise((resolve) => {
    let elapsed = 0;
    const interval = 1000;
    const intervalId = setInterval(() => {
      elapsed += interval;
      console.log("Waiting...");
      if (elapsed >= totalMs) {
        clearInterval(intervalId);
        resolve(undefined);
      }
    }, interval);
    // In case totalMs is less than interval, resolve after totalMs
    setTimeout(() => {
      if (elapsed < totalMs) {
        clearInterval(intervalId);
        console.log("Waiting...");
        resolve(undefined);
      }
    }, totalMs);
  });
}

/**
 * Introduce a random variation to a given numeric value.
 */
export function randomVariation(value: number, percentageVariation: number): number {
  // Handle edge case where percentageVariation is 0
  if (percentageVariation === 0) {
    return value;
  }

  // Calculate the variation amount
  const variationAmount = (value * percentageVariation) / 100;

  // Calculate min and max bounds
  const min = value - variationAmount;
  const max = value + variationAmount;

  // Generate random number between min and max (inclusive)
  return Math.random() * (max - min) + min;
}

export function click<T extends HTMLElement>(elementOrId: T | string) {
  getElement(elementOrId).click();
}
