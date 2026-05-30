import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const backendRoot = path.join(frontendRoot, "..", "backend");
const schema = path.join(backendRoot, "prisma", "schema.prisma");

const generate = spawnSync("npx", ["prisma", "generate", `--schema=${schema}`], {
  cwd: backendRoot,
  stdio: "inherit",
  shell: true,
});

if (generate.status !== 0) {
  process.exit(generate.status ?? 1);
}

const prismaEngineSrc = path.join(backendRoot, "node_modules", ".prisma");
const prismaEngineDest = path.join(frontendRoot, "node_modules", ".prisma");

if (fs.existsSync(prismaEngineSrc)) {
  fs.rmSync(prismaEngineDest, { recursive: true, force: true });
  fs.cpSync(prismaEngineSrc, prismaEngineDest, { recursive: true });
  console.log("Copied Prisma engines to frontend/node_modules/.prisma");
}

console.log("Prisma client ready for frontend");
