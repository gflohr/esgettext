import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import pkg from './package.json' with { type: 'json' };

// Unfortunately, for the time being, we need eval() because writing out the
// various methods of a Textdomain instance produces a lot of code, see the
// comment at the end of `src/core/textdomain.ts`.  If you have a better
// idea than just shutting up the warning, let me know about it.
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
