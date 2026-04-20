import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import eslintConfigPrettier from "eslint-config-prettier";
import boundariesPlugin from "eslint-plugin-boundaries";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/generated/**",
    "Design-Reference/**",
  ]),
  eslintConfigPrettier,
  {
    plugins: {
      boundaries: boundariesPlugin,
    },
    settings: {
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**/*" },
        { type: "use-cases", pattern: "src/use-cases/**/*" },
        { type: "feature-facade", pattern: "src/features/*/facade.ts" },
        { type: "feature-internal", pattern: "src/features/*/services/**/*" },
        { type: "shared", pattern: "src/components/ui/**/*" },
      ],
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "error",
      "boundaries/dependencies": [
        2, // Error
        {
          default: "disallow",
          rules: [
            {
              from: { type: "app" },
              allow: [
                { to: { type: "use-cases" } },
                { to: { type: "feature-facade" } },
                { to: { type: "shared" } },
              ],
            },
            {
              from: { type: "use-cases" },
              allow: [{ to: { type: "feature-facade" } }],
            },
            {
              from: { type: "feature-facade" },
              allow: [{ to: { type: "feature-internal" } }],
            },
            {
              from: { type: "feature-internal" },
              allow: [{ to: { type: "shared" } }],
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
