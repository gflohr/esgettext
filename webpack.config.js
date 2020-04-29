const webpack = require('webpack');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
	entry: {
		'gtx-i18n-runtime': './src/index.ts',
		'gtx-i18n-runtime.min': './src/index.ts',
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
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader',
				exclude: /node_modules/,
				query: {
					declaration: false,
				},
			},
		],
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
	},
	output: {
		path: path.resolve(__dirname, '_bundles'),
		filename: '[name].js',
		libraryTarget: 'umd',
		library: 'Gtx',
		umdNamedDefine: true,
	},
};
