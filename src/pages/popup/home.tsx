import { Component, JSX } from "solid-js";
import Toggle from "./components/toggle";
import InputGroup from "./components/input-group";
import { state } from "@src/state/solid";
import { updateEnabled } from "@src/state";

const Home: Component = () => {
  return (
    <div class="flex flex-col gap-4">
      <InputGroup name="Enabled">
        <Toggle checked={state().enabled} setter={updateEnabled} />
      </InputGroup>
    </div>
  );
};

export default Home;
