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
            { name: "@pulse/db", message: "PKG-01: domain must not import @pulse/db" },
            { name: "next", message: "PKG-01: domain must not import Next.js" },
            { name: "next/server", message: "PKG-01: domain must not import Next.js" },
            { name: "@prisma/client", message: "PKG-01: domain must not import Prisma" },
          ],
          patterns: [
            {
              group: ["@vercel/*"],
              message: "PKG-01: domain must not import Vercel SDK",
            },
          ],
        },
      ],
    },
  },
];
