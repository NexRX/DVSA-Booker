import { StorageItem } from "webext-storage";
import { storage } from "./storage";

const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;
export const TEST_DETAILS_KEY = "test-details";

export type TTestDetails = {
  version: 0;
  driverLicence?: string;
  driverTestReference?: number;
  searchPostcode?: string;
  minDate?: number;
  maxDate?: number;
  // minTime?: number;
  // maxTime?: number;
};

const testDetailsDefaultV0 = {
  version: 0,
  driverLicence: undefined,
  driverTestReference: undefined,
  searchPostcode: undefined,
  minDate: Date.now(),
  maxDate: Date.now() + SIX_MONTHS_MS,
  // minTime: undefined,
  // maxTime: undefined,
} as const;

export const initialTestDetails = testDetailsDefaultV0;

export const testDetails = new StorageItem<TTestDetails>(TEST_DETAILS_KEY, {
  defaultValue: initialTestDetails,
  area: storage,
});
