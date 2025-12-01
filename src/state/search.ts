import { StorageItem } from "webext-storage";

import { storage } from "@src/state/storage";

import { state } from "@src/state/state";

import { exists } from "@src/logic/dom";
import { detectCaptchaHeadline } from "@src/logic/selectors";

export const SEARCH_KEY = "search";

export type ManageState =
  | "manage-view"
  | "manage-select-center"
  | "manage-search-results"
  | "manage-test-time"
  | "manage-confirm-who-are-you"
  | "manage-confirm-changes-final"
  | "unknown";

export type TSearch = {
  version: 0;

  state: "login" | "banned" | "captcha" | "wait" | "queue" | "search-limit" | "unknown" | ManageState;
};

// Centralized DOM selectors for state detection (kept local to avoid creating a new file dependency)
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

// TODO: Implement detection of wait & queue

const searchDefaultV0 = {
  version: 0,

  state: "unknown",
} as const;

export const initialSearch = searchDefaultV0;

export const search = new StorageItem<TSearch>(SEARCH_KEY, {
  defaultValue: initialSearch,

  area: storage,
});

// Safe text-content includes utility (guards nulls)
function textIncludes(el: Element | null, needle: string) {
  return !!el && !!el.textContent && el.textContent.includes(needle);
}

async function detectState(path: string): Promise<TSearch["state"]> {
  // Allow DOM to settle slightly
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (detectCaptchaHeadline()) return "captcha";
  else if (detectBanned()) return "banned";
  else if (path.startsWith("/login")) return "login";
  else if (path.startsWith("/manage")) {
    const manageState = detectManagedState();

    if (manageState !== "unknown") return manageState;
  }

  // Search limit reached text can appear in various containers; brute-force scan is retained
  if ([...document.querySelectorAll("*")].some((el) => el.textContent?.includes("Search limit reached"))) return "search-limit";

  return "unknown";
}

export async function updatedState(path: string = window.location.pathname): Promise<TSearch["state"]> {
  const stateValue = await detectState(path);

  await search.set({ ...(await search.get()), state: stateValue });

  console.log("State:", stateValue);

  return stateValue;
}
function detectBanned() {
  const iframe = document.querySelector(SELECTORS.bannedIframe);
  return !!iframe && iframe.innerHTML.startsWith("Request unsuccessful. Incapsula incident ID:");
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
