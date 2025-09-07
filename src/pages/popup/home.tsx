import { Component, JSX, Show } from "solid-js";
import Toggle from "./components/toggle";
import InputGroup from "./components/input-group";
import { state, setState } from "@src/state/solid";
import Button from "./components/button";
import { navigateTo } from "@src/logic/navigation";

const Home: Component = () => {
  return (
    <div class="flex flex-col gap-4">
      <InputGroup name="Enabled">
        <Toggle checked={state().enabled} setter={(enabled) => setState({ ...state(), enabled })} />
      </InputGroup>
      <Button onClick={() => navigateTo("login", true)}>Open DVSA Booking</Button>
    </div>
  );
};

export default Home;
