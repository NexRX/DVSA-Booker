import { settings } from "@src/state";
import { click, simulateTyping, wait } from "@src/utils";

export default async function onManage() {
  const setting = await settings.get();
  await wait(100, 20);

  switch (getManagedPage()) {
    case "view":
      click("test-centre-change");
      break;
    case "select-center":
      simulateTyping("test-centres-input", setting.searchPostcode);
      await wait(20);
      click("test-centres-submit");
      break;
    case "search-results":
      const testLinks = findTest();
      if (testLinks.length > 0) {
        const [date, link] = testLinks[0];
        console.debug("Found test!", date);
        click(link);
      } else {
        console.debug("No tests found");
        await wait(8000);
        click("fetch-more-centres");
      }
      break;
    case "test-time":
      await clickTestDate();
      break;
    case "unknown":
      console.error("Unknown page");
      break;
  }
}

function getManagedPage() {
  if (document.querySelector("#confirm-booking-details")) return "view" as const;
  else if (progress() == "Step 0: Test centre" && !exists("#search-results")) return "select-center" as const;
  else if (progress() == "Step 0: Test centre" && exists("#search-results")) return "search-results" as const;
  else if (progress() == "Step 1: Test time" && exists("#chosen-test-centre")) return "test-time" as const;
  else return "unknown" as const;
}

function progress() {
  return document.querySelector("#progress-bar").getAttribute("aria-valuetext");
}

function exists(query: string) {
  return document.querySelector(query) !== null;
}

// returns an array of [date, link] tuples sorted by date
function findTest() {
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("a.test-centre-details-link")).filter((a) =>
    a.innerText.includes("available tests around")
  );

  const dateLinks = links.map((link) => {
    const match = link.innerText.match(/\d{2}\/\d{2}\/\d{4}/); // Regular expression to match dates in DD/MM/YYYY format
    if (!match) return null;
    const date = new Date(match[0]);
    return [date, link] as const;
  });

  return dateLinks.filter(([date]) => date !== null).sort((a, b) => a[0].getTime() - b[0].getTime()); // Filter out null values and sort by date
}

export async function clickTestDate() {
  const bookableLinks = document.querySelectorAll<HTMLAnchorElement>("td.BookingCalendar-date--bookable a.BookingCalendar-dateLink");
  const setting = await settings.get();

  let [date, link] = Array.from(bookableLinks)
    .map((link) => {
      let rawDate = link.getAttribute("data-date"); // parse date in format "yyyy-mm-dd"
      return [new Date(rawDate), link] as const;
    })
    .filter(([date]) => date.getTime() >= setting.minDate && date.getTime() <= setting.maxDate)
    .sort((a, b) => a[0].getTime() - b[0].getTime())[0];
  click(link);
}
