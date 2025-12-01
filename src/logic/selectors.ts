/**
 * Central DOM selector registry and safe access helpers.
 *
 * Rationale:
 *  - Avoid scattering raw CSS selectors throughout logic files.
 *  - Provide typed, safe helpers (throws explicit errors when elements are missing).
 *  - Simplify future maintenance when DVSA markup changes (single point of update).
 *  - Improve testability (can mock selectors or override in tests).
 *
 * Conventions:
 *  - Keys are camelCase semantic names.
 *  - Keep selectors narrowly scoped (avoid over‑broad matches that can create ambiguity).
 *  - For dynamic states (e.g. progress text) we expose functions instead of static selectors.
 */

export const SELECTORS = {
  // Navigation / flow indicators
  progressBar: "#progress-bar",
  confirmBookingDetails: "#confirm-booking-details",
  headlineInnerParagraph: ".headline-inner p",

  // Booking / manage flow
  testCentreChangeButton: "#test-centre-change",
  testCentreSearchInput: "#test-centres-input",
  testCentreSearchSubmit: "#test-centres-submit",
  testCentreFetchMore: "#fetch-more-centres",
  testCentreResultsListItems: ".test-centre-results > li",
  testCentreDetailsLinks: "a.test-centre-details-link",
  chosenTestCentre: "#chosen-test-centre",

  // Calendar & slots
  bookableCalendarLinks: "td.BookingCalendar-date--bookable a.BookingCalendar-dateLink",
  activeSlotInputs: ".SlotPicker-day.is-active label input",

  // Confirmation choices
  iAmCandidate: "#i-am-candidate",
  iAmNotCandidate: "#i-am-not-candidate",

  // Confirmation detail sections
  confirmBookingDetailsSection: "#confirm-booking-details",

  // Login form
  loginLicenceInput: "#driving-licence-number",
  loginReferenceInput: "#application-reference-number",
  loginButton: "#booking-login",

  // Captcha / banned detection (heuristics)
  bodyIframe: "body iframe",

  // Misc / global
  searchLimitTextAny: "*", // used for scanning textContent for "Search limit reached"
} as const;

/** Type union of all selector keys. */
export type SelectorKey = keyof typeof SELECTORS;

/**
 * Returns a selector string by key.
 */
export function getSelector(key: SelectorKey): string {
  return SELECTORS[key];
}

/* -------------------------------------------------------------------------- */
/* Generic Safe Query Helpers                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Query a single element. Returns null if not found.
 */
export function query<K extends SelectorKey, T extends Element = HTMLElement>(key: K, root: ParentNode | Document = document): T | null {
  return root.querySelector(getSelector(key)) as T | null;
}

/**
 * Query all matching elements as an array.
 */
export function queryAll<K extends SelectorKey, T extends Element = HTMLElement>(key: K, root: ParentNode | Document = document): T[] {
  return Array.from(root.querySelectorAll(getSelector(key))) as T[];
}

/**
 * Require an element to exist, otherwise throws an Error with context.
 */
export function required<K extends SelectorKey, T extends Element = HTMLElement>(
  key: K,
  context?: string,
  root: ParentNode | Document = document
): T {
  const el = query(key, root) as T | null;
  if (!el) {
    throw new Error(`Required element not found for selector '${getSelector(key)}'${context ? " (" + context + ")" : ""}`);
  }
  return el;
}

/**
 * Require textContent from an element, trimming and validating non-empty.
 */
export function requiredText(el: Element | null, context?: string): string {
  if (!el) {
    throw new Error(`Text requested from missing element${context ? " (" + context + ")" : ""}`);
  }
  const text = (el.textContent ?? "").trim();
  if (!text) {
    throw new Error(`Empty text content in element${context ? " (" + context + ")" : ""}`);
  }
  return text;
}

/**
 * Attempt to get trimmed text or return null if missing/empty.
 */
export function optionalText(el: Element | null): string | null {
  if (!el) return null;
  const t = (el.textContent ?? "").trim();
  return t.length ? t : null;
}

/* -------------------------------------------------------------------------- */
/* Specialized / Derived Queries                                              */
/* -------------------------------------------------------------------------- */

