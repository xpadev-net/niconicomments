import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const packageRoot = process.cwd();
const rawInitCwd = process.env.INIT_CWD;
const hasInitCwd = rawInitCwd !== undefined && rawInitCwd !== "";
const initCwd = hasInitCwd ? resolve(rawInitCwd) : packageRoot;
const isLocalInstall = initCwd === packageRoot;
const packageManager = process.env.npm_execpath;
const shell = process.platform === "win32";

if (!hasInitCwd) {
  console.warn(
    `INIT_CWD is missing; treating prepare as local install. packageRoot=${packageRoot} initCwd=${initCwd} isLocalInstall=${isLocalInstall}`,
  );
}

const run = (command, args) => {
  const result = spawnSync(command, args, {
    env: process.env,
    shell,
    stdio: "inherit",
  });
  if (result.error) {
    console.error(result.error.message);
    return 1;
  }
  return result.status ?? 1;
};

if (!isLocalInstall) {
  if (!packageManager) {
    console.error("npm_execpath is not set; cannot build git dependency.");
    process.exit(1);
  }
  const buildStatus = run(packageManager, ["run", "build"]);
  if (buildStatus !== 0) {
    process.exit(buildStatus);
  }
}

if (isLocalInstall) {
  run("lefthook", ["install"]);
}
