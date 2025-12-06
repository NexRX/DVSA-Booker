import { crx } from "@crxjs/vite-plugin";
import { resolve, join, extname } from "path";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./src/manifest";
import { existsSync, readFileSync, writeFileSync, readdirSync } from "fs";
import pkg from "./package.json" with { type: "json" };

const root = resolve(__dirname, "src");
const pagesDir = resolve(root, "pages");
const assetsDir = resolve(root, "assets");
const outDir = resolve(__dirname, "dist");
const publicDir = resolve(__dirname, "public");

const isDev = process.env.__DEV__ === "true";
const FIREFOX = !!process.env.FIREFOX;
const CHROME = !FIREFOX;

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    solidPlugin(),
    crx({ manifest }),
    tailwindcss(),
    {
      name: "patch-offscreen-permission",
      closeBundle: patchManifest, // Runs after build is complete
    },
    {
      name: "patch-csp-unsafe-globals",
      closeBundle: patchCSPUnsafeGlobals,
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
    minify: CHROME,
  },
});

function patchManifest() {
  if (CHROME) {
    const manifestPath = resolve(__dirname, "dist/manifest.json");
    if (existsSync(manifestPath)) {
      const manifestData = JSON.parse(readFileSync(manifestPath, "utf-8"));
      manifestData.permissions = manifestData.permissions || [];
      if (!manifestData.permissions.includes("offscreen")) {
        manifestData.permissions.push("offscreen");
        writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
        console.log("Patched manifest.json with 'offscreen' permission.");
      }
    } else {
      console.error("Manifest file not found.");
    }
  }
  if (FIREFOX) {
    const manifestPath = resolve(__dirname, "dist/manifest.json");
    if (existsSync(manifestPath)) {
      const manifestData = JSON.parse(readFileSync(manifestPath, "utf-8"));
      if (Array.isArray(manifestData.web_accessible_resources)) {
        let changed = false;
        manifestData.web_accessible_resources.forEach((resource) => {
          if ("use_dynamic_url" in resource) {
            delete resource.use_dynamic_url;
            changed = true;
          }
        });
        if (changed) {
          writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));
          console.log("Removed 'use_dynamic_url' from web_accessible_resources in manifest.json for Firefox.");
        }
      }
    } else {
      console.error("Manifest file not found.");
    }
  }
}
function patchCSPUnsafeGlobals() {
  const distDir = resolve(__dirname, "dist");

  // Recursively get all .js files in distDir and its subfolders
  function getAllJsFiles(dir: string): string[] {
    let results: string[] = [];
    const list = readdirSync(dir, { withFileTypes: true });
    for (const entry of list) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        results = results.concat(getAllJsFiles(fullPath));
      } else if (entry.isFile() && extname(entry.name) === ".js") {
        // Store relative path from distDir
        results.push(entry.parentPath + "/" + entry.name);
      }
    }
    return results;
  }
  const files = getAllJsFiles(distDir);
  const cspSafeGlobal = [
    "typeof globalThis !== 'undefined' ? globalThis :",
    "typeof self !== 'undefined' ? self :",
    "typeof window !== 'undefined' ? window :",
    "typeof global !== 'undefined' ? global :",
    "{}",
  ].join(" ");
  let changes = 0;
  files.forEach((filePath) => {
    let code = readFileSync(filePath, "utf-8");
    const patched = code
      .replace(/Function\(["']return this["']\)\(\)/g, `(${cspSafeGlobal})`)
      .replace(/new Function\(["']return this["']\)/g, `(${cspSafeGlobal})`);
    if (patched !== code) {
      changes += 1;
      writeFileSync(filePath, patched, "utf-8");
    }
  });
  if (changes !== 0) {
    console.debug(`Processed files with changes: ${changes}`);
  }
}
