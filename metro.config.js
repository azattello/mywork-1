const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Prefer react-native, then browser builds, then main (node) to avoid Node-only deps like 'crypto'
config.resolver.mainFields = ['react-native', 'browser', 'main'];

module.exports = config;
