module.exports = [
  {
    files: ["**/*.js"],
    ignores: ["node_modules/**", "public/**"],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: "commonjs",
    },
    rules: {
      indent: ["error", 2],
      quotes: ["error", "double"],
      semi: ["error", "always"],
      "no-unused-vars": "warn",
    },
  },
];
