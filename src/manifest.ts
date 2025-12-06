import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "../package.json";

const [major, minor, patch, label = "0"] = packageJson.version.replace(/[^\d.-]+/g, "").split(/[.-]/);

const FIREFOX = process.env.FIREFOX ? true : false;
const CHROME = !FIREFOX;

export default defineManifest({
  manifest_version: 3,
  name: packageJson.displayName ?? packageJson.name,
  version: `${major}.${minor}.${patch}.${label}`,
  description: packageJson.description,
  permissions: CHROME ? ["storage", "offscreen"] : ["storage"],
  action: {
    // @ts-ignore
    default_popup: "src/pages/popup/index.html",
    // @ts-ignore
    default_icon: "logo.png",
  },
  background: {
    // @ts-ignore
    service_worker: CHROME ? "src/pages/background/background.chrome.ts" : undefined,
    // @ts-ignore
    scripts: FIREFOX ? ["src/pages/background/background.firefox.ts"] : undefined,
  },
  web_accessible_resources: [
    {
      resources: ["assets/js/*.js", "assets/css/*.css", "assets/img/*", "assets/sounds/*.mp3", "background/*"],
      matches: ["*://*/*"],
    },
  ],
  content_scripts: [
    {
      matches: ["https://driverpracticaltest.dvsa.gov.uk/*", "https://example.com/*"], // Replace with your domain
      // @ts-ignore
      js: ["src/pages/content/index.ts"],
    },
  ],
  browser_specific_settings: {
    gecko: {
      id: "dvsa-test-booker@nexhub.co.uk",
      data_collection_permissions: {
        required: ["none"],
      },
    },
  },
});
