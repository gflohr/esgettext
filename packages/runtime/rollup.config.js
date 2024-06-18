import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import * as fs from 'fs';

const pkg = JSON.parse(
	fs.readFileSync('./package.json', { encoding: 'utf-8' }),
);

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
		input: 'src/index-browser.ts',
		output: {
			name: 'esgettext',
			file: pkg.browser,
			format: 'umd',
			sourcemap: true,
		},
		external: ['fs'],
		plugins: [
			// First replace the import.
			replace({
				values: {
					'./fs': JSON.stringify('./fs-browser'),
					'../transport/fs': JSON.stringify('../transport/fs-browser'),
				},
				delimiters: ["'", "'"],
				preventAssignment: true,
			}),
			// Now set the isBrowser variable so that the tree-shaking can
			// eliminate the node specific code.
			replace({
				values: {
					'process.env.BROWSER_ENV': JSON.stringify(true),
				},
				preventAssignment: true,
			}),
			resolve(),
			commonjs(),
			typescript(),
			terser(),
		],
		onwarn: warningHandler,
	},
	{
		input: 'src/index.ts',
		external: ['fs'],
		plugins: [
			// Now set the isBrowser variable so that the tree-shaking can
			// eliminate the node specific code.
			replace({
				values: {
					'process.env.BROWSER_ENV': JSON.stringify(false),
				},
				preventAssignment: true,
			}),
			typescript(),
		],
		onwarn: warningHandler,
		output: [
			{ file: pkg.main, format: 'cjs', sourcemap: true },
			{ file: pkg.module, format: 'es', sourcemap: true },
		],
	},
];
