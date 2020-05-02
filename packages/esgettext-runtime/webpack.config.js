const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
	entry: {
		'esgettext-runtime': './src/index-browser.ts',
		'esgettext-runtime.min': './src/index-browser.ts',
	},
	mode: 'development',
	devtool: 'source-map',
	node: {
		fs: 'empty',
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				cache: true,
				parallel: true,
				sourceMap: true,
				terserOptions: {},
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\/shims\/node\/.*\.tsx?$/,
				loader: 'null-loader',
			},
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				exclude: [/node_modules/, /shims\/node/],
			},
		],
	},
	resolve: {
		plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
		extensions: ['.ts', '.tsx', '.js'],
	},
	output: {
		path: path.resolve(__dirname, '_bundles'),
		filename: '[name].js',
		libraryTarget: 'umd',
		library: 'esgettext',
		umdNamedDefine: true,
	},
};
