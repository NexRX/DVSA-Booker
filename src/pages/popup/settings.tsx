import { Component, For, JSX } from "solid-js";
import { settings, setSettings } from "@src/state/solid";
import InputGroup from "./components/input-group";
import TextBox from "./components/textbox";
import ToolTip from "./components/tooltip";
import drivingLicenceExample from "@assets/img/driving-licence-sample.jpg";
import { getYMD } from "@src/logic/date";
import Toggle from "./components/toggle";

const Settings: Component = () => {
  return (
    <div class="flex flex-col gap-4 w-full">
      <InputGroup name="Drivers Licence">
        <ToolTip>
          This is on the front of your drivers licence, e.g. MORGA657054SM9IJ
          <img src={drivingLicenceExample}></img>
        </ToolTip>
        <TextBox value={settings().driverLicence} setter={(value) => setSettings({ ...settings(), driverLicence: value })} />
      </InputGroup>
      <InputGroup name="Test Reference">
        <ToolTip>This number was given when you booked the test. It can be found on your confirmation. e.g. 72145638.</ToolTip>
        <TextBox
          value={settings().driverTestReference}
          numbersOnly
          setter={(value) => setSettings({ ...settings(), driverTestReference: Number(value) })}
        />
      </InputGroup>
      <InputGroup name="Search Postcode">
        <ToolTip>The postcode of the location you want to search around i.e. your home postcode.</ToolTip>
        <TextBox value={settings().searchPostcode} setter={(value) => setSettings({ ...settings(), searchPostcode: value })} />
      </InputGroup>
      <InputGroup name="Minimum Test Date">
        <ToolTip>The minimum date you want to search for test availability.</ToolTip>
        <TextBox
          value={getYMD(settings().minDate)}
          dateOnly
          setter={(value) => setSettings({ ...settings(), minDate: new Date(value).getTime() })}
        />
      </InputGroup>
      <InputGroup name="Maximum Test Date">
        <ToolTip>The maximum date you want to search for test availability.</ToolTip>
        <TextBox
          value={getYMD(settings().maxDate)}
          dateOnly
          setter={(value) => setSettings({ ...settings(), maxDate: new Date(value).getTime() })}
        />
      </InputGroup>
      <InputGroup name="Test Centers">
        <ToolTip>
          Comma-separated list of test center names. Names are case insensitive and only has to match the beginning of the center name i.e.
          'isle' matches 'Isleworth (Fleming Way)'.
        </ToolTip>
        <TextBox
          value={settings().allowedLocations?.join(",")}
          setter={(value) => setSettings({ ...settings(), allowedLocations: value.split(",").map((loc) => loc.trim()) })}
        />
      </InputGroup>
      <InputGroup name="Days of Week">
        <ToolTip>Select the days of the week you want to include in your search.</ToolTip>
        <div class="flex flex-wrap gap-2 max-w-52">
          <For each={["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]}>
            {(day) => (
              <label class="flex items-center gap-1" id={`allow-day-${day}`}>
                <input
                  type="checkbox"
                  checked={settings()[`allow${day}`] ?? false}
                  onChange={(e) => {
                    setSettings({ ...settings(), [`allow${day}`]: e.currentTarget.checked });
                  }}
                />
                {day}
              </label>
            )}
          </For>
        </div>
      </InputGroup>
      <InputGroup name="Only Match Sooner Tests">
        <ToolTip>
          If a test is found that matches all other conditions but is not sooner than the current detected test then it will be ignored if
          this is ticked.
        </ToolTip>
        <Toggle checked={settings().onlyMatchSooner} setter={(enabled) => setSettings({ ...settings(), onlyMatchSooner: enabled })} />
      </InputGroup>
    </div>
  );
};

export default Settings;
