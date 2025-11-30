import { testDetails, config as Config, TTestDetails } from "@src/state";
import { ManageState } from "@src/state/search";
import { click, simulateTyping, wait } from "@src/logic/simulate";
import { waitUI } from ".";
import { sortSoonestDateElement, sortSoonestDate, parseTestDateTime } from "@src/logic/date";

export default async function onManage(state: ManageState) {
  const details = await testDetails.get();
  const config = await Config.get();
  await wait(100, 20);

  switch (state) {
    case "manage-view":
      click("test-centre-change");
      break;
    case "manage-select-center":
      await simulateTyping("test-centres-input", details.searchPostcode);
      await wait(20);
      click("test-centres-submit");
      break;
    case "manage-search-results":
      const testLinks = findTest(details);
      if (testLinks.length > 0) {
        const [date, link] = testLinks[0];
        console.debug("Found test!", date);
        click(link);
      } else {
        console.debug("No tests found");
        // const [seconds, wait] = getWaitTime(config.timingRefresh, config.timingRandomizePercent);
        // await wait(config.timingRefresh * 1000, config.timingRandomizePercent, true);
        await waitUI();
        click("fetch-more-centres");
      }
      break;
    case "manage-test-time":
      await clickTestDate();
      await clickTestTime();
      click("slot-chosen-submit");
      click("slot-warning-continue");
      break;
    case "manage-confirm-who-are-you":
      click("i-am-candidate");
      break;
    case "manage-confirm-changes-final":
      confirmIfConfigurationAllows();
      break;
    case "unknown":
      console.error("Unknown page");
      break;
  }
}
// returns an array of [date, link] tuples sorted by date
function findTest(details: TTestDetails) {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.test-centre-details-link")).filter((a) =>
    a.innerText.includes("available tests around")
  );

  const dateLinks = links.map((link) => {
    const match = link.innerText.match(/\d{2}\/\d{2}\/\d{4}/); // Regular expression to match dates in DD/MM/YYYY format
    if (!match) return null;
    // Parse date in dd/mm/yyyy format
    const [day, month, year] = match[0].split("/").map(Number);
    const date = new Date(year, month - 1, day);
    return [date, link] as const;
  });

  console.debug("Found test links and attempting sort:", dateLinks);
  const sortedDateLinks = dateLinks.filter(([date]) => date !== null).sort(sortSoonestDateElement);

  console.debug("Parsing min and max test dates", details.minDate, details.maxDate);
  const min = new Date(details.minDate);
  const max = new Date(details.maxDate);
  console.debug("Parsed min and max test dates", min, max);

  const filteredDateLinks = sortedDateLinks.filter(([date]) => date >= min && date <= max);
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
    return;
  }
  const [date, link] = sortedFilteredLinks[0];
  console.log("Clicking link:", link, date);
  click(link);
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
    return;
  }

  const [time, input] = parsedTimeLinks[0];
  console.log("Clicking time input:", input, time);
  click(input);
}

function findConfirmationTestDates() {
  const detailsSection = document.getElementById("confirm-booking-details");
  if (!detailsSection) {
    console.warn("Could not find confirm-booking-details section");
    return;
  }

  // Find the <dt> with text "Date and time of test" and its corresponding <dd>
  const dt = detailsSection.querySelector("dt");
  let targetDD: HTMLElement | null = null;

  if (dt && dt.textContent?.trim() === "Date and time of test") {
    let next = dt.nextElementSibling;
    while (next) {
      if (next.tagName.toLowerCase() === "dd") {
        targetDD = next as HTMLElement;
        break;
      }
      next = next.nextElementSibling;
    }
  } else {
    // If not found directly, search all dt elements
    const dtElements = detailsSection.querySelectorAll("dt");
    for (const dtElem of dtElements) {
      if (dtElem.textContent?.trim() === "Date and time of test") {
        let next = dtElem.nextElementSibling;
        while (next) {
          if (next.tagName.toLowerCase() === "dd") {
            targetDD = next as HTMLElement;
            break;
          }
          next = next.nextElementSibling;
        }
        if (targetDD) break;
      }
    }
  }

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

function findConfirmationTestLocations() {
  const detailsSection = document.getElementById("confirm-booking-details");
  if (!detailsSection) {
    console.warn("Could not find confirm-booking-details section");
    return;
  }

  // Find the <dt> with text "Date and time of test" and its corresponding <dd>
  const dt = detailsSection.querySelector("dt");
  let targetDD: HTMLElement | null = null;

  if (dt && dt.textContent?.trim() === "Test centre") {
    let next = dt.nextElementSibling;
    while (next) {
      if (next.tagName.toLowerCase() === "dd") {
        targetDD = next as HTMLElement;
        break;
      }
      next = next.nextElementSibling;
    }
  } else {
    // If not found directly, search all dt elements
    const dtElements = detailsSection.querySelectorAll("dt");
    for (const dtElem of dtElements) {
      if (dtElem.textContent?.trim() === "Driving test centre") {
        let next = dtElem.nextElementSibling;
        while (next) {
          if (next.tagName.toLowerCase() === "dd") {
            targetDD = next as HTMLElement;
            break;
          }
          next = next.nextElementSibling;
        }
        if (targetDD) break;
      }
    }
  }

  if (!targetDD) {
    console.warn("Could not find section with 'Test centre'");
    return null;
  }

  const rawHtml = targetDD.innerHTML;
  console.log("Raw HTML: ", rawHtml);

  // Parse new location: trim and get everything before <br>
  const newLocationMatch = rawHtml.match(/^([\s\S]*?)<br/i);
  const newLocation = newLocationMatch ? newLocationMatch[1].trim() : null;

  // Parse old location: match [was ...]
  const oldLocationMatch = rawHtml.match(/\[was ([^\]]+)\]/i);
  const oldLocation = oldLocationMatch ? oldLocationMatch[1].trim() : null;

  return { newLocation, oldLocation };
}

async function confirmIfConfigurationAllows() {
  const { newTestDate, oldTestDate } = findConfirmationTestDates();
  const { newLocation, oldLocation } = findConfirmationTestLocations();

  console.log("Test confirmation details:", { newTestDate, oldTestDate, newLocation, oldLocation });
}
