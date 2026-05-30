import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = path.join(frontendRoot, "..", "backend", "prisma", "schema.prisma");

const result = spawnSync("npx", ["prisma", "generate", `--schema=${schema}`], {
  cwd: frontendRoot,
  stdio: "inherit",
  shell: true,
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log("Prisma client generated for frontend");
