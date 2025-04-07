const path = require('path');

module.exports = {
  entry: './src/game.ts', // Your main TypeScript file
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public'), // Output directory
  },
  resolve: {
    extensions: ['.ts', '.js'], // Resolve TypeScript and JavaScript files
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader', // Process TypeScript
        exclude: /node_modules/,
      },
      {
        test: /\.css$/, // Process CSS files
        use: ['style-loader', 'css-loader', 'postcss-loader'], // Process CSS with Tailwind
      },
    ],
  },
  devServer: {
    static: './public', // Serve static files from the dist folder
    port: 3000, // Webpack Dev Server will run on localhost:3000
    hot: true, // Enable Hot Module Replacement
    historyApiFallback: true, // For Single Page Applications
  }
};
