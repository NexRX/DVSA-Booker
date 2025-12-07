import { getTestDetails, setMessage } from "@src/state";
import { click, simulateTyping } from "@src/logic/simulate";

export default async function onLogin() {
  const setting = await getTestDetails();

  if (!setting.driverLicence || !setting.driverTestReference) {
    setMessage("Please provide a valid driver's licence and test reference for auto login.");
    return false;
  }
  if (document.getElementById("unavailability-notice") != null) {
    return false;
  }

  await simulateTyping("driving-licence-number", setting.driverLicence);
  await simulateTyping("application-reference-number", `${setting.driverTestReference}`);
  click("booking-login");
  return true;
  // todo: hit login button
}
