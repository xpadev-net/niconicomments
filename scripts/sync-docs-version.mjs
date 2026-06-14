import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");

const packageJsonPath = join(rootDir, "package.json");
const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const version = packageJson.version;

if (
  typeof version !== "string" ||
  !/^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(
    version,
  )
) {
  console.error(`package.json version is not a supported semver: ${version}`);
  process.exit(1);
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const packageCdnUrlPattern = new RegExp(
  `${escapeRegExp(
    "https://cdn.jsdelivr.net/npm/@xpadev-net/niconicomments@",
  )}[^/"'<>]+${escapeRegExp("/dist/bundle.min.js")}`,
  "g",
);
const packageCdnUrl = `https://cdn.jsdelivr.net/npm/@xpadev-net/niconicomments@${version}/dist/bundle.min.js`;

const replaceExpected = (content, pattern, replacement, path) => {
  const matchPattern = pattern.global
    ? pattern
    : new RegExp(pattern.source, `${pattern.flags}g`);
  const matches = [...content.matchAll(matchPattern)];
  if (matches.length !== 1) {
    throw new Error(
      `${path}: expected exactly one niconicomments version target, found ${matches.length}`,
    );
  }
  return content.replace(matchPattern, replacement);
};

const targets = [
  {
    path: "README.md",
    update: (content) =>
      replaceExpected(
        content,
        packageCdnUrlPattern,
        packageCdnUrl,
        "README.md",
      ),
  },
  {
    path: "docs/index.html",
    update: (content) =>
      replaceExpected(
        content,
        packageCdnUrlPattern,
        packageCdnUrl,
        "docs/index.html",
      ),
  },
  {
    path: "docs/sample/sample.js",
    update: (content) =>
      replaceExpected(
        content,
        /^const DEFAULT_NC_VERSION = "[^"]+";(\r?)$/m,
        `const DEFAULT_NC_VERSION = "${version}";$1`,
        "docs/sample/sample.js",
      ),
  },
  {
    path: "docs/sample/index.html",
    update: (content) =>
      replaceExpected(
        content,
        /(<select name="nc-version" id="nc-version" autocomplete="off">\r?\n\s*)<option value="[^"]+">[^<]+<\/option>/,
        `$1<option value="${version}">${version}</option>`,
        "docs/sample/index.html",
      ),
  },
];

const staleTargets = [];
for (const target of targets) {
  const absolutePath = join(rootDir, target.path);
  const original = await readFile(absolutePath, "utf8");
  const updated = target.update(original);
  if (updated === original) continue;
  staleTargets.push(target.path);
  if (!checkOnly) {
    await writeFile(absolutePath, updated);
  }
}

if (staleTargets.length === 0) {
  console.log(`niconicomments docs/sample versions already match ${version}`);
  process.exit(0);
}

if (checkOnly) {
  console.error(
    `niconicomments docs/sample versions are stale for ${version}: ${staleTargets.join(
      ", ",
    )}`,
  );
  console.error("Run pnpm run sync-docs-version to update them.");
  process.exit(1);
}

console.log(
  `Updated niconicomments docs/sample versions to ${version}: ${staleTargets.join(
    ", ",
  )}`,
);
