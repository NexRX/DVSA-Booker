import { Component, JSX, Show } from "solid-js";
import Toggle from "./components/toggle";
import InputGroup from "./components/input-group";
import { state, setState } from "@src/state/solid";
import Button from "./components/button";
import { navigateTo } from "@src/logic/navigation";

const Home: Component = () => {
  const FALLBACK = "Unknown (Visit Booking Details Page)";
  return (
    <div class="flex flex-col gap-4 w-full">
      <InputGroup name="Enabled">
        <Toggle checked={state().enabled} setter={(enabled) => setState({ ...state(), enabled })} />
      </InputGroup>
      <InputGroup name="Current Test Location (Detected)">
        <p class="text-center content-center">{state().currentTestLocation ? state().currentTestLocation : FALLBACK}</p>
      </InputGroup>
      <InputGroup name="Current Test Date (Detected)">
        <p class="text-center content-center">
          {(() => {
            if (!state().currentTestDate) return FALLBACK;
            const date = new Date(state().currentTestDate);
            const dayName = date.toLocaleDateString(undefined, { weekday: "long" });
            const day = date.getDate();
            const ordinal = getOrdinal(day);
            const month = date.toLocaleDateString(undefined, { month: "long" });
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, "0");
            const minutes = date.getMinutes().toString().padStart(2, "0");
            return `${dayName} ${day}${ordinal} ${month} ${year} @ ${hours}:${minutes}`;
          })()}
        </p>
      </InputGroup>

      <Button onClick={() => navigateTo("login", true)}>Open DVSA Booking</Button>
    </div>
  );
};

export default Home;

function getOrdinal(n: number) {
  if (n > 3 && n < 21) return "th";
  switch (n % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}
