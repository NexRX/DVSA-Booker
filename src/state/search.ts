import { StorageItem } from "webext-storage";
import { storage } from "@src/state/storage";
import { state } from "@src/state/state";
import { exists } from "@src/logic/dom";

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

async function detectState(path: string): Promise<TSearch["state"]> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (detectCaptcha()) return "captcha";
  else if (detectBanned()) return "banned";
  else if (path.startsWith("/login")) return "login";
  else if (path.startsWith("/manage")) {
    const manageState = detectManagedState();
    if (manageState !== "unknown") return manageState;
  }

  if ([...document.querySelectorAll("*")].some((el) => el.textContent?.includes("Search limit reached"))) return "search-limit";

  return "unknown";
}

export async function updatedState(path: string = window.location.pathname): Promise<TSearch["state"]> {
  const state = await detectState(path);
  await search.set({ ...(await search.get()), state });
  console.log("State:", state);
  return state;
}
function detectCaptcha() {
  const headline = document.querySelector(".headline-inner p");
  return headline && headline.textContent.includes("Additional security check is required");
}

function detectBanned() {
  const iframe = document.querySelector("body iframe");
  return iframe && iframe.innerHTML.startsWith("Request unsuccessful. Incapsula incident ID:");
}

function detectManagedState(): ManageState {
  let progress = document.querySelector("#progress-bar")?.getAttribute("aria-valuetext");

  const confirmBooking = document.querySelector("#confirm-booking-details");
  const finalConfirm =
    confirmBooking &&
    confirmBooking.textContent.includes(
      "You are about to make changes to your original booking. Details of the changes are highlighted below"
    );

  if (confirmBooking && !finalConfirm) return "manage-view" as const;
  else if (progress == "Step 0: Test centre" && !exists("#search-results")) return "manage-select-center" as const;
  else if (progress == "Step 0: Test centre" && exists("#search-results")) return "manage-search-results" as const;
  else if (progress == "Step 1: Test time" && exists("#chosen-test-centre")) return "manage-test-time" as const;
  else if (document.getElementById("i-am-candidate") && document.getElementById("i-am-not-candidate"))
    return "manage-confirm-who-are-you" as const;
  else if (confirmBooking && finalConfirm) return "manage-confirm-changes-final" as const;
  else return "unknown" as const;
}
