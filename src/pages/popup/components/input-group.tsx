import type { JSX } from "solid-js/jsx-runtime";

export default function InputGroup(props: { name: string; children: JSX.Element }) {
  return (
    <div class="flex flex-row w-full justify-center text-center gap-2">
      <span class="w-1/3 text-right self-center">
        {props.name}
        {":"}
      </span>
      <div class="flex w-2/3 gap-3">{props.children}</div>
    </div>
  );
}
