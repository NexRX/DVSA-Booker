import { useStore } from "nanostores-persistent-solid";
import {
  TState,
  TTestDetails,
  TSearch,
  TConfig,
  TEST_DETAILS_KEY,
  STATE_KEY,
  SEARCH_KEY,
  CONFIG_KEY,
  initialState,
  initialTestDetails,
  initialSearch,
  initialConfig,
} from "@src/state";
import { createStorageSignal } from "./storage";

export const [state, setState] = createStorageSignal<TState>(STATE_KEY, initialState);
export const [settings, setSettings] = createStorageSignal<TTestDetails>(TEST_DETAILS_KEY, initialTestDetails);
export const [search, setSearch] = createStorageSignal<TSearch>(SEARCH_KEY, initialSearch);
export const [config, setConfig] = createStorageSignal<TConfig>(CONFIG_KEY, initialConfig);
