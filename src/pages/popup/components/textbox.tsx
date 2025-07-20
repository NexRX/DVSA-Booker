import { JSX, Component, splitProps, Accessor } from "solid-js";

type TextBoxProps<T extends string | number> = {
  icon?: JSX.Element;
  value: T;
  setter: (value: string) => void;
  placeholder?: string;
  class?: string;
  numbersOnly?: boolean;
};

export default function TextBox<T extends string | number>(
  props: TextBoxProps<T>
) {
  const [local, rest] = splitProps(props, [
    "icon",
    "value",
    "placeholder",
    "setter",
    "class",
    "numbersOnly",
  ]);
  const handleInput = (e: Event) => {
    let value = (e.currentTarget as HTMLInputElement).value;
    if (local.numbersOnly) {
      // Remove all non-digit characters
      const filtered = value.replace(/\D/g, "");
      local.setter(filtered);
    } else {
      local.setter(value);
    }
  };
  return (
    <div
      class={`flex items-center border rounded-lg px-3 py-2 bg-white shadow-sm focus-within:ring-2 focus-within:ring-blue-500 ${
        local.class ?? ""
      }`}
    >
      {local.icon && (
        <span class="mr-2 text-gray-400 flex items-center">{local.icon}</span>
      )}
      <input
        type={props.numbersOnly ? "number" : "text"}
        value={
          local.numbersOnly
            ? String(local.value).replace(/\D/g, "")
            : local.value
        }
        placeholder={local.placeholder}
        onInput={handleInput}
        class="outline-none bg-transparent flex-1 text-gray-800 placeholder-gray-400"
        {...rest}
      />
    </div>
  );
}
