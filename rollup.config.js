import babel from "@rollup/plugin-babel"
import pkg from "./package.json";
const banner = `/*!
  niconicomments.js v${pkg.version}
  (c) 2021 xpadev-net https://xpadev.net
  Released under the ${pkg.license} License.
*/`;

export default {
    input: 'src/main.js',
    output: {
        file: 'dist/bundle.js',
        format: 'umd',
        name: 'NiconiComments',
        banner
    },
    plugins: [babel()]
}