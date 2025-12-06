import { useStore } from "nanostores-persistent-solid";
import {
  TState,
  TTestDetails,
  TSearch,
  TConfig,
  TSecurity,
  TUiShared,
  TEST_DETAILS_KEY,
  STATE_KEY,
  SEARCH_KEY,
  CONFIG_KEY,
  SECURITY_KEY,
  UI_SHARED_KEY,
  initialState,
  initialTestDetails,
  initialSearch,
  initialConfig,
  initialSecurity,
  initialUiShared,
} from "@src/state";
import { createStorageSignal } from "./storage";

export const [state, setState] = createStorageSignal<TState>(STATE_KEY, initialState);
export const [settings, setSettings] = createStorageSignal<TTestDetails>(TEST_DETAILS_KEY, initialTestDetails);
export const [search, setSearch] = createStorageSignal<TSearch>(SEARCH_KEY, initialSearch);
export const [config, setConfig] = createStorageSignal<TConfig>(CONFIG_KEY, initialConfig);
export const [securityState, setSecurityState] = createStorageSignal<TSecurity>(SECURITY_KEY, initialSecurity);
export const [uiShared, setUiShared] = createStorageSignal<TUiShared>(UI_SHARED_KEY, initialUiShared);
