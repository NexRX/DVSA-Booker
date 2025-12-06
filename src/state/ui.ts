import { fsync } from "node:fs";
import { ifNeededMigrate, storageNative } from "./storage";

export const UI_SHARED_KEY = "ui-shared";

export type TUiShared = {
  version: 0;
  message: string;
  waitingSeconds?: number;
  isPaused?: boolean;
};

const uiSharedDefaultV0: TUiShared = {
  version: 0,
  message: "idle...",
  waitingSeconds: undefined,
  isPaused: false,
};

export const initialUiShared = uiSharedDefaultV0;

export async function getUiShared(): Promise<TUiShared> {
  const uiShared: TUiShared = await storageNative.get<TUiShared>(UI_SHARED_KEY, initialUiShared);
  return await ifNeededMigrate(uiShared, initialUiShared, setUiShared);
}

export async function setUiShared(value: TUiShared): Promise<void> {
  await storageNative.set<TUiShared>(UI_SHARED_KEY, value);
}

export async function setMessage(message: string): Promise<void> {
  await setUiShared({ ...(await getUiShared()), message });
}

export async function setWaitingSeconds(waitingSeconds: number | undefined): Promise<void> {
  await setUiShared({ ...(await getUiShared()), waitingSeconds });
}

export async function setIsPaused(isPaused: boolean): Promise<void> {
  await setUiShared({ ...(await getUiShared()), isPaused });
}

export async function getWaitingSeconds(): Promise<number | undefined> {
  return (await getUiShared()).waitingSeconds;
}

export async function getIsPaused(): Promise<boolean> {
  return (await getUiShared()).isPaused ?? false;
}
