import { StorageItem } from "webext-storage";
import { storage } from "./storage";

export type TState = {
  version: 0;
  enabled: boolean;
};

const initialStateV0 = {
  version: 0,
  enabled: true,
} as const;

export const initialState = initialStateV0;

export const state = new StorageItem<TState>("state", {
  defaultValue: initialState,
  area: storage,
});
