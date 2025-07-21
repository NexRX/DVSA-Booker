import { StorageItem } from "webext-storage";
import { storage } from "./storage";

export type TSettings = {
  version: 0;
  loaded: boolean;
  driverLicence?: string;
  driverTestReference?: number;
  /** Interval seconds before refreshing after all centers loaded. */
  timingRefresh: number;
  /** Interval seconds between seeing more centers */
  timingSeeMore: number;
  /** Percentage to randomize timings to seem more human */
  timingRandomizePercent: number;
};

const settingsDefaultV0 = {
  version: 0,
  loaded: false,
  driverLicence: undefined,
  driverTestReference: undefined,
  timingRefresh: 60,
  timingSeeMore: 10,
  timingRandomizePercent: 33,
} as const;

export const initialSettings = settingsDefaultV0;

export const settings = new StorageItem<TSettings>("settings", {
  defaultValue: initialSettings,
  area: storage,
});
