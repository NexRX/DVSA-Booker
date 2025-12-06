import { storageNative } from "./storage";

export const STATE_KEY = "state";

export type TState = {
  version: 0;
  enabled: boolean;
  currentTestDate?: number;
  currentTestLocation?: string;
};

export const initialState: TState = {
  version: 0,
  enabled: true,
  currentTestDate: undefined,
  currentTestLocation: undefined,
};

/**
 * Get the current state from browser storage.
 */
export async function getState(): Promise<TState> {
  return await storageNative.get<TState>(STATE_KEY, initialState);
}

/**
 * Set the state in browser storage.
 */
export async function setState(value: TState): Promise<void> {
  await storageNative.set<TState>(STATE_KEY, value);
}
