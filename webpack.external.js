/* eslint-disable @typescript-eslint/no-var-requires */
// Alternative build: React, ReactDOM and the plugin SDK are not bundled. The
// plugin uses the copies the BigBlueButton client exposes on `window`, which
// requires a client that exposes them (ReactDOM, ReactDOMClient, BbbPluginSdk).
const path = require('path');
const baseConfig = require('./webpack.config');

const fromWindow = (globalName, moduleName) => ({
  root: globalName,
  commonjs: moduleName,
  commonjs2: moduleName,
  amd: moduleName,
});

module.exports = {
  ...baseConfig,
  output: {
    ...baseConfig.output,
    path: path.resolve(__dirname, 'dist-external'),
  },
  externals: {
    react: fromWindow('React', 'react'),
    'react-dom': fromWindow('ReactDOM', 'react-dom'),
    'react-dom/client': fromWindow('ReactDOMClient', 'react-dom/client'),
    'bigbluebutton-html-plugin-sdk': fromWindow('BbbPluginSdk', 'bigbluebutton-html-plugin-sdk'),
  },
};
