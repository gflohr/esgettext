import path from 'path';
import { fileURLToPath } from 'url';
import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import fse from 'fs-extra';
import CompressionPlugin from 'compression-webpack-plugin';
import postcssPresetEnv from 'postcss-preset-env';
import purgeCSSPlugin from '@fullhuman/postcss-purgecss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
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
										purgeCSSPlugin({
											content: ['../../docs/**/*.html'],
											safelist: [/language/, /line-numbers/],
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
					const destdir = __dirname + '../../docs/site';
					fse.copy(srcdir, destdir, { overwrite: true })
						.then(() => console.log('updated assets'))
						.catch(err => console.error(err));
				});
			};
		},
	]
};
