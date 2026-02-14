const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
	mode: 'production',

	// enables source maps for minified output
	devtool: 'source-map',

	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					format: {
						comments: false,
					},
				},
				extractComments: false,
			}),
		],
	},

	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},

	resolve: {
		extensions: ['.ts', '.tsx', '.js'],
		plugins: [new TsconfigPathsPlugin({ configFile: './tsconfig.json' })],

		fallback: {
			fs: false,
		},
	},

	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
		library: {
			name: 'esgettext',
			type: 'umd',
			umdNamedDefine: true,
		},
		globalObject: 'this', // prevents UMD issues in Node vs browser
	},
};
