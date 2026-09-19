/** @type {import('@babel/core').ConfigFunction} */
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      // `jsxImportSource: nativewind` enables the `className` prop on any component.
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
