import babel from "@rollup/plugin-babel";
import typescript from "@rollup/plugin-typescript";
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from "@rollup/plugin-node-resolve";
import pkg from "./package.json";
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
        typescript({
            tsconfig: 'tsconfig.json',
        }),
        commonjs(),
        nodeResolve(),
        babel()
    ]
}