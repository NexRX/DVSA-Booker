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
