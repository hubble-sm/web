import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // Apply to all JavaScript files
  {
    files: ["**/*.js"],
    languageOptions: {
      sourceType: "commonjs", // Specify the module system
    },
  },
  // Configure global variables for browser and Node.js
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  // Apply recommended rules from @eslint/js
  pluginJs.configs.recommended,
  // Custom rules for stricter linting
  {
    rules: {
      // Report and fix common issues
      "no-unused-vars": ["error", { vars: "all", args: "after-used", ignoreRestSiblings: true }], // Customize unused variable behavior
      "no-console": "warn", // Warn about console usage in production code
      "eqeqeq": ["error", "always"], // Require strict equality
      "curly": ["error", "all"], // Require curly braces for all control statements
      "semi": ["error", "always"], // Enforce semicolons
      "quotes": ["error", "double", { avoidEscape: true }], // Use double quotes
    },
  },
];
