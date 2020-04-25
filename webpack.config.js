const path = require('path');

module.exports = {
	entry: './src/index.ts',
	mode: 'development',
	devtool: 'inline-source-map',
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [ '.tsx', '.ts', '.js' ],
	},
	output: {
		filename: 'gtx-i18n.js',
		library: 'gtx',
		libraryTarget: 'umd',
		path: path.resolve(__dirname, 'dist'),
	},
  };
