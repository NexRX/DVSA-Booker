import { ifNeededMigrate, storageNative } from "./storage";

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
  /** Seconds to wait before restarting if no progression */
  fallbackRestartSeconds?: number;
  enableInjectedUI: boolean;
  /** Whether to inject UI on security pages */
  dontInjectUIOnSecurityPages: boolean;
  /** Whether to inject UI on unknown pages */
  dontInjectUIOnUnknownPages: boolean;
};

const configDefaultV0: TConfig = {
  version: 0,
  timingRefresh: 300,
  timingSeeMore: 45,
  timingRandomizePercent: 33,
  showCentersMax: 12,
  fallbackRestartSeconds: 120,
  enableInjectedUI: true,
  dontInjectUIOnSecurityPages: true,
  dontInjectUIOnUnknownPages: false,
};

export const initialConfig = configDefaultV0;

export async function getConfig(): Promise<TConfig> {
  const config: TConfig = await storageNative.get<TConfig>(CONFIG_KEY, initialConfig);
  return await ifNeededMigrate(config, configDefaultV0, setConfig);
}

export async function setConfig(value: TConfig): Promise<void> {
  await storageNative.set<TConfig>(CONFIG_KEY, value);
}

export async function fallbackSeconds(): Promise<number | undefined> {
  return (await getConfig()).fallbackRestartSeconds;
}
