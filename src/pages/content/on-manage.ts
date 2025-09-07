import { testDetails, config as Config } from "@src/state";
import { ManageState } from "@src/state/search";
import { click, simulateTyping, wait } from "@src/logic/simulate";
import { waitUI } from ".";

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
      const testLinks = findTest();
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
      break;
    case "unknown":
      console.error("Unknown page");
      break;
  }
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
  const setting = await testDetails.get();

  let [date, link] = Array.from(bookableLinks)
    .map((link) => {
      let rawDate = link.getAttribute("data-date"); // parse date in format "yyyy-mm-dd"
      return [new Date(rawDate), link] as const;
    })
    .filter(([date]) => date.getTime() >= setting.minDate && date.getTime() <= setting.maxDate)
    .sort((a, b) => a[0].getTime() - b[0].getTime())[0];
  click(link);
}
