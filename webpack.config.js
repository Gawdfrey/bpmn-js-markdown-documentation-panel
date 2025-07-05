const path = require("path");

module.exports = {
  mode: "development",
  entry: "./client/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "client.js",
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    fallback: {
      path: require.resolve("path-browserify"),
      fs: require.resolve("fs"),
      os: require.resolve("os-browserify/browser"),
      electron: require.resolve("electron"),
    },
  },
  devtool: "cheap-module-source-map",
};
