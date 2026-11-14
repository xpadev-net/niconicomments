import { defineConfig } from "rolldown";
import { dts } from "rolldown-plugin-dts";
import pkg from "./package.json" with { type: "json" };

const banner = `/*!
  niconicomments.js v${pkg.version}
  (c) 2021 xpadev-net https://xpadev.net
  Released under the ${pkg.license} License.
*/`;

export default defineConfig([
  {
    input: "src/main.ts",
    output: {
      file: "dist/bundle.js",
      format: "umd",
      name: "NiconiComments",
      banner,
    },
    transform: {
      target: "es2015",
    },
  },
  {
    input: { bundle: "src/main.ts" },
    plugins: [
      dts({
        tsconfig: "tsconfig.json",
        emitDtsOnly: true,
      }),
    ],
    output: {
      dir: "dist",
      format: "es",
    },
  },
]);
