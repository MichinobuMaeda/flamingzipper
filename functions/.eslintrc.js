module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
    commonjs: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    quotes: ["error", "double"],
  },
  overrides: [
    {
      files: [
        "**/*.test.js",
      ],
      env: {
        "jest/globals": true,
      },
      plugins: ["jest"],
    },
  ],
};
