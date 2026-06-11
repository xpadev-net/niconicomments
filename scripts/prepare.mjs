import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const packageRoot = process.cwd();
const initCwd = process.env.INIT_CWD
  ? resolve(process.env.INIT_CWD)
  : packageRoot;
const isLocalInstall = initCwd === packageRoot;
const packageManager = process.env.npm_execpath;
const shell = process.platform === "win32";

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
