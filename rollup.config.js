import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default [
  // UMD for browser-friendly build
  {
    input: 'src/index.js',
    output: {
      name: 'ktools',
			file: pkg.browser,
      format: 'umd',
      exports: 'auto'
    },
    plugins: [
      resolve(),
      commonjs()
    ]
  },
  // CommonJS for Node and ES module for bundlers build
  {
    input: 'src/index.js',
    external: ['ms'],
    output: [
      {  file: pkg.main, format: 'cjs', exports: 'auto' },
      {  file: pkg.module, format: 'es', exports: 'auto' }
    ]
  }
];