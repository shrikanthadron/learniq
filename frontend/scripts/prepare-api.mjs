import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { build } from "esbuild";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const backendDist = path.join(frontendRoot, "..", "backend", "dist");
const target = path.join(frontendRoot, "server-dist");

if (!fs.existsSync(backendDist)) {
  console.error("Backend dist not found at", backendDist);
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(target, { recursive: true });

await build({
  entryPoints: [path.join(backendDist, "app.js")],
  bundle: true,
  platform: "node",
  target: "node20",
  outfile: path.join(target, "handler.cjs"),
  format: "cjs",
  external: ["@prisma/client", "@prisma/client/*", ".prisma/*"],
  logLevel: "info",
});

console.log("Bundled API -> server-dist/handler.cjs");
