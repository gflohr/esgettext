const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
	entry: {
		runtime: './src/index.ts',
	},
	mode: 'development',
});
