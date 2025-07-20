import type { JSX } from "solid-js/jsx-runtime";

export default function InputGroup(props: {
  name: string;
  children: JSX.Element;
}) {
  return (
    <div class="flex flex-row gap-4 w-full justify-center text-center">
      <span class="w-5/12 text-right self-center">
        {props.name}
        {":"}
      </span>
      {props.children}
    </div>
  );
}
