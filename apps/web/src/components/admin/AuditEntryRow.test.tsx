/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import adminRu from "@/lib/messages/ru/admin.json";
import { AuditEntryRow } from "./AuditEntryRow";
import { AUDIT_ACTION, AUDIT_ENTITY_TYPE } from "@sunschool/domain";

describe("AuditEntryRow", () => {
  it("renders human-readable action, entity and change lines", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(
        <table>
          <tbody>
            <AuditEntryRow
              entry={{
                id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
                occurredAtIso: "2026-01-15T12:00:00.000Z",
                action: AUDIT_ACTION.CHECK_CORRECTED,
                entityType: AUDIT_ENTITY_TYPE.HOMEWORK_CHECK,
                entityId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                actorLabel: "Елена Г.",
                entityLabel: "Проверка ДЗ",
                entityHref: null,
                actionPhrase: "Исправил проверку ДЗ",
                entityDisplay: "Проверка ДЗ · Иванов Артём · урок 5",
                entityIdTitle: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
                changeLines: ["Присутствие: да", "Тетрадь: 9"],
                isSystemEntry: false,
                technicalRecordJson: '{"id":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"}',
                reason: null,
                oldValueText: null,
                newValueText: null,
              }}
              occurredLabel="15 янв. 2026, 15:00"
              technicalRecordLabel={adminRu.audit.technical_record}
              reasonPrefix={adminRu.audit.reason_prefix}
            />
          </tbody>
        </table>,
      );
    });

    expect(container.textContent).toContain("Исправил проверку ДЗ");
    expect(container.textContent).toContain("Проверка ДЗ · Иванов Артём · урок 5");
    expect(container.textContent).toContain("Присутствие: да");
    expect(container.textContent).toContain("Техническая запись");
    expect(container.textContent).not.toContain("check.corrected");

    act(() => root.unmount());
    container.remove();
  });
});
