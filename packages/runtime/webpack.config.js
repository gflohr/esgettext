const path = require('path');

module.exports = {
	entry: {
		index: './src/index.ts',
		'index-browser': './src/index-browser.ts',
	},
	mode: 'production',
	output: {
		path: path.resolve(__dirname, 'lib'),
		filename: '[name].js',
		library: {
			name: 'esgettext-runtime',
			type: 'umd',
		},
		globalObject: 'this',
	},
	resolve: {
		extensions: ['.ts', '.js'],
		alias: {
			fs: false,
		},
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
};
