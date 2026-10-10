import { HowItWasBuiltSection } from "@/components/how-it-was-built/HowItWasBuiltSection";
import { getMessages } from "@/lib/messages/server";

export async function HowItWasBuiltRoadmap() {
  const messages = await getMessages();
  const section = messages.howItWasBuilt.roadmap;

  return (
    <HowItWasBuiltSection id={section.id} title={section.title} intro={section.intro}>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                {section.tableHeaders.feature}
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-foreground">
                {section.tableHeaders.status}
              </th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((item) => (
              <tr key={item.feature} className="border-b border-border/70 last:border-0">
                <td className="px-4 py-3 align-top font-medium text-foreground">
                  {item.feature}
                </td>
                <td className="px-4 py-3 align-top text-muted-foreground">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </HowItWasBuiltSection>
  );
}
