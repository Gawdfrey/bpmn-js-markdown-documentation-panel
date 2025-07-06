const path = require("path");
const fs = require("fs");

// Simple plugin to copy files to dist
class CopyFilesPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync("CopyFilesPlugin", (compilation, callback) => {
      // Copy style.css
      const styleSrc = path.resolve(__dirname, "src/style.css");
      const styleDest = "style.css";
      if (fs.existsSync(styleSrc)) {
        const styleContent = fs.readFileSync(styleSrc, "utf8");
        compilation.assets[styleDest] = {
          source: () => styleContent,
          size: () => styleContent.length,
        };
      }

      // Copy index.js
      const indexSrc = path.resolve(__dirname, "src/index.js");
      const indexDest = "index.js";
      if (fs.existsSync(indexSrc)) {
        const indexContent = fs.readFileSync(indexSrc, "utf8");
        compilation.assets[indexDest] = {
          source: () => indexContent,
          size: () => indexContent.length,
        };
      }

      callback();
    });
  }
}

module.exports = {
  mode: "development",
  entry: {
    "camunda-modeler-entry": "./src/camunda-modeler-entry.ts",
    "bpmn-js-entry": "./src/bpmn-js-entry.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
    library: {
      type: "module",
    },
    globalObject: "this",
  },
  experiments: {
    outputModule: true,
  },
  plugins: [new CopyFilesPlugin()],
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
  optimization: {
    minimize: false, // Disable minification to preserve constructor parameter names for DI
  },
};
