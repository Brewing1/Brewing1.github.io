var path = require("path");
var webpack = require("webpack");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
	entry: {
		index: "./src/index/index.js",
		panel: "./src/panel/panel-view.js"
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
			{
			    test: /\.hbs$/,
			    loader: "handlebars-loader",
			    // query: { inlineRequires: '\/static\/' }
			},
			{
			    test: /\.(png|jpg|gif|svg)$/,
			    use: {
			        loader: "file-loader",
			        options: {
			            esModule: false,
			        },
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
		new CopyWebpackPlugin({
			patterns: [{
				from: "static/",
			}]
		}),
		new webpack.ProvidePlugin({
		  $: 'jquery',
		  jQuery: 'jquery'
		})
	],
	devServer: {
		historyApiFallback: true,
		overlay: true,
		stats: "minimal",
		contentBase: __dirname + "/docs",
	},
	devtool: "inline-source-map",
};
