import { StorageItem } from "webext-storage";
import { storage } from "./storage";

export type TSettings = {
  version: 0;
  driverLicence?: string;
  driverTestReference?: number;
  searchPostcode?: string;
  minDate?: number;
  maxDate?: number;
  /** Interval seconds before refreshing after all centers loaded. */
  timingRefresh: number;
  /** Interval seconds between seeing more centers */
  timingSeeMore: number;
  /** Percentage to randomize timings to seem more human */
  timingRandomizePercent: number;
};

const settingsDefaultV0 = {
  version: 0,
  driverLicence: undefined,
  driverTestReference: undefined,
  searchPostcode: undefined,
  minDate: Date.now(),
  maxDate: Date.now() + 365 * 24 * 60 * 60 * 1000, // 1 year from now
  timingRefresh: 60,
  timingSeeMore: 10,
  timingRandomizePercent: 33,
} as const;

export const initialSettings = settingsDefaultV0;

export const settings = new StorageItem<TSettings>("settings", {
  defaultValue: initialSettings,
  area: storage,
});
