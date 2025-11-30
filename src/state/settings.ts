import { StorageItem } from "webext-storage";
import { storage } from "./storage";

const SEVEN_MONTHS_MS = 7 * 30 * 24 * 60 * 60 * 1000;
export const TEST_DETAILS_KEY = "test-details";

export type TTestDetails = {
  version: 0;
  driverLicence?: string;
  driverTestReference?: number;
  searchPostcode?: string;
  minDate?: number;
  maxDate?: number;
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

const testDetailsDefaultV0 = {
  version: 0,
  driverLicence: undefined,
  driverTestReference: undefined,
  searchPostcode: undefined,
  minDate: Date.now(),
  maxDate: Date.now() + SEVEN_MONTHS_MS,
  allowMonday: true,
  allowTuesday: true,
  allowWednesday: true,
  allowThursday: true,
  allowFriday: true,
  allowSaturday: true,
  allowSunday: true,
  minHour: undefined,
  maxHour: undefined,
} as const;

export const initialTestDetails = testDetailsDefaultV0;

export const testDetails = new StorageItem<TTestDetails>(TEST_DETAILS_KEY, {
  defaultValue: initialTestDetails,
  area: storage,
});
