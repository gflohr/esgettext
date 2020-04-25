const path = require('path');

module.exports = [
	'source-map'
].map(devtool => ({
	mode: 'development',
	entry: './src/index.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'gtx-i18n.js',
		library: 'GtxI18N',
		libraryTarget: 'umd',
	},
	devtool,
	optimization: {
		runtimeChunk: true
	}
}));
