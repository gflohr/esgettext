const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
	mode: 'production',
	devtool: 'source-map',
	optimization: {
		minimizer: [
			new TerserPlugin({
				parallel: true,
			}),
		],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				exclude: [/node_modules/],
			},
		],
	},
	resolve: {
		plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],
		extensions: ['.ts', '.tsx', '.js'],
		fallback: {
			fs: false,
		},
	},
	output: {
		path: path.resolve(__dirname, '_bundles'),
		filename: '[name].js',
		libraryTarget: 'umd',
		library: 'esgettext',
		umdNamedDefine: true,
	},
};
