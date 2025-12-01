/**
 * Refactored manage flow handling:
 *
 * This file exposes a handler map instead of a large switch statement.
 * Each manage-state is mapped to a focused async handler receiving a rich context.
 *
 * Benefits:
 *  - Easier to add / modify individual states.
 *  - Clear separation of concerns (DOM extraction, decision logic, side-effects).
 *  - Enables reuse from the higher-level content state machine (state-machine.ts).
 *
 * Default export `onManage(state)` still exists for backward compatibility with existing imports.
 */

import { testDetails, getDaysAllowedNumberArray, config as Config, TTestDetails, state as appState, state } from "@src/state";
import { ManageState } from "@src/state/search";
import { click, simulateTyping, wait } from "@src/logic/simulate";
import { setMessage, waitUI } from "./content-ui";
import { sortSoonestDateElement, sortSoonestDateNamed, parseTestDateTime } from "@src/logic/date";
import {
  findConfirmationTestDates,
  findConfirmationTestLocations,
  findBookingDetail,
  fallbackAfterAwhile,
  testCentersDisplayed,
} from "./on-manage-helpers";
import { navigateTo } from "@src/logic/navigation";
import { play } from "../background/exports";
import successSound from "@assets/sounds/success.mp3";
import warnSound from "@assets/sounds/warn.mp3";
import { SELECTORS, getBookableCalendarLinks, getActiveSlotInputs } from "@src/logic/selectors";

/* -------------------------------------------------------------------------- */
/* Handler Context                                                            */
/* -------------------------------------------------------------------------- */

interface ManageHandlerContext {
  state: ManageState;
  details: Awaited<ReturnType<typeof testDetails.get>>;
  config: Awaited<ReturnType<typeof Config.get>>;
  setMessage: (msg: string | undefined) => void;
  waitUI: (seconds?: number, randomize?: boolean) => Promise<void>;
  navigateToLogin: () => void;
  play: (soundUrl: string, loop?: boolean) => void;
  // Utility helpers reused by handlers
  clickTestDate: () => Promise<boolean>;
  clickTestTime: () => Promise<boolean>;
  isConfirmationQualifies: () => Promise<boolean>;
  findTests: (details: TTestDetails) => Promise<ReadonlyArray<readonly [Date, HTMLAnchorElement, string | undefined]>>;
}

/* -------------------------------------------------------------------------- */
/* Public Entry Point                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Backwards-compatible entry used by state machine.
 */
export default async function onManage(state: ManageState) {
  await runManageState(state);
}

/**
 * Main dispatcher: resolves handler or falls back.
 */
export async function runManageState(state: ManageState) {
  const details = await testDetails.get();
  const config = await Config.get();

  // Small natural delay to allow DOM to settle if navigation just occurred
  await wait(100, 20);

  const ctx: ManageHandlerContext = {
    state,
    details,
    config,
    setMessage,
    waitUI,
    navigateToLogin: () => navigateTo("login"),
    play: (sound, loop = false) => play(sound, loop),
    clickTestDate: internalClickTestDate,
    clickTestTime: internalClickTestTime,
    isConfirmationQualifies: internalIsConfirmationTestCenterQualifies,
    findTests: findTest,
  };

  const handler = manageHandlers[state] ?? manageHandlers.unknown;
  await handler(ctx);
}

/* -------------------------------------------------------------------------- */
/* Handler Map                                                                */
/* -------------------------------------------------------------------------- */

type ManageHandler = (ctx: ManageHandlerContext) => Promise<void>;

