import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import pkg from './package.json' with { type: 'json' };

const warningHandler = warning => {
	if (warning.code === 'EVAL') return;
	console.error(warning.message);
};

export default [
	// UMD build for the browser.
	{
		input: 'src/index.ts',
		output: {
			name: 'esgettext',
			file: pkg.browser,
			format: 'umd',
		},
		plugins: [resolve(), commonjs(), typescript(), terser()],
		onwarn: warningHandler,
	},
	{
		input: 'src/index.ts',
		plugins: [typescript()],
		onwarn: warningHandler,
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' },
		],
	},
];
