// 在根目录下新增config-overrides.js文件并新增如下配置
const { name } = require("./package");
const webpack = require('webpack'); // 确保引入webpack

module.exports = {
  webpack: (config) => {
    // 增加环境变量
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.REACT_APP_NODE_ENV': JSON.stringify(process.env.REACT_APP_NODE_ENV)
      })
    );
    config.output.library = `${name}-[name]`;
    config.output.libraryTarget = "umd";
    config.output.chunkLoadingGlobal = `webpackJsonp_${name}`;
    // 设置为相对路径
    config.output.publicPath = "";
    return config;
  },
};
