import babel from "@rollup/plugin-babel";
import typescript from "@rollup/plugin-typescript";
import pkg from "./package.json";
import * as path from "path";
const banner = `/*!
  niconicomments.js v${pkg.version}
  (c) 2021 xpadev-net https://xpadev.net
  Released under the ${pkg.license} License.
*/`;

export default {
    input: 'src/main.ts',
    output: {
        file: 'dist/bundle.js',
        format: 'umd',
        name: 'NiconiComments',
        banner
    },
    plugins: [
        typescript(),
        babel({
            babelHelpers: "bundled",
            configFile: path.resolve(__dirname, ".babelrc.js"),
        }),
    ]
}