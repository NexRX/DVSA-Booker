import type { JSX } from "solid-js/jsx-runtime";

export default function Button(props: { onClick?: (e: MouseEvent) => void; children: JSX.Element; class?: string }) {
  return (
    <button
      type="button"
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
      classList={{ [props.class ?? ""]: !!props.class }}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
