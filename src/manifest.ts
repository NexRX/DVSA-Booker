import { defineManifest } from "@crxjs/vite-plugin";
import packageJson from "../package.json";

const [major, minor, patch, label = "0"] = packageJson.version.replace(/[^\d.-]+/g, "").split(/[.-]/);

export default defineManifest({
  manifest_version: 3,
  name: packageJson.displayName ?? packageJson.name,
  version: `${major}.${minor}.${patch}.${label}`,
  description: packageJson.description,
  permissions: ["storage"],
  action: {
    // @ts-ignore
    default_popup: "src/pages/popup/index.html",
    // @ts-ignore
    default_icon: "logo.png",
  },
  web_accessible_resources: [
    {
      resources: ["assets/js/*.js", "assets/css/*.css", "assets/img/*"],
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
});
