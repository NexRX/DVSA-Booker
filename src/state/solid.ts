import { useStore } from "nanostores-persistent-solid";
import { initialState, initialSettings, TState, TSettings } from "@src/state";
import { createStorageSignal } from "./storage";

export const [state, setState] = createStorageSignal<TState>(
  "state",
  initialState
);
export const [settings, setSettings] = createStorageSignal<TSettings>(
  "settings",
  initialSettings
);
