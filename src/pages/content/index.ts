import { state } from "@src/state";
import onLogin from "./on-login";
import onManage from "./on-manage";
import { navigateTo } from "@src/utils";

if ((await state.get()).enabled) {
  console.log("DVSA Booker Enabled & Routing");
  const path = window.location.pathname;

  if (path.startsWith("/login")) onLogin();
  if (path == "/manage") onManage();
  else {
    console.log("Error", "Unknown page returning to homepage in 65 seconds");
    // setTimeout(() => navigateTo("login"), 65);
  }
}
