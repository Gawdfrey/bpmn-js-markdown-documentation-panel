const path = require("path");
const fs = require("fs");

// Simple plugin to copy files to dist
class CopyFilesPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('CopyFilesPlugin', (compilation, callback) => {
      // Copy style.css
      const styleSrc = path.resolve(__dirname, "src/style/style.css");
      const styleDest = "style.css";
      if (fs.existsSync(styleSrc)) {
        const styleContent = fs.readFileSync(styleSrc, 'utf8');
        compilation.assets[styleDest] = {
          source: () => styleContent,
          size: () => styleContent.length
        };
      }

      // Copy package.json
      const packageSrc = path.resolve(__dirname, "package.json");
      const packageDest = "package.json";
      if (fs.existsSync(packageSrc)) {
        const packageContent = fs.readFileSync(packageSrc, 'utf8');
        compilation.assets[packageDest] = {
          source: () => packageContent,
          size: () => packageContent.length
        };
      }

      // Create index.js in dist
      const indexContent = `module.exports = {
  name: "BPMN Documentation Panel",
  style: "./style.css",
  script: "./client.js",
};`;
      compilation.assets["index.js"] = {
        source: () => indexContent,
        size: () => indexContent.length
      };

      callback();
    });
  }
}

module.exports = {
  mode: "development",
  entry: "./src/index.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "client.js",
    clean: true,
  },
  plugins: [
    new CopyFilesPlugin()
  ],
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
