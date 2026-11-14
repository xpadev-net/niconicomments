import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const targets = process.argv.slice(2);
if (targets.length === 0) {
  targets.push("dist");
}

for (const target of targets) {
  await rm(resolve(process.cwd(), target), {
    force: true,
    recursive: true,
    maxRetries: 3,
  });
}
