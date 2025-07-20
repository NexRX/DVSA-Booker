import { persistentMap } from "nanostores-persistent-solid";

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

export const $settings = persistentMap<TSettings>(
  "settings:",
  settingsDefaultV0,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);
