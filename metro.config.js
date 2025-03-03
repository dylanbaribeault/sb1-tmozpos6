// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add additional file extensions to handle
config.resolver.sourceExts = ['jsx', 'js', 'ts', 'tsx', 'json'];

// Increase max workers to improve bundling performance
config.maxWorkers = 4;

// Increase the Metro server timeout
config.server = {
  ...config.server,
  timeoutForConnecting: 30000, // 30 seconds
};

module.exports = config;