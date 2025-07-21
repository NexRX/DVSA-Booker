import { Component, JSX } from "solid-js";
import Toggle from "./components/toggle";
import InputGroup from "./components/input-group";
import { state, setState } from "@src/state/solid";

const Home: Component = () => {
  return (
    <div class="flex flex-col gap-4">
      <InputGroup name="Enabled">
        <Toggle
          checked={state().enabled}
          setter={(enabled) => setState({ ...state(), enabled })}
        />
      </InputGroup>
    </div>
  );
};

export default Home;
