const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const fse = require('fs-extra');
const CompressionPlugin = require('compression-webpack-plugin');
const postcssPresetEnv = require('postcss-preset-env');
const purgecss = require('@fullhuman/postcss-purgecss');

module.exports = {
	mode: 'production',
		watchOptions: {
			ignored: '**/*.json'
	},
	entry: {
		bundle: './_assets/index.mjs',
	},
	output: {
		path: __dirname + '/site',
		filename: '[name].min.js'
	},
	optimization: {
		minimize: true,
		minimizer: [
			new TerserPlugin({
				parallel: true,
				terserOptions: {},
			}),
			new CssMinimizerPlugin()
		],
	},
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader',
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: {
								plugins: [
									[
										purgecss({
											content: ['./_site/**/*.html'],
											safelist: [/aos/, /language/, /line-numbers/],
										}),
										postcssPresetEnv({}),
									],
								],
							},
						},
					},
				],
			},
			{
				test: /\.s[ac]ss$/i,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
						options: {
							publicPath: ''
						}
					},
					// Translates CSS into CommonJS
					'css-loader',
					// Compiles Sass to CSS
					'sass-loader',
				],
			},
			{
				test: /\.(ttf|eot|svg|woff2?)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
				type: 'asset/resource'
			},
			{
				test: /\.(png|gif|svg|jpe?g)$/,
				type: 'asset/resource'
			}
		]
	},
	devtool: 'source-map',
	plugins: [
		new CompressionPlugin(),
		new CleanWebpackPlugin(),
		new MiniCssExtractPlugin({
			filename: '[name].min.css'
		}),
		new function() {
			this.apply = (compiler) => {
				compiler.hooks.done.tap("Copy when done", () => {
					const srcdir = __dirname + '/site';
					const destdir = __dirname + '/_site/site';
					fse.copy(srcdir, destdir, { overwrite: true })
						.then(() => console.log('updated assets'))
						.catch(err => console.error(err));
				});
			};
		},
	]
};
