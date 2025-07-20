import { Accessor, createSignal, Setter } from "solid-js";

export type ToggleProps = {
  checked: boolean;
  setter: (enabled: boolean) => void;
};

export default function Toggle(props: ToggleProps) {
  return (
    <label
      class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
        props.checked ? "bg-blue-600" : "bg-gray-300"
      }`}
    >
      <input
        type="checkbox"
        checked={props.checked}
        onChange={(e) => {
          props.setter(e.currentTarget.checked);
        }}
        class="sr-only"
        name="toggleSwitch"
        aria-pressed={props.checked}
      />
      <span
        class={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
          props.checked ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </label>
  );
}
