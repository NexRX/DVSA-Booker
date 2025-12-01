import { StorageItem } from "webext-storage";
import { storage } from "./storage";

export const CONFIG_KEY = "config";

export type TConfig = {
  version: 0;
  /** Interval seconds before refreshing after all centers loaded. */
  timingRefresh: number;
  /** Interval seconds between seeing more centers */
  timingSeeMore: number;
  /** Percentage to randomize timings to seem more human */
  timingRandomizePercent: number;
  /** Maximum number of centers to show */
  showCentersMax?: number;
};

const configDefaultV0 = {
  version: 0,
  timingRefresh: 300,
  timingSeeMore: 45,
  timingRandomizePercent: 33,
  showCentersMax: 12,
} as const;

export const initialConfig = configDefaultV0;

export const config = new StorageItem<TConfig>(CONFIG_KEY, {
  defaultValue: initialConfig,
  area: storage,
});
