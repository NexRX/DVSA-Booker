import { getTestDetails } from "@src/state";
import { click, simulateTyping } from "@src/logic/simulate";

export default async function onLogin() {
  const setting = await getTestDetails();

  if (!setting.driverLicence || !setting.driverTestReference) return;
  if (document.getElementById("unavailability-notice") != null) {
    // we should probably do something like reload at 6am or mayber a tad earlier for the queue?
    // also we should detect if we are in a queue
  }

  await simulateTyping("driving-licence-number", setting.driverLicence);
  await simulateTyping("application-reference-number", `${setting.driverTestReference}`);
  click("booking-login");
  // todo: hit login button
}
