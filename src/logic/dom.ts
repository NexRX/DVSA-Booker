/**

 * DOM Utility & Safety Helpers
 *
 * Provides:
 *  - getElement: strict ID lookup / element passthrough (throws if missing)
 *  - getElementOptional: safe version returning undefined instead of throwing
 *  - exists: boolean existence check by CSS selector
 *  - query / queryAll: typed CSS querying helpers
 *  - queryRequired: typed query that throws with contextual message
 *  - requiredText: extract and validate element text content
 *  - SELECTORS: central selector map for commonly accessed nodes (extend as needed)
 */

/* -------------------------------------------------------------------------- */
/* Selector Registry                                                          */
/* -------------------------------------------------------------------------- */
export const SELECTORS = {
  progressBar: "#progress-bar",
  testCentreLinks: "a.test-centre-details-link",
  bookableCalendarCells: "td.BookingCalendar-date--bookable a.BookingCalendar-dateLink",
  activeSlotInputs: ".SlotPicker-day.is-active label input",
  searchResults: "#search-results",
  confirmBookingDetails: "#confirm-booking-details",
} as const;

/* -------------------------------------------------------------------------- */
/* Base Element Access                                                        */
/* -------------------------------------------------------------------------- */
/**
 * Returns the given element or finds it by its id (strict).
 * @throws Error if element not found.
 */
export function getElement<T extends HTMLElement>(elementOrId: T | string): T {
  const element = typeof elementOrId === "string" ? (document.getElementById(elementOrId) as T | null) : elementOrId;

  if (!element) {
    throw new Error(`No element found (id: ${typeof elementOrId === "string" ? elementOrId : elementOrId.id || "unknown"})`);
  }

  return element;
}

/**
 * Optional variant of getElement that returns undefined instead of throwing.
 */
export function getElementOptional<T extends HTMLElement>(elementOrId: T | string): T | undefined {
  try {
    return getElement(elementOrId);
  } catch {
    return undefined;
  }
}

/* -------------------------------------------------------------------------- */
/* Generic Query Helpers                                                      */
/* -------------------------------------------------------------------------- */
export function exists(query: string, root: ParentNode = document) {
  return root.querySelector(query) !== null;
}

export function query<T extends Element>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector(selector) as T | null;
}

export function queryAll<T extends Element>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll(selector)) as T[];
}

/**
 * Query an element and throw if missing.
 * @param selector CSS selector
 * @param context Context string to improve error messages
 */
export function queryRequired<T extends Element>(selector: string, context: string, root: ParentNode = document): T {
  const el = query<T>(selector, root);
  if (!el) {
    throw new Error(`Required element not found: ${selector} (context: ${context})`);
  }
  return el;
}

/**
 * Ensure an element has textual content and return trimmed text.
 * @param el Element (or null) whose text is required
 * @param context Context label for error reporting
 */
export function requiredText(el: HTMLElement | null, context: string): string {
  if (!el) {
    throw new Error(`Missing element for requiredText (context: ${context})`);
  }
  const text = el.innerText?.trim();
  if (!text) {
    throw new Error(`Empty or missing text content (context: ${context})`);
  }
  return text;
}
