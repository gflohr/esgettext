const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
	entry: {
		'esgettext-runtime.min': './src/index-browser.ts',
	},
});
