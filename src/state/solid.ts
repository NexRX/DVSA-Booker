import { useStore } from "nanostores-persistent-solid";
import { $state, $settings } from "@src/state";
export const state = useStore($state);
export const settings = useStore($settings);
