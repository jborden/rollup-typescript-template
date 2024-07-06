import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';


export default {
  input: 'src/ts/index.ts',
  output: {
    file: 'resources/public/js/bundle.js',
    format: 'iife',
    sourcemap: 'inline'
  },
  watch: true,
  plugins: [typescript(),
	    nodeResolve(),
	    livereload(),
	    serve('resources/public')]
};
