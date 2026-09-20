module.exports = {
  preset: '@react-native/jest-preset',
  // React Navigation publishes ESM modules that must be transformed by Babel in tests.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation)/)',
  ],
};
