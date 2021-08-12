var path = require("path");
var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	entry: {
		index: "./src/index/index.js",
		panel: "./src/panel/panel.js"
	},
	resolve: {
		extensions: [".js", ".html", ".npy", ".json"],
	},
	output: {
		path: __dirname + "/docs",
		filename: "[name].bundle.js",
		chunkFilename: "[name].[id].js",
	},
	module: {
		rules: [
			{
				test: /\.(html|js)$/,
				exclude: /node_modules/,
				loader: "babel-loader",
				options: {
					presets: ["@babel/preset-env"],
				},
			},
			// {
			// 	test: /\.css$/i,
			// 	use: ["to-string-loader", "css-loader"],
			// },
			{
				test: /\.(html|svelte)$/,
				exclude: /node_modules/,
				loader: "svelte-loader",
			},
			{
				test: /\.(npy|npc)$/,
				exclude: /node_modules/,
				loader: "numpy-loader",
				options: {
					outputPath: "data/",
				},
			},
			{
				test: /\.svg$/,
				exclude: /node_modules/,
				loader: "svg-inline-loader",
				options: {
					removeSVGTagAttrs: true,
					removingTagAttrs: ["font-family"],
				},
			},
			{
				test: /\.(png|jpg|jpeg)$/,
				exclude: /node_modules/,
				loader: "file",
				options: {
					outputPath: "images/",
				},
			},
		],
	},
	plugins: [
		new HtmlWebpackPlugin({
			template: "./src/index/index.ejs",
			filename: "index.html",
			chunks: ["index"],
		}),
		new HtmlWebpackPlugin({
			template: "./src/panel/panel.ejs",
			filename: "panel.html",
			chunks: ["panel"],
		}),
		new CopyWebpackPlugin([{ from: "static/" }]),
		new webpack.ProvidePlugin({
		  $: 'jquery',
		  jQuery: 'jquery',
		});
	],
	devServer: {
		historyApiFallback: true,
		overlay: true,
		stats: "minimal",
		contentBase: __dirname + "/docs",
	},
	devtool: "inline-source-map",
};
