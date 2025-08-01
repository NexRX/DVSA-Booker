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
