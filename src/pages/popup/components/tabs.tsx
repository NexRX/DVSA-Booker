import { persistentAtom } from "nanostores-persistent-solid";
import { Component, JSX, createSignal, children, Show, For } from "solid-js";
import TabButton from "./tab-button";
import { useStore } from "nanostores-persistent-solid";

type TabsProps = {
  tabs: { label: string; content: JSX.Element }[];
  name?: string;
  initial?: string;
};

export const Tabs: Component<TabsProps> = (props) => {
  const active = persistentAtom<string>(
    `tab:${props.name ?? "popup"}:`,
    props.initial ?? props.tabs[0]?.label ?? "Home"
  );
  const activeIndex = useStore(active);
  return (
    <div class="flex flex-col w-full">
      <div class="flex gap-2 mb-2">
        <For each={props.tabs}>
          {(tab, _index) => (
            <TabButton
              label={tab.label}
              selectedTab={activeIndex}
              setSelectedTab={active.set}
            />
          )}
        </For>
      </div>
      <div class="bg-gray-800 rounded-b-lg p-4 min-h-[6rem] flex flex-col justify-center items-center">
        <For each={props.tabs}>
          {(tab, index) => (
            <Show when={activeIndex() === tab.label}>{tab.content}</Show>
          )}
        </For>
      </div>
    </div>
  );
};
