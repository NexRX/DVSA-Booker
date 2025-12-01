import { testDetails, getDaysAllowedNumberArray, config as Config, TTestDetails, state as appState } from "@src/state";
import { ManageState } from "@src/state/search";
import { click, simulateTyping, wait } from "@src/logic/simulate";
import { setMessage, waitUI } from ".";
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
import success from "@assets/sounds/success.mp3";
import warn from "@assets/sounds/warn.mp3";

export default async function onManage(state: ManageState) {
  const details = await testDetails.get();
  const config = await Config.get();
  await wait(100, 20);

  switch (state) {
    case "manage-view":
      let currentTestDate = parseTestDateTime(findBookingDetail("Last date to change or cancel", "backward").innerText);
      const currentTestLocation = findBookingDetail("Test centre", "h2>dd").innerText;
      appState.set({ ...(await appState.get()), currentTestDate: currentTestDate.getTime(), currentTestLocation });

      click("test-centre-change");
      break;
    case "manage-select-center":
      await simulateTyping("test-centres-input", details.searchPostcode);
      await wait(250);
      click("test-centres-submit");
      fallbackAfterAwhile();
      break;
    case "manage-search-results":
      const testLinks = await findTest(details);
      if (testLinks.length > 0) {
        const [_date, link, name] = testLinks[0];
        setMessage("Found test at " + name);
        play("success", false);
        click(link);
      } else {
        setMessage("No tests found, trying again soon");
        if (testCentersDisplayed() < config.showCentersMax) {
          setMessage("Searching for more centers momentarily");
          await waitUI(config.timingSeeMore);
          click("fetch-more-centres");
        } else {
          setMessage("Max centers reached, restarting search momentarily");
          await waitUI();
          click("test-centres-submit");
        }
      }
      fallbackAfterAwhile();
      break;
    case "manage-test-time":
      if ((await clickTestDate()) && (await clickTestTime())) {
        play("success", false);
        setMessage("Test date & time still available!");
        click("slot-chosen-submit");
        click("slot-warning-continue");
        break;
      }
      setMessage("Test date & time was taken before we could confirm");
      await waitUI(60, false);
      navigateTo("login");
      break;
    case "manage-confirm-who-are-you":
      fallbackAfterAwhile();
      play("success", false);
      click("i-am-candidate");
      break;
    case "manage-confirm-changes-final":
      if (isConfirmtionTestCenterQualifies()) {
        play(success, true);
        setMessage("Test center matches! Press confirm or cancel, in 9 minutes we will auto confirm");
        await waitUI(60 * 9, false);
        navigateTo("login");
      } else {
        play(warn, true);
        setMessage("Found a test center but it doesn't qualify, retrying again in 2 minutes");
        await waitUI(60 * 2, false);
        navigateTo("login");
      }
      break;
    case "unknown":
      fallbackAfterAwhile();
      break;
  }
}

function findCurrentTestDetails() {
  const details = findConfirmationTestDates();
  console.log("details", details);
}

// returns an array of [date, link] tuples sorted by date
async function findTest(details: TTestDetails) {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.test-centre-details-link")).filter((a) =>
    a.innerText.includes("available tests around")
  );

  const dateLinks = links.map((link) => {
    const name = (link.querySelector(".test-centre-details > span > h4") as HTMLElement | null)?.innerText;
    const match = link.innerText.match(/\d{2}\/\d{2}\/\d{4}/); // Regular expression to match dates in DD/MM/YYYY format
    if (!match) return null;
    // Parse date in dd/mm/yyyy format
    const [day, month, year] = match[0].split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return [date, link, name] as const;
  });

  console.debug("Found test links and attempting sort:", dateLinks);
  const sortedDateLinks = dateLinks.filter(([date]) => date !== null).sort(sortSoonestDateNamed);

  // Dates outside the range
  const min = new Date(details.minDate);
  const max = new Date(details.maxDate);
  // Days of the week that are not available (Monday, friday, etc)
  const allowedDays = await getDaysAllowedNumberArray();
  // Allowed test centers (should match case insensitive & starts with)
  const allowedCenters = (await details.allowedLocations) ?? [];

  const filteredDateLinks = sortedDateLinks
    .filter(([date]) => date >= min && date <= max) // Filter out dates outside the range
    .filter(([date]) => allowedDays.includes(date.getDay())) // filter out days of the week that are not available (Monday, friday, etc)
    .filter(
      ([_, __, name]) => allowedCenters.length === 0 || allowedCenters.some((center) => name.toLowerCase().startsWith(center.toLowerCase()))
    ); // Filter allowed test centers (should match case insensitive & starts with)

  console.debug("Filtered date links", filteredDateLinks);
  return filteredDateLinks;
}