/**
 * Returns current "aria-valuetext" from the progress bar if present.
 */
export function getProgressValue(): string | null {
  const bar = query("progressBar");
  return bar?.getAttribute("aria-valuetext") ?? null;
}

/**
 * Detect if we are on any manage flow step by presence of confirm booking details or progress bar states.
 */
export function isInManageFlow(): boolean {
  return !!query("progressBar") || !!query("confirmBookingDetails");
}

/**
 * Count currently displayed test centre list items.
 */
export function countDisplayedTestCentres(): number {
  return queryAll("testCentreResultsListItems").length;
}

/**
 * Get all test centre detail link anchors.
 */
export function getTestCentreDetailLinks(): HTMLAnchorElement[] {
  return queryAll("testCentreDetailsLinks");
}

/**
 * Get bookable calendar date links as anchors.
 */
export function getBookableCalendarLinks(): HTMLAnchorElement[] {
  return queryAll("bookableCalendarLinks");
}

/**
 * Get active slot radio/checkbox inputs for time selection.
 */
export function getActiveSlotInputs(): HTMLInputElement[] {
  return queryAll("activeSlotInputs") as HTMLInputElement[];
}

/**
 * Quick check for captcha presence.
 */
export function detectCaptchaHeadline(): boolean {
  /* @ts-ignore */
  const mainIframe = document.querySelector("body #main-iframe") as HTMLIFrameElement | null;
  if (!mainIframe || !mainIframe.contentDocument) {
    console.debug("IsCaptcha: false (iframe or contentDocument missing)");
    return false;
  }
  const element = mainIframe.contentDocument.querySelector("body .error-headline") as HTMLElement | null;
  if (!element || typeof element.innerText !== "string") {
    console.debug("IsCaptcha: false (error-headline element or innerText missing)");
    return false;
  }
  const captcha = element.innerText.includes("Additional security check is required");
  console.debug("IsCaptcha:", captcha);
  return captcha;
}

/**
 * Quick check for "banned" (Incapsula) iframe heuristic.
 */
export function detectBannedIframe(): boolean {
  const iframe = query("bodyIframe");
  return !!iframe && (iframe.innerHTML || "").startsWith("Request unsuccessful. Incapsula incident ID:");
}

/**
 * Scan for "Search limit reached". (Potentially expensive: iterates all elements.)
 * Consider narrowing if performance becomes an issue.
 */
export function detectSearchLimitReached(): boolean {
  return [...document.querySelectorAll(getSelector("searchLimitTextAny"))].some((el) =>
    (el.textContent ?? "").includes("Search limit reached")
  );
}

/* -------------------------------------------------------------------------- */
/* Resilient Parsing Helpers                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Safely parse a date string (expected format dd/mm/yyyy). Returns null if invalid.
 */
export function parseDayMonthYear(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dd, mm, yyyy] = match;
  const day = Number(dd);
  const monthIndex = Number(mm) - 1;
  const year = Number(yyyy);
  const d = new Date(year, monthIndex, day);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Wrap arbitrary parsing logic with a try/catch to standardize error messages.
 */
export function safeParse<T>(label: string, fn: () => T): T | null {
  try {
    return fn();
  } catch (e) {
    console.warn(`[selectors.safeParse] Failed to parse '${label}':`, e);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Defensive Utilities                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Attempt a click on an element if it exists. Logs rather than throws.
 */
export function safeClick(el: Element | null, label?: string) {
  if (!el) {
    console.warn("safeClick: element missing", label ?? "");
    return;
  }
  (el as HTMLElement).click();
}

/**
 * Assert a condition for sanity checks in flows; throws with enriched context.
 */
export function assert(condition: any, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Example Usage (Documentation)                                              */
/* -------------------------------------------------------------------------- */
/*
import { required, requiredText, getProgressValue, detectCaptchaHeadline } from "./selectors";

function example() {
  if (detectCaptchaHeadline()) {
    console.log("Captcha encountered");
  }
  const progress = getProgressValue();
  console.log("Progress:", progress);

  const changeBtn = required("testCentreChangeButton", "Change Test Centre Button");
  changeBtn.click();

  const licenceInput = required("loginLicenceInput");
  licenceInput.focus();
}
*/
