// metro.config.js
// ============================================================
// React Native Metro config with SVG transformer support
// Required for using SVG files from Figma asset extraction
// ============================================================
// SETUP (run once after getting SVGs from figma-assets.js):
//   npm install react-native-svg
//   npm install --save-dev react-native-svg-transformer
//   npx pod-install   (iOS only)
//   Then replace your existing metro.config.js with this file
// ============================================================

const { getDefaultConfig } = require("expo/metro-config")

const defaultConfig = getDefaultConfig(__dirname)
const { assetExts, sourceExts } = defaultConfig.resolver

module.exports = {
  ...defaultConfig,
  transformer: {
    ...defaultConfig.transformer,
    babelTransformerPath: require.resolve("react-native-svg-transformer"),
  },
  resolver: {
    ...defaultConfig.resolver,
    // Remove svg from assetExts so Metro uses the SVG transformer instead
    assetExts: assetExts.filter((ext) => ext !== "svg"),
    // Add svg to sourceExts so it gets transformed like a JS module
    sourceExts: [...sourceExts, "svg"],
  },
}
