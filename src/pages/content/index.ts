import { $settings, $state } from "@src/state";
import { STATE_LOADED } from "@src/state/chromeStorageEngine";
import { keepMount, onMount } from "nanostores";

$state.subscribe((v) => console.log("Listener: ", v));