export async function clickTestDate() {
  const bookableLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("td.BookingCalendar-date--bookable a.BookingCalendar-dateLink")
  );
  const setting = await testDetails.get();

  const min = new Date(setting.minDate);
  const max = new Date(setting.maxDate);

  console.log("Bookable links found:", bookableLinks);
  const sortedFilteredLinks = bookableLinks
    .map((link) => {
      let rawDate = link.getAttribute("data-date"); // parse date in format "yyyy-mm-dd"
      return [new Date(rawDate), link] as const;
    })
    .filter(([date]) => date >= min && date <= max)
    .sort(sortSoonestDateElement);

  if (sortedFilteredLinks.length === 0) {
    console.warn("No bookable links found within the specified date range");
    return false;
  }
  const [date, link] = sortedFilteredLinks[0];
  console.log("Clicking link:", link, date);
  click(link);
  return true;
}

async function clickTestTime() {
  const timeLinks = Array.from(document.querySelectorAll<HTMLInputElement>(".SlotPicker-day.is-active label input"));

  // Map over the array and parse the data-datetime-label attribute as a Date object
  const parsedTimeLinks = timeLinks
    .map((input) => {
      const label = input.getAttribute("data-datetime-label");
      if (!label) return null;
      const datetime = parseTestDateTime(label);
      return [datetime, input] as const;
    })
    .filter((item): item is [Date, HTMLInputElement] => item !== null)
    .sort((a, b) => a[0].getTime() - b[0].getTime());

  if (parsedTimeLinks.length === 0) {
    console.warn("No time links found");
    return false;
  }

  const [time, input] = parsedTimeLinks[0];
  console.log("Clicking time input:", input, time);
  click(input);
  return true;
}

async function isConfirmtionTestCenterQualifies() {
  const { newTestDate, oldTestDate } = findConfirmationTestDates();
  const { newLocation, oldLocation } = findConfirmationTestLocations();
  const allowedCenters = (await testDetails.get()).allowedLocations ?? [];

  const details = await testDetails.get();
  const isSooner = newTestDate < oldTestDate;
  const isWithinMinMaxDates = newTestDate >= new Date(details.minDate) && newTestDate <= new Date(details.maxDate);
  const isAllowedDayOfWeek = (await getDaysAllowedNumberArray()).includes(newTestDate.getDay());
  const isAllowedCenter =
    allowedCenters.length === 0 || allowedCenters.some((center) => newLocation.toLowerCase().startsWith(center.toLowerCase()));

  console.log(
    "Test confirmation details:",
    { newTestDate, oldTestDate, newLocation, oldLocation },
    { isSooner, isWithinMinMaxDates, isAllowedDayOfWeek, isAllowedCenter }
  );

  return isSooner && isWithinMinMaxDates && isAllowedDayOfWeek && isAllowedCenter;
}

// function isValidTestCandidate() {
//   const details = await testDetails.get();
//   const isSooner = newTestDate < oldTestDate;
//   const isWithinMinMaxDates = newTestDate >= new Date(details.minDate) && newTestDate <= new Date(details.maxDate);
//   const isAllowedDayOfWeek = (await getDaysAllowedNumberArray()).includes(newTestDate.getDay());
// }
