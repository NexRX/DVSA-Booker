export function dateToDisplay(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function getYMD(dateOrMs: Date | number): string {
  const date = typeof dateOrMs === "number" ? new Date(dateOrMs) : dateOrMs;

  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return "2020-01-01"; // default fallback
  }

  const year = date.getFullYear();
  if (year < 1000 || year > 9999) {
    return "2020-01-01"; // prevent malformed year values
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function sortSoonestDateElement(a: readonly [Date, HTMLElement], b: readonly [Date, HTMLElement]): number {
  return sortSoonestDate(a[0], b[0]);
}

export function sortSoonestDateNamed(a: readonly [Date, HTMLElement, string], b: readonly [Date, HTMLElement, string]): number {
  return sortSoonestDate(a[0], b[0]);
}

/** Sort by date first, then by time  */
export function sortSoonestDate(dateA: Date, dateB: Date): number {
  if (dateA.toDateString() === dateB.toDateString()) {
    return dateA.getTime() - dateB.getTime(); // sort by time if same day
  }
  return dateA.getTime() - dateB.getTime(); // sort by date
}

export function parseTestDateTime(dateStr) {
  // Example: "Wednesday 1 April 2026 1:25pm"
  const regex = /^([A-Za-z]+)\s+(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s+(\d{1,2}):(\d{2})(am|pm)$/i;
  const match = dateStr.match(regex);
  if (!match) return null;

  // match[1]: Day name (ignored)
  // match[2]: Day of month
  // match[3]: Month name
  // match[4]: Year
  // match[5]: Hour
  // match[6]: Minute
  // match[7]: am/pm

  const day = parseInt(match[2], 10);
  const monthNames = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const month = monthNames.indexOf(match[3].toLowerCase());
  if (month === -1) return null;

  let hour = parseInt(match[5], 10);
  const minute = parseInt(match[6], 10);
  const ampm = match[7].toLowerCase();

  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  return new Date(match[4], month, day, hour, minute);
}
