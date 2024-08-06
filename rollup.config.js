import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';


export default {
  input: 'src/ts/System.ts',
  output: {
    file: 'resources/public/js/bundle.js',
    format: 'iife'
  },
  watch: true,
  plugins: [typescript({
    tsconfig: false,
    compilerOptions: {
      target: "ES2017",
      module: "ESNext",
      lib: ["ES2017", "DOM"],
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true
    }
  }),
	    nodeResolve(),
	    livereload(),
	    serve('resources/public')]
};
