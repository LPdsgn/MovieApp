const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');

const config = getDefaultConfig(__dirname);

// Artefatto SQLite del motore (assets/db/moovie.db) come asset del bundle
config.resolver.assetExts.push('db');

module.exports = withUniwindConfig(config, {
	// relative path to your global.css file (from previous step)
	cssEntryFile: './global.css',
	// (optional) path where we gonna auto-generate typings
	// defaults to project's root
	dtsFile: './uniwind-types.d.ts',
});
