import { testDetails, getDaysAllowedNumberArray, config as Config, TTestDetails, fallbackSeconds } from "@src/state";
import { parseTestDateTime, secondsToHumanReadable } from "@src/logic/date";
import { navigateTo } from "@src/logic/navigation";
import { setMessage } from "./content-ui";

/**
 * Centralized selectors for easier maintenance.
 * Add new selectors here instead of scattering raw strings.
 */
const SELECTORS = {
  confirmBookingDetailsId: "confirm-booking-details",
  testCentreResultsItems: ".test-centre-results > li",
} as const;

/**
 * Throws if the element is missing; improves early failure visibility compared to silent null checks.
 * Use in places where the DOM is expected to be in a specific state.
 */
export function requiredElement<T extends HTMLElement>(el: T | null, context: string): T {
  if (!el) {
    throw new Error(`Missing expected element: ${context}`);
  }
  return el;
}

// Helper to find the <dd> for a given <dt> label in #confirm-booking-details
export function findBookingDetail(
  label: string,
  find: "forward" | "backward" | "h2>dd" = "forward",
  section: string = SELECTORS.confirmBookingDetailsId
): HTMLElement | null {
  const detailsSection = document.getElementById(section);
  if (!detailsSection) {
    console.warn("Could not find section:", section);
    return null;
  }

  if (find == "h2>dd") {
    const h2Elements = detailsSection.querySelectorAll("h2");
    for (const h2Elem of h2Elements) {
      if (h2Elem.textContent?.trim() === label) {
        const contentChild = h2Elem.closest("section")?.querySelector(".contents")?.firstElementChild;
        if (contentChild) {
          const ddElem = contentChild.querySelector("dd");
          if (ddElem) {
            return ddElem as HTMLElement;
          }
        }
      }
    }
    return null;
  }

  const dtElements = detailsSection.querySelectorAll("dt");
  for (const dtElem of dtElements) {
    if (dtElem.textContent?.trim() === label) {
      let next = find === "forward" ? dtElem.nextElementSibling : dtElem.previousElementSibling;
      while (next) {
        if (next.tagName.toLowerCase() === "dd") {
          return next as HTMLElement;
        }
        next = next.nextElementSibling;
      }
    }
  }
  return null;
}

export function findConfirmationTestDates() {
  const targetDD = findBookingDetail("Date and time of test");
  if (!targetDD) {
    console.warn("Could not find section with 'Date and time of test'");
    return null;
  }
  const rawHtml = targetDD.innerHTML;
  const newDatetimeMatch = rawHtml.match(/^([^<]+)<br/i);
  const newTestDate = parseTestDateTime(newDatetimeMatch ? newDatetimeMatch[1].trim() : null);
  const oldDatetimeMatch = rawHtml.match(/\[was ([^\]]+)\]/i);
  const oldTestDate = parseTestDateTime(oldDatetimeMatch ? oldDatetimeMatch[1].trim() : null);
  return { newTestDate, oldTestDate };
}

export function findConfirmationTestLocations() {
  // Try both possible labels
  const targetDD = findBookingDetail("Test centre") || findBookingDetail("Driving test centre");
  if (!targetDD) {
    console.warn("Could not find section with 'Test centre'");
    return null;
  }
  const rawHtml = targetDD.innerHTML;
  const newLocationMatch = rawHtml.match(/^([\s\S]*?)<br/i);
  const newLocation = newLocationMatch ? newLocationMatch[1].trim() : null;
  const oldLocationMatch = rawHtml.match(/\[was ([^\]]+)\]/i);
  const oldLocation = oldLocationMatch ? oldLocationMatch[1].trim() : null;
  return { newLocation, oldLocation };
}

// Helper to check test date validity
export async function isValidTestDate(newTestDate: Date, details: TTestDetails) {
  const isWithinMinMaxDates = newTestDate >= new Date(details.minDate) && newTestDate <= new Date(details.maxDate);
  const isAllowedDayOfWeek = (await getDaysAllowedNumberArray()).includes(newTestDate.getDay());
  return isWithinMinMaxDates && isAllowedDayOfWeek;
}

export async function confirmIfConfigurationAllows() {
  const { newTestDate, oldTestDate } = findConfirmationTestDates() || {};
  const { newLocation, oldLocation } = findConfirmationTestLocations() || {};
  if (!newTestDate || !oldTestDate) {
    console.warn("Missing test dates for confirmation");
    return;
  }
  const details = await testDetails.get();
  const isSooner = newTestDate < oldTestDate;
  const isValid = await isValidTestDate(newTestDate, details);

  console.log("Test confirmation details:", { newTestDate, oldTestDate, newLocation, oldLocation }, { isSooner, isValid });
}

export async function fallbackAfterAwhile() {
  const seconds = await fallbackSeconds();
  const duration = secondsToHumanReadable(seconds);
  setMessage(`Will auto retry if we haven't navigated in ${duration} (${seconds} seconds)`);
}

export function testCentersDisplayed() {
  return document.querySelectorAll(SELECTORS.testCentreResultsItems).length;
}
