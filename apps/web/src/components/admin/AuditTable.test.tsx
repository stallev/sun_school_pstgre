/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { AuditTable } from "./AuditTable";

const renderTable = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <AuditTable
        entries={[]}
        formatOccurred={(iso) => iso}
        columnOccurred="Когда"
        columnActor="Кто"
        columnAction="Действие"
        columnEntity="Сущность"
        columnDetails="Детали"
        technicalRecordTerm="Техническая запись"
        technicalRecordHint="Подсказка"
        technicalRecordHintAria="Техническая запись"
        reasonPrefix="Причина"
      />,
    );
  });
  return { container, cleanup: () => { act(() => root.unmount()); container.remove(); } };
};

describe("AuditTable", () => {
  it("uses a fixed layout with the 14/18/20/24/24 column shares", () => {
    const { container, cleanup } = renderTable();
    const table = container.querySelector("table");
    expect(table?.className).toContain("table-fixed");
    const widths = Array.from(container.querySelectorAll("col")).map((col) => col.className);
    expect(widths).toEqual(["w-[14%]", "w-[18%]", "w-[20%]", "w-[24%]", "w-[24%]"]);
    cleanup();
  });

  it("wraps header text instead of forcing a single line", () => {
    const { container, cleanup } = renderTable();
    for (const th of Array.from(container.querySelectorAll("th"))) {
      expect(th.className).toContain("whitespace-normal");
    }
    cleanup();
  });
});
