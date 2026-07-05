/**
 * Build script for ParentScript Chrome extension.
 * Uses esbuild to bundle TypeScript sources into dist/.
 */
import { build } from "esbuild";
import { copyFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src");
const DIST = join(ROOT, "dist");

const watch = process.argv.includes("--watch");

async function buildExtension() {
  console.log("Building ParentScript extension...");

  // Ensure dist/ exists
  if (!existsSync(DIST)) {
    await mkdir(DIST, { recursive: true });
  }

  // Build TypeScript files with esbuild
  const buildOptions = {
    entryPoints: [
      join(SRC, "popup.ts"),
      join(SRC, "background.ts"),
      join(SRC, "content.ts"),
    ],
    bundle: true,
    minify: !watch,
    sourcemap: watch,
    outdir: DIST,
    format: "esm",
    target: "es2020",
    platform: "browser",
  };

  try {
    if (watch) {
      const ctx = await build({
        ...buildOptions,
        watch: {
          onRebuild(error, result) {
            if (error) {
              console.error("Build failed:", error);
            } else {
              console.log("Rebuilt successfully");
            }
          },
        },
      });
      console.log("Watching for changes...");
    } else {
      await build(buildOptions);
      console.log("✓ TypeScript compiled");
    }

    // Copy static files to dist/
    await copyFile(join(SRC, "popup.html"), join(DIST, "popup.html"));
    await copyFile(join(SRC, "content.css"), join(DIST, "content.css"));
    console.log("✓ Static files copied to dist/");

    // Also copy to root for manifest (which references files in root)
    // popup.html is included here because the manifest's `default_popup`
    // and the extension's "Load unpacked" entry point both resolve
    // popup.html relative to the extension root. Without this copy, a
    // contributor who runs `npm run build` and loads the extension gets
    // a stale committed root popup.html (the old ps-* markup) that the
    // new popup.ts can't bind to — blank popup, no error.
    const { copyFile: copyFileAgain } = await import("node:fs/promises");
    await copyFileAgain(join(SRC, "popup.html"), join(ROOT, "popup.html"));
    await copyFileAgain(join(DIST, "popup.js"), join(ROOT, "popup.js"));
    await copyFileAgain(join(DIST, "background.js"), join(ROOT, "background.js"));
    await copyFileAgain(join(DIST, "content.js"), join(ROOT, "content.js"));
    await copyFileAgain(join(DIST, "content.css"), join(ROOT, "content.css"));
    console.log("✓ Files copied to root for manifest");

    if (!watch) {
      console.log("\nExtension built successfully!");
      console.log("Load unpacked from: apps/browser-extension/");
      console.log("(Chrome → Extensions → Developer mode → Load unpacked → select this folder)");
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

buildExtension();
