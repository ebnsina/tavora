const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);
// Shared types, VAT maths and error messages live in the web app (web/src/lib/shared.ts).
config.watchFolders = [path.resolve(__dirname, '../web/src/lib')];

module.exports = config;
