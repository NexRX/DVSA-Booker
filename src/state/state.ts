import { StorageItem } from "webext-storage";
import { storage } from "./storage";

export const STATE_KEY = "state";

export type TState = {
  version: 0;
  enabled: boolean;
};

const initialStateV0 = {
  version: 0,
  enabled: true,
} as const;

export const initialState = initialStateV0;

export const state = new StorageItem<TState>(STATE_KEY, {
  defaultValue: initialState,
  area: storage,
});
