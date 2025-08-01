import { crx } from "@crxjs/vite-plugin";
import { resolve } from "path";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./src/manifest";
import { existsSync, readFileSync, writeFileSync } from "fs";

const root = resolve(__dirname, "src");
const pagesDir = resolve(root, "pages");
const assetsDir = resolve(root, "assets");
const outDir = resolve(__dirname, "dist");
const publicDir = resolve(__dirname, "public");

const isDev = process.env.__DEV__ === "true";

function patchManifest() {
  const manifestPath = resolve(__dirname, "dist/manifest.json");
  if (existsSync(manifestPath)) {
    const manifestData = JSON.parse(readFileSync(manifestPath, "utf-8"));
    manifestData.permissions = manifestData.permissions || [];
    if (!manifestData.permissions.includes("offscreen")) {
      manifestData.permissions.push("offscreen");
      writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
      console.log("Patched manifest.json with 'offscreen' permission.");
    } else {
      console.log("Manifest already has 'offscreen' permission.");
    }
  } else {
    console.log("Manifest file not found.");
  }
}

export default defineConfig({
  plugins: [
    solidPlugin(),
    crx({ manifest }),
    tailwindcss(),
    {
      name: "patch-offscreen-permission",
      closeBundle: patchManifest, // Runs after build is complete
    },
  ],
  resolve: {
    alias: {
      "@src": root,
      "@assets": assetsDir,
      "@pages": pagesDir,
    },
  },
  publicDir,
  build: {
    outDir,
    sourcemap: isDev,
    rollupOptions: {},
  },
});
