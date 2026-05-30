import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.join(__dirname, "..");
const backendDist = path.join(frontendRoot, "..", "backend", "dist");
const target = path.join(frontendRoot, "server-dist");

if (!fs.existsSync(backendDist)) {
  console.error("Backend dist not found at", backendDist);
  console.error("Run: npm run build --prefix ../backend");
  process.exit(1);
}

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(backendDist, target, { recursive: true });
console.log("Copied backend dist -> frontend/server-dist/");
