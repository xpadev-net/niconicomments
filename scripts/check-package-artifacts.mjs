import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const allowMissingDist = process.argv.includes("--allow-missing-dist");
const packageJson = JSON.parse(
  await readFile(join(rootDir, "package.json"), "utf8"),
);
const { version } = packageJson;
const packageName = "@xpadev-net/niconicomments";
const packageCdnUrl = `https://cdn.jsdelivr.net/npm/${packageName}@${version}/dist/bundle.js`;
const files = new Set(packageJson.files ?? []);
const errors = [];

const readText = (path) => readFile(join(rootDir, path), "utf8");
const addError = (message) => errors.push(message);
const fileExists = (path) =>
  access(join(rootDir, path)).then(
    () => true,
    () => false,
  );

if (typeof version !== "string" || version.length === 0) {
  addError("package.json version must be a non-empty string.");
}

if (packageJson.main !== "dist/bundle.js") {
  addError('package.json main must be "dist/bundle.js".');
}

if (packageJson.types !== "dist/bundle.d.ts") {
  addError('package.json types must be "dist/bundle.d.ts".');
}

for (const requiredFile of ["dist/bundle.js", "dist/bundle.d.ts"]) {
  if (!files.has(requiredFile)) {
    addError(`package.json files must include ${requiredFile}.`);
  }
}

const distPackageFiles = [...files].filter((file) => file.startsWith("dist/"));
const distArtifactsPresent = (
  await Promise.all(distPackageFiles.map((file) => fileExists(file)))
).some(Boolean);
const distRequired = !allowMissingDist || distArtifactsPresent;
const readDistText = async (path) => {
  try {
    return await readText(path);
  } catch (error) {
    if (!distRequired && error.code === "ENOENT") {
      return null;
    }
    addError(`${path} is missing or unreadable: ${error.message}`);
    return "";
  }
};

const cdnTargets = ["README.md", "README.en.md", "docs/index.html"];
const cdnPattern =
  /https:\/\/cdn\.jsdelivr\.net\/npm\/@xpadev-net\/niconicomments@([^/"'<>`]+)\/dist\/(bundle(?:\.min)?\.js)/g;

for (const path of cdnTargets) {
  const content = await readText(path);
  const matches = [...content.matchAll(cdnPattern)];
  if (matches.length !== 1) {
    addError(`${path} must contain exactly one ${packageName} CDN URL.`);
    continue;
  }

  const [, docsVersion, artifactName] = matches[0];
  if (docsVersion !== version) {
    addError(`${path} CDN version ${docsVersion} does not match ${version}.`);
  }
  if (artifactName !== "bundle.js") {
    addError(`${path} CDN artifact must be dist/bundle.js.`);
  }
  if (
    `https://cdn.jsdelivr.net/npm/${packageName}@${docsVersion}/dist/${artifactName}` !==
    packageCdnUrl
  ) {
    addError(`${path} CDN URL does not match ${packageCdnUrl}.`);
  }
}

const sampleJs = await readText("docs/sample/sample.js");
const defaultVersionMatch = sampleJs.match(
  /^const DEFAULT_NC_VERSION = "([^"]+)";$/m,
);
if (!defaultVersionMatch) {
  addError("docs/sample/sample.js must declare DEFAULT_NC_VERSION.");
} else if (defaultVersionMatch[1] !== version) {
  addError(
    `docs/sample/sample.js DEFAULT_NC_VERSION ${defaultVersionMatch[1]} does not match ${version}.`,
  );
}

const sampleCdnPattern =
  /https:\/\/cdn\.jsdelivr\.net\/npm\/@xpadev-net\/niconicomments@\$\{[^}]+}\/dist\/(bundle(?:\.min)?\.js)/g;
const sampleCdnMatches = [...sampleJs.matchAll(sampleCdnPattern)];
if (sampleCdnMatches.length !== 1) {
  addError(
    "docs/sample/sample.js must contain exactly one npm CDN URL template.",
  );
} else {
  const [, sampleArtifactName] = sampleCdnMatches[0];
  if (sampleArtifactName !== "bundle.js") {
    addError("docs/sample/sample.js npm CDN artifact must be dist/bundle.js.");
  }
  if (!files.has(`dist/${sampleArtifactName}`)) {
    addError(
      `package.json files must include dist/${sampleArtifactName} used by docs/sample/sample.js.`,
    );
  }
}

const bundleJs = await readDistText("dist/bundle.js");
if (bundleJs != null) {
  const bannerVersion = bundleJs.match(/niconicomments\.js v([^\s]+)/)?.[1];
  if (bannerVersion !== version) {
    addError(
      `dist/bundle.js banner version ${bannerVersion ?? "missing"} does not match ${version}.`,
    );
  }
}

const bundleDts = await readDistText("dist/bundle.d.ts");
if (bundleDts != null) {
  const dtsMapRef = bundleDts.match(/sourceMappingURL=(\S+)$/m)?.[1];
  if (dtsMapRef != null) {
    const dtsMapFile = `dist/${dtsMapRef}`;
    if (!files.has(dtsMapFile)) {
      addError(`package.json files must include ${dtsMapFile}.`);
    }
    await readDistText(dtsMapFile);
  }
}

if (distRequired) {
  for (const packageFile of distPackageFiles) {
    await readDistText(packageFile);
  }
}

if (errors.length > 0) {
  console.error("Package artifact checks failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(
  `Package docs and dist artifacts match ${packageName}@${version} (${
    distRequired
      ? distPackageFiles.join(", ")
      : `${distPackageFiles.join(", ")} declared; dist files absent before build`
  }).`,
);
