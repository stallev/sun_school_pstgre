import pulseNodeConfig from "@pulse/eslint-config/node";

export default [
  ...pulseNodeConfig,
  {
    ignores: ["dist/**", "node_modules/**", "src/generated/**"],
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "next", message: "PKG-02: db must not import Next.js" },
            { name: "next/server", message: "PKG-02: db must not import Next.js" },
          ],
          patterns: [
            {
              group: ["apps/*", "../../apps/*"],
              message: "PKG: packages must not import apps",
            },
          ],
        },
      ],
    },
  },
];
