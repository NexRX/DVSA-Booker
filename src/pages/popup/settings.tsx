import { Component, JSX } from "solid-js";
import { settings, setSettings } from "@src/state/solid";
import InputGroup from "./components/input-group";
import TextBox from "./components/textbox";
import ToolTip from "./components/tooltip";
import drivingLicenceExample from "@assets/img/driving-licence-sample.jpg";

const Settings: Component = () => {
  return (
    <div class="flex flex-col gap-4">
      <InputGroup name="Drivers Licence">
        <ToolTip>
          This is on the front of your drivers licence, e.g. MORGA657054SM9IJ
          <img src={drivingLicenceExample}></img>
        </ToolTip>
        <TextBox
          value={settings().driverLicence}
          setter={(value) =>
            setSettings({ ...settings(), driverLicence: value })
          }
        />
      </InputGroup>
      <InputGroup name="Test Reference">
        <ToolTip>
          This number was given when you booked the test. It can be found on
          your confirmation. e.g. 72145638.
        </ToolTip>
        <TextBox
          value={settings().driverTestReference}
          numbersOnly
          setter={(value) =>
            setSettings({ ...settings(), driverTestReference: Number(value) })
          }
        />
      </InputGroup>
    </div>
  );
};

export default Settings;
