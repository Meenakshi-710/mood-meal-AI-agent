/** @type {import('@babel/core').TransformOptions} */
module.exports = function (api) {
  api.cache(true)
  return {
    presets: ["babel-preset-expo"],
    // Must be listed last per Reanimated docs.
    plugins: ["react-native-reanimated/plugin"],
  }
}