const manageHandlers: Record<ManageState | "unknown", ManageHandler> = {
  "manage-view": async (ctx) => {
    const lastChangeEl = findBookingDetail("Last date to change or cancel", "backward");
    const testCentreEl = findBookingDetail("Test centre", "h2>dd");

    if (!lastChangeEl || !testCentreEl) {
      ctx.setMessage("Unable to read current booking details, retrying soon");
      await fallbackAfterAwhile();
      return;
    }

    const parsedDate = parseTestDateTime(lastChangeEl.innerText);
    const currentLocation = testCentreEl.innerText;

    if (!parsedDate) {
      ctx.setMessage("Failed to parse current test date, will retry");
      await fallbackAfterAwhile();
      return;
    }

    // Persist current test meta in app state
    appState.set({
      ...(await appState.get()),
      currentTestDate: parsedDate.getTime(),
      currentTestLocation: currentLocation,
    });

    click("test-centre-change");
  },

  "manage-select-center": async (ctx) => {
    await simulateTyping("test-centres-input", ctx.details.searchPostcode ?? "");
    await wait(250);
    click("test-centres-submit");
    ctx.setMessage("Searching test centres...");
    await fallbackAfterAwhile();
  },

  "manage-search-results": async (ctx) => {
    const testLinks = await ctx.findTests(ctx.details);
    if (testLinks.length > 0) {
      const [_date, link, name] = testLinks[0];
      ctx.setMessage("Found test at " + name);
      ctx.play(successSound, true);
      click(link);
    } else {
      if (testCentersDisplayed() < (ctx.config.showCentersMax ?? 12)) {
        ctx.setMessage("No tests found, will expand search coverage...");
        await ctx.waitUI(ctx.config.timingSeeMore);
        click("fetch-more-centres");
      } else {
        ctx.setMessage("No tests found & max centres loaded, will restarting search...");
        await ctx.waitUI(); // uses config refresh timing
        click("test-centres-submit");
      }
    }
    await fallbackAfterAwhile();
  },

  "manage-test-time": async (ctx) => {
    const dateClicked = await ctx.clickTestDate();
    const timeClicked = dateClicked && (await ctx.clickTestTime());

    if (dateClicked && timeClicked) {
      ctx.play(successSound, true);
      ctx.setMessage("Test date & time selected, confirming...");
      click("slot-chosen-submit");
      click("slot-warning-continue");
      return;
    }

    ctx.setMessage("Slot vanished before confirmation, retrying in 60s");
    await ctx.waitUI(60, false);
    ctx.navigateToLogin();
  },

  "manage-confirm-who-are-you": async (ctx) => {
    ctx.play(successSound, true);
    ctx.setMessage("Confirming candidate identity");
    await fallbackAfterAwhile();
    click("i-am-candidate");
  },

  "manage-confirm-changes-final": async (ctx) => {
    const qualifies = await ctx.isConfirmationQualifies();
    if (qualifies) {
      const MINUTES = 9;
      ctx.play(successSound, true);
      ctx.setMessage(`Qualified test found! You have ${MINUTES} minutes before auto-return.`);
      await ctx.waitUI(60 * MINUTES, false);
      // TODO: When we find a test we actually want, change this to click("confirm")
      click("abandon");
      click("abandon-changes");
    } else {
      ctx.play(warnSound, true);
      ctx.setMessage("Found test but does not meet criteria. Retrying in 2 minutes.");
      await ctx.waitUI(60 * 0.1, false);
      click("abandon");
      click("abandon-changes");
    }
  },

  unknown: async (ctx) => {
    ctx.setMessage("Unknown manage state; will retry soon.");
    await fallbackAfterAwhile();
  },
};

/* -------------------------------------------------------------------------- */
/* Internal Helpers (Handlers rely on these)                                  */
/* -------------------------------------------------------------------------- */

/**
 * Find candidate date links for test centres and filter according to settings.
 * Returns sorted ascending by soonest date.
 */
async function findTest(details: TTestDetails) {
  const rawLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>(SELECTORS.testCentreDetailsLinks)).filter((a) =>
    a.innerText.includes("available tests around")
  );

  const dateLinks = rawLinks.map((link) => {
    const name = (link.querySelector(".test-centre-details > span > h4") as HTMLElement | null)?.innerText;
    const match = link.innerText.match(/\d{2}\/\d{2}\/\d{4}/);
    if (!match) return null;
    const [day, month, year] = match[0].split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return [date, link, name] as const;
  });

  console.debug("[on-manage] Raw test date links:", dateLinks);

  const sortedDateLinks = dateLinks.filter(Boolean).sort(sortSoonestDateNamed);

  const min = new Date(details.minDate ?? Date.now());
  const max = new Date(details.maxDate ?? Date.now() + 1000 * 60 * 60 * 24 * 180);
  const allowedDays = await getDaysAllowedNumberArray();
  const allowedCenters = details.allowedLocations ?? [];

  const onlyMatchSooner = (await testDetails.get()).onlyMatchSooner;
  const currentTestDate = onlyMatchSooner ? new Date((await state.get()).currentTestDate) : null;

  const filtered = sortedDateLinks
    .filter(([date, _, name]) => {
      const isWithinDateRange = date >= min && date <= max;
      if (!isWithinDateRange)
        console.debug(`[on-manage][filter] ${name} filtered out because ${date} is outside of range ${min} to ${max}`);
      return isWithinDateRange;
    })
    .filter(([date]) => {
      const isAllowedDay = allowedDays.includes(date.getDay());
      if (!isAllowedDay) console.debug(`[on-manage][filter] ${name} filtered out because ${date} is not on a allowed day`);
      return isAllowedDay;
    })
    .filter(([_, __, name]) => {
      const isAllowedCenter =
        allowedCenters.length === 0 ||
        (name ? allowedCenters.some((center) => name.toLowerCase().startsWith(center.toLowerCase())) : false);
      if (!isAllowedCenter) console.debug(`[on-manage][filter] ${name} filtered out because it is not a allowed center`);
      return isAllowedCenter;
    })
    .filter(([date, time]) => {
      if (!onlyMatchSooner) return true;
      const isSoonerThanCurrentTest = date < currentTestDate;
      console.debug(`[on-manage][filter] ${name} filtered out because ${date} is not sooner than current test date ${currentTestDate}`);
      return isSoonerThanCurrentTest;
    });

  console.debug("[on-manage] Filtered test date links:", filtered);
  return filtered;
}

