/* eslint-disable @typescript-eslint/no-var-requires */
const dts = require('rollup-plugin-dts').default;

const typescript = require('@rollup/plugin-typescript');

const resolve = require('@rollup/plugin-node-resolve');

const commonjs = require('@rollup/plugin-commonjs');

const postcss = require('rollup-plugin-postcss');
const nodePolyfills = require('rollup-plugin-node-polyfills');

const { terser } = require('rollup-plugin-terser');
const peerDepsExternal = require('rollup-plugin-peer-deps-external');
const packageJson = require('./package.json');

module.exports = [
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      // https://github.com/ionic-team/rollup-plugin-node-polyfills/issues/6
      nodePolyfills(),
      typescript({ tsconfig: './tsconfig.json' }),
      postcss(),
      terser(),
    ],
  },
  {
    input: 'dist/esm/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
    external: [/\.(css|scss|less)$/],
  },
];
