import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    files: ["scripts/**/*.cjs", "next.config.js"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "projects/**",
      ".agents/**",
      ".claude/**",
      "generate-guide-pdf.js",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
