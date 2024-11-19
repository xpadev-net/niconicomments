import pkg from "./package.json" with { type: "json" };
import { fileURLToPath } from "url";
import * as path from "path";
import dts from "rollup-plugin-dts";
import { typescriptPaths } from "rollup-plugin-typescript-paths";
const banner = `/*!
  niconicomments.js v${pkg.version}
  (c) 2021 xpadev-net https://xpadev.net
  Released under the ${pkg.license} License.
*/`;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  input: "./dist/dts/main.d.ts",
  output: [{ file: "dist/bundle.d.ts", format: "es" }],
  plugins: [typescriptPaths(), dts({
    respectExternal: true,
  })],
};
