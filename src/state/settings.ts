/**
 * Test Details State (Settings)
 *
 * Ported to use native browser storage API (browser.storage.local/chrome.storage.local)
 * for compatibility with both Chrome and Firefox extensions.
 */

const SEVEN_MONTHS_MS = 7 * 30 * 24 * 60 * 60 * 1000;
export const TEST_DETAILS_KEY = "test-details";

export type TTestDetails = {
  version: 0;
  driverLicence?: string;
  driverTestReference?: number;
  searchPostcode?: string;
  minDate?: number;
  maxDate?: number;
  onlyMatchSooner?: boolean;
  allowedLocations?: string[];
  allowMonday?: boolean;
  allowTuesday?: boolean;
  allowWednesday?: boolean;
  allowThursday?: boolean;
  allowFriday?: boolean;
  allowSaturday?: boolean;
  allowSunday?: boolean;
  minHour?: number;
  maxHour?: number;
};

export const initialTestDetails: TTestDetails = {
  version: 0,
  driverLicence: undefined,
  driverTestReference: undefined,
  searchPostcode: undefined,
  minDate: Date.now(),
  maxDate: Date.now() + SEVEN_MONTHS_MS,
  onlyMatchSooner: true,
  allowedLocations: undefined,
  allowMonday: true,
  allowTuesday: true,
  allowWednesday: true,
  allowThursday: true,
  allowFriday: true,
  allowSaturday: true,
  allowSunday: true,
  minHour: undefined,
  maxHour: undefined,
};

/**
 * Helper for native extension storage (browser/chrome)
 */
const storageNative = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    // @ts-ignore
    const api = typeof browser !== "undefined" ? browser : chrome;
    const result = await api.storage.local.get(key);
    return result[key] ?? defaultValue;
  },
  async set<T>(key: string, value: T): Promise<void> {
    // @ts-ignore
    const api = typeof browser !== "undefined" ? browser : chrome;
    await api.storage.local.set({ [key]: value });
  },
};

/**
 * Get the current test details state.
 */
export async function getTestDetails(): Promise<TTestDetails> {
  return await storageNative.get<TTestDetails>(TEST_DETAILS_KEY, initialTestDetails);
}

/**
 * Set the test details state.
 */
export async function setTestDetails(value: TTestDetails): Promise<void> {
  await storageNative.set<TTestDetails>(TEST_DETAILS_KEY, value);
}

/**
 * Get array of allowed days as numbers (0=Sunday, 1=Monday, ..., 6=Saturday)
 */
export async function getDaysAllowedNumberArray(): Promise<number[]> {
  const details = await getTestDetails();
  const daysAllowed = [
    details.allowSunday ? 0 : null,
    details.allowMonday ? 1 : null,
    details.allowTuesday ? 2 : null,
    details.allowWednesday ? 3 : null,
    details.allowThursday ? 4 : null,
    details.allowFriday ? 5 : null,
    details.allowSaturday ? 6 : null,
  ].filter((day) => day !== null) as number[];

  return daysAllowed;
}
