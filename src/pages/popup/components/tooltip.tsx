import { createSignal, onCleanup } from "solid-js";
import type { JSX } from "solid-js/jsx-runtime";

export type ToolTipProps = {
  children: JSX.Element;
  class?: string;
  maxWidthClass?: string; // Tailwind max-w class, e.g. "max-w-lg"
};

export default function ToolTip(props: ToolTipProps) {
  const [hovered, setHovered] = createSignal(false);
  const [position, setPosition] = createSignal<"center" | "left" | "right">("center");
  const [safeWidth, setSafeWidth] = createSignal<string | undefined>(undefined);
  let tooltipRef: HTMLDivElement | undefined;
  let iconRef: HTMLSpanElement | undefined;

  function adjustPosition() {
    if (!tooltipRef || !iconRef) return;
    const tooltipRect = tooltipRef.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const margin = 16; // px

    // Clamp width if tooltip would overflow viewport
    if (tooltipRect.width > viewportWidth - margin) {
      setSafeWidth(`${viewportWidth - margin}px`);
    } else {
      setSafeWidth(undefined);
    }

    if (tooltipRect.left < 0) {
      setPosition("left");
    } else if (tooltipRect.right > viewportWidth) {
      setPosition("right");
    } else {
      setPosition("center");
    }
  }

  function handleMouseEnter() {
    setHovered(true);
    setTimeout(adjustPosition, 0);
  }

  function handleResize() {
    if (hovered()) setTimeout(adjustPosition, 0);
  }

  window.addEventListener("resize", handleResize);
  onCleanup(() => window.removeEventListener("resize", handleResize));

  // Use provided maxWidthClass or default to max-w-lg
  const maxWidthClass = props.maxWidthClass ?? "max-w-lg";

  return (
    <span ref={iconRef} class={`relative inline-flex items-center ${props.class ?? ""}`}>
      <span
        class="cursor-pointer text-white hover:text-blue-700 bg-slate-500 rounded-full w-[18px] h-[18px] border border-blue-500 mt-[2px]"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setHovered(false)}
        tabIndex={0}
        aria-label="Show help"
      >
        <div class="-mt-1">?</div>
      </span>
      {hovered() && (
        <div
          ref={tooltipRef}
          class={`absolute z-10 bottom-full mb-2 px-3 py-2 rounded bg-gray-800 text-white text-xs shadow-lg whitespace-normal break-words border border-slate-600/65 min-w-28 ${maxWidthClass}
            ${position() === "center" ? "left-1/2 -translate-x-1/2" : position() === "left" ? "left-0" : "right-0"}
          `}
          style={safeWidth() ? { width: safeWidth() } : undefined}
        >
          {props.children}
        </div>
      )}
    </span>
  );
}
