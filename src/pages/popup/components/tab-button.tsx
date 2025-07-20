import { Accessor, Component, Setter } from "solid-js";

type TabButtonProps = {
  label: string;
  selectedTab: Accessor<string>;
  setSelectedTab: (newvalue: string) => void;
};

const TabButton: Component<TabButtonProps> = (props: TabButtonProps) => {
  return (
    <button
      class="px-4 py-2 rounded-t-lg bg-gray-600 hover:bg-gray-500 focus:bg-gray-800 font-semibold cursor-pointer"
      classList={{
        "bg-gray-800": props.selectedTab() === props.label,
        "bg-gray-600": props.selectedTab() !== props.label,
      }}
      onClick={() => props.setSelectedTab(props.label)}
    >
      {props.label}
    </button>
  );
};

export default TabButton;
