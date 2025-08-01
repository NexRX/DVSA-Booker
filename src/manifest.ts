import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "../package.json";

const [major, minor, patch, label = "0"] = packageJson.version.replace(/[^\d.-]+/g, "").split(/[.-]/);

export default defineManifest({
  manifest_version: 3,
  name: packageJson.displayName ?? packageJson.name,
  version: `${major}.${minor}.${patch}.${label}`,
  description: packageJson.description,
  permissions: ["storage", "offscreen"],
  action: {
    // @ts-ignore
    default_popup: "src/pages/popup/index.html",
    // @ts-ignore
    default_icon: "logo.png",
  },
  background: {
    // @ts-ignore
    service_worker: "src/pages/background/background.ts",
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
      js: ["src/pages/content/index.tsx"],
    },
  ],
});
