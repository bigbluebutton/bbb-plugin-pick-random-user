/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/extensions */
// Alternative build: React, ReactDOM and the plugin SDK are not in the plugin's
// bundle. At load time the plugin uses the copies the BigBlueButton client
// exposes on `window` (React, ReactDOM, ReactDOMClient, BbbPluginSdk) when all
// of them exist and React has the major version the plugin was built with.
// Otherwise it loads its own copies from the vendor file built next to it, and
// only then runs (src/external/).
const path = require('path');
const webpack = require('webpack');
const reactVersion = require('react/package.json').version;
const muiVersion = require('@mui/material/package.json').version;
const styledComponentsVersion = require('styled-components/package.json').version;
const baseConfig = require('./webpack.config');
const manifest = require('./manifest');

const outputPath = path.resolve(__dirname, 'dist-external');
const vendorFile = `${manifest.name}.vendor.js`;
const vendorGlobal = `__${manifest.name}Vendor`;
const sharedDependenciesGlobal = `__${manifest.name}SharedDependencies`;

// Libraries shared with the client: module name -> global the client exposes.
const sharedGlobals = {
  react: 'React',
  'react-dom': 'ReactDOM',
  'react-dom/client': 'ReactDOMClient',
  'bigbluebutton-html-plugin-sdk': 'BbbPluginSdk',
  'react-intl': 'ReactIntl',
  'styled-components': 'StyledComponents',
  '@mui/material': 'MaterialUI',
};
// Libraries that export their version: the client's copy must have the same
// major as the one installed here. SHARED_REACT_MAJOR overrides React's (only
// to test the fallback).
const sharedMajors = {
  React: process.env.SHARED_REACT_MAJOR || reactVersion.split('.')[0],
  MaterialUI: muiVersion.split('.')[0],
  StyledComponents: styledComponentsVersion.split('.')[0],
};

const fromSharedDependencies = (name) => `var ${sharedDependenciesGlobal}.${name}`;

const externals = Object.fromEntries(Object.entries(sharedGlobals)
  .map(([moduleName, globalName]) => [moduleName, fromSharedDependencies(globalName)]));

// @mui/material subpaths (imported by @bigbluebutton/bbb-ui-components-react
// and @mui/icons-material) are taken from the shared @mui/material: a
// component subpath is that component, styles and utils are re-exported by
// the package itself.
const muiSubpaths = ({ request }, callback) => {
  const match = /^@mui\/material\/([^/]+)$/.exec(request);
  if (!match) return callback();
  const subpath = match[1];
  if (subpath === 'styles' || subpath === 'utils') return callback(null, fromSharedDependencies('MaterialUI'));
  return callback(null, fromSharedDependencies(`MaterialUI.${subpath}`));
};

const pluginConfig = {
  ...baseConfig,
  entry: './src/external/index.ts',
  output: {
    filename: baseConfig.output.filename,
    path: outputPath,
    publicPath: 'auto',
  },
  externals: [externals, muiSubpaths],
  plugins: [
    ...baseConfig.plugins,
    new webpack.DefinePlugin({
      SHARED_GLOBALS: JSON.stringify(Object.values(sharedGlobals)),
      SHARED_MAJORS: JSON.stringify(sharedMajors),
      SHARED_DEPENDENCIES_GLOBAL: JSON.stringify(sharedDependenciesGlobal),
      VENDOR_FILE: JSON.stringify(vendorFile),
      VENDOR_GLOBAL: JSON.stringify(vendorGlobal),
    }),
  ],
};

const vendorConfig = {
  entry: './src/external/vendor.ts',
  output: {
    filename: vendorFile,
    path: outputPath,
    library: { name: vendorGlobal, type: 'window' },
  },
  module: baseConfig.module,
  resolve: baseConfig.resolve,
};

module.exports = [pluginConfig, vendorConfig];
