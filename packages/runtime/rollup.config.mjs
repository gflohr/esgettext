import replace from '@rollup/plugin-replace';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import * as fs from 'fs';

const pkg = JSON.parse(
	fs.readFileSync('./package.json', { encoding: 'utf-8' }),
);

export default [
	// UMD builds for the browser.
	{
		input: 'src/index-browser.ts',
		output: {
			name: 'esgettext',
			file: './dist/esgettext.min.js',
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
			typescript({
				exclude: 'src/**/*.spec.ts',
			}),
			terser(),
		],
	},
	{
		input: 'src/index-browser.ts',
		output: {
			name: 'esgettext',
			file: './dist/esgettext.js',
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
			typescript({
				exclude: 'src/**/*.spec.ts',
			}),
		],
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
			typescript({
				exclude: 'src/**/*.spec.ts',
			}),
		],
		output: [
			{ file: pkg.main, format: 'cjs', sourcemap: true },
			{ file: pkg.module, format: 'es', sourcemap: true },
		],
	},
];