/**
 * Attempt to click earliest acceptable test date in calendar.
 */
async function internalClickTestDate(): Promise<boolean> {
  const setting = await testDetails.get();
  const min = new Date(setting.minDate ?? Date.now());
  const max = new Date(setting.maxDate ?? Date.now() + 1000 * 60 * 60 * 24 * 180);

  const bookableLinks = getBookableCalendarLinks();
  console.log("[on-manage] Bookable calendar links found:", bookableLinks.length);

  const sortedFiltered = bookableLinks
    .map((link) => {
      const rawDate = link.getAttribute("data-date");
      return [rawDate ? new Date(rawDate) : new Date(NaN), link] as const;
    })
    .filter(([date]) => !isNaN(date.getTime()) && date >= min && date <= max)
    .sort(sortSoonestDateElement);

  if (sortedFiltered.length === 0) {
    console.warn("[on-manage] No valid bookable dates in range");
    return false;
  }

  const [date, anchor] = sortedFiltered[0];
  console.log("[on-manage] Selecting date:", date);
  click(anchor);
  return true;
}

/**
 * Click earliest available test time.
 */
async function internalClickTestTime(): Promise<boolean> {
  const timeInputs = getActiveSlotInputs();

  const parsed = timeInputs
    .map((input) => {
      const label = input.getAttribute("data-datetime-label");
      if (!label) return null;
      const datetime = parseTestDateTime(label);
      if (!datetime) return null;
      return [datetime, input] as const;
    })
    .filter((p): p is [Date, HTMLInputElement] => !!p)
    .sort((a, b) => a[0].getTime() - b[0].getTime());

  if (parsed.length === 0) {
    console.warn("[on-manage] No time slots found");
    return false;
  }

  const [time, input] = parsed[0];
  console.log("[on-manage] Selecting time:", time);
  click(input);
  return true;
}

/**
 * Evaluate final confirmation page data against configuration.
 */
async function internalIsConfirmationTestCenterQualifies(): Promise<boolean> {
  const dates = findConfirmationTestDates();
  const locations = findConfirmationTestLocations();

  if (!dates || !locations) {
    console.warn("[on-manage] Missing confirmation elements");
    return false;
  }

  const { newTestDate, oldTestDate } = dates;
  const { newLocation, oldLocation } = locations;

  if (!newTestDate || !oldTestDate || !newLocation) {
    console.warn("[on-manage] Incomplete confirmation data", { newTestDate, oldTestDate, newLocation, oldLocation });
    return false;
  }

  const onlyMatchSooner = (await testDetails.get()).onlyMatchSooner;

  const details = await testDetails.get();
  const allowedCenters = details.allowedLocations ?? [];
  const isSooner = !onlyMatchSooner || newTestDate < oldTestDate;
  const isWithinRange = newTestDate >= new Date(details.minDate ?? 0) && newTestDate <= new Date(details.maxDate ?? 0);
  const isAllowedDay = (await getDaysAllowedNumberArray()).includes(newTestDate.getDay());
  const isAllowedCenter =
    allowedCenters.length === 0 || allowedCenters.some((center) => newLocation.toLowerCase().startsWith(center.toLowerCase()));

  console.log("[on-manage] Final confirmation evaluation:", {
    newTestDate,
    oldTestDate,
    newLocation,
    oldLocation,
    isSooner,
    isWithinRange,
    isAllowedDay,
    isAllowedCenter,
  });

  return isSooner && isWithinRange && isAllowedDay && isAllowedCenter;
}

/* -------------------------------------------------------------------------- */
/* (Optional) Future Enhancements                                             */
/* -------------------------------------------------------------------------- */
/**
 * Ideas:
 *  - Introduce transition validation (ensure legal progression).
 *  - Add a 'retry budget' to prevent infinite loops on broken pages.
 *  - Persist last successful search timestamp to backoff more intelligently.
 *  - Emit analytics events (slots seen, slots clicked, centers expanded).
 */

/* -------------------------------------------------------------------------- */
/* End                                                                        */
/* -------------------------------------------------------------------------- */
