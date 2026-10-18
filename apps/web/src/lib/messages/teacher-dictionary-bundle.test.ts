import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const messagesDir = join(import.meta.dirname);

const teacherPickModules = readdirSync(messagesDir).filter(
  (name) => name.startsWith("pick-teacher-") && name.endsWith(".server.ts"),
);

describe("teacher message picks (bundle splitting)", () => {
  it("never imports the admin dictionary namespace", () => {
    for (const fileName of teacherPickModules) {
      const source = readFileSync(join(messagesDir, fileName), "utf8");
      expect(source).not.toMatch(/admin\.json/);
      expect(source).not.toMatch(/pick-admin-messages/);
      expect(source).not.toMatch(/pickAdminMessages/);
    }
  });
});
