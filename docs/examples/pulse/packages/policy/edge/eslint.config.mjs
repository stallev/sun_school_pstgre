import pulseNodeConfig from "@pulse/eslint-config/node";

export default [
  ...pulseNodeConfig,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "@pulse/db", message: "PKG: policy-edge must not import @pulse/db" },
            { name: "@pulse/policy-server", message: "PKG: policy-edge must not import policy-server" },
          ],
        },
      ],
    },
  },
];
