const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
	entry: {
		'esgettext-runtime': './src/index-browser.ts',
	},
	mode: 'development',
});
