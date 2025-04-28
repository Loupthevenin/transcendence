const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/main.ts", // Your main TypeScript file
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "public"), // Output directory
    publicPath: "/",
    chunkFilename: "[name].bundle.js",
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx"], // Resolve JavaScript and TypeScript files
    alias: {
      "@shared": path.resolve(__dirname, "./src/shared/"), // Path to shared folder
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader", // Process TypeScript
        exclude: /node_modules/,
      },
      {
        test: /\.css$/, // Process CSS files
        use: ["style-loader", "css-loader"], // Process CSS with Tailwind
      }
    ],
  },
  devtool: false, // Disable source maps globally
  plugins: [
    new webpack.SourceMapDevToolPlugin({
        exclude: [/node_modules/], // Exclude all node_modules
    }),
  ],
  devServer: {
    static: path.resolve(__dirname, "public"), // Serve static files from the public folder
    port: 9000, // Webpack Dev Server will run on localhost:9000
    host: "0.0.0.0",
    hot: true, // Enable Hot Module Replacement
    historyApiFallback: true, // For Single Page Applications
  },
};
