/**
 * Search State Management (Native Extension Storage)
 *
 * Purpose:
 *  Tracks the current search state, including login, captcha, banned, wait, queue, search-limit, and managed states.
 *  Uses browser.storage.local (or chrome.storage.local) for cross-browser compatibility (Chrome & Firefox).
 *
 * Usage:
 *  import { getSearch, setSearch, updatedState, ... } from "./search";
 */

export const SEARCH_KEY = "search";

export type ManageState =
  | "manage-view"
  | "manage-select-center"
  | "manage-search-results"
  | "manage-test-time"
  | "manage-confirm-who-are-you"
  | "manage-confirm-changes-final"
  | "unavailable"
  | "unknown";

export type TSearch = {
  version: 0;
  state: "login" | "banned" | "captcha" | "wait" | "queue" | "search-limit" | "unknown" | ManageState;
};

export const initialSearch: TSearch = {
  version: 0,
  state: "unknown",
};

/* -------------------------------------------------------------------------- */
/* Native Storage Helpers                                                     */
/* -------------------------------------------------------------------------- */

function getStorageApi() {
  // @ts-ignore
  return typeof browser !== "undefined" ? browser : chrome;
}

export async function getSearch(): Promise<TSearch> {
  const api = getStorageApi();
  const result = await api.storage.local.get(SEARCH_KEY);
  return result[SEARCH_KEY] ?? initialSearch;
}

export async function setSearch(value: TSearch): Promise<void> {
  const api = getStorageApi();
  await api.storage.local.set({ [SEARCH_KEY]: value });
}

/* -------------------------------------------------------------------------- */
/* Centralized DOM selectors for state detection                              */
/* -------------------------------------------------------------------------- */

const SELECTORS = {
  headlineInnerParagraph: ".headline-inner p",
  bannedIframe: "body iframe",
  progressBar: "#progress-bar",
  confirmBookingDetails: "#confirm-booking-details",
  searchResults: "#search-results",
  chosenTestCentre: "#chosen-test-centre",
  candidateYes: "#i-am-candidate",
  candidateNo: "#i-am-not-candidate",
};

/* -------------------------------------------------------------------------- */
/* Safe text-content includes utility (guards nulls)                          */
/* -------------------------------------------------------------------------- */

function textIncludes(el: Element | null, needle: string) {
  return !!el && !!el.textContent && el.textContent.includes(needle);
}

/* -------------------------------------------------------------------------- */
/* State Detection Logic                                                      */
/* -------------------------------------------------------------------------- */

async function detectState(path: string): Promise<TSearch["state"]> {
  // Allow DOM to settle slightly
  await new Promise((resolve) => setTimeout(resolve, 120));

  if (detectCaptchaHeadline()) return "captcha";
  else if (detectBanned()) return "banned";
  else if (document.getElementById("unavailability-notice")) return "unavailable";
  else if (path.startsWith("/login")) return "login";
  else if (path.startsWith("/manage")) {
    const manageState = detectManagedState();
    if (manageState !== "unknown") return manageState;
  }

  // Search limit reached text can appear in various containers; brute-force scan is retained
  if ([...document.querySelectorAll("*")].some((el) => el.textContent?.includes("Search limit reached"))) return "search-limit";

  return "unknown";
}

function detectCaptchaHeadline(): boolean {
  const el = document.querySelector(SELECTORS.headlineInnerParagraph);
  return textIncludes(el, "Additional security check is required");
}

function detectBanned(): boolean {
  const iframe = document.querySelector(SELECTORS.bannedIframe);
  return !!iframe && iframe.innerHTML.startsWith("Request unsuccessful. Incapsula incident ID:");
}

function exists(selector: string): boolean {
  return document.querySelector(selector) !== null;
}

function detectManagedState(): ManageState {
  const progress = document.querySelector(SELECTORS.progressBar)?.getAttribute("aria-valuetext") ?? undefined;

  const confirmBooking = document.querySelector(SELECTORS.confirmBookingDetails);
  const finalConfirm =
    !!confirmBooking &&
    textIncludes(confirmBooking, "You are about to make changes to your original booking. Details of the changes are highlighted below");

  // manage-view: on confirmation page before final confirmation (confirmBooking present, but not final confirm text)
  if (confirmBooking && !finalConfirm) return "manage-view";

  // Step 0 - select centre
  if (progress === "Step 0: Test centre" && !exists(SELECTORS.searchResults)) return "manage-select-center";
  if (progress === "Step 0: Test centre" && exists(SELECTORS.searchResults)) return "manage-search-results";

  // Step 1 - test time
  if (progress === "Step 1: Test time" && exists(SELECTORS.chosenTestCentre)) return "manage-test-time";

  // Who are you confirmation step
  if (document.getElementById(SELECTORS.candidateYes.slice(1)) && document.getElementById(SELECTORS.candidateNo.slice(1)))
    return "manage-confirm-who-are-you";

  // Final confirmation page
  if (confirmBooking && finalConfirm) return "manage-confirm-changes-final";

  return "unknown";
}

/* -------------------------------------------------------------------------- */
/* Public API                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Updates the search state based on current DOM and path.
 * Persists the new state in extension storage.
 */
export async function updatedState(path: string = window.location.pathname): Promise<TSearch["state"]> {
  const stateValue = await detectState(path);
  const current = await getSearch();
  await setSearch({ ...current, state: stateValue });
  console.log("State:", stateValue);
  return stateValue;
}
