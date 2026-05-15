import next from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "scripts/**"],
  },
  ...next,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // Legacy pages/-router rule; this is a pure App Router project and the
      // flagged <a> tags point to Route Handlers (e.g. /api/auth/signout),
      // which intentionally must NOT use next/link.
      "@next/next/no-html-link-for-pages": "off",
      // Advisory React-Compiler heuristics that produce false positives on
      // legitimate debounce effects and React Hook Form's watch(). Kept as
      // warnings so they stay visible without failing CI.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/incompatible-library": "warn",
    },
  },
];

export default config;
