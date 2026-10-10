import pulseNodeConfig from "@pulse/eslint-config/node";

export default [
  ...pulseNodeConfig,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];
