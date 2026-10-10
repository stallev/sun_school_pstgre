import { SectionTitle } from "@/components/atoms";
import { Badge } from "@/components/ui/badge";
import { KeyValueRow } from "@/components/ui/KeyValueRow";
import { PulseCard } from "@/components/ui/card";
import type { TrainerIncomeSnapshot } from "@/data/trainer/get-trainer-income.server";
import { getMessages } from "@/lib/messages/server";


export type TrainerIncomeTransactionsProps = {
  transactions: TrainerIncomeSnapshot["transactions"];
};

export async function TrainerIncomeTransactions({  transactions,
}: TrainerIncomeTransactionsProps) {
  const messages = await getMessages();

  return (
    <section className="space-y-3">
      <SectionTitle>{messages.trainer.income.transactionsTitle}</SectionTitle>
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <PulseCard key={transaction.id} className="space-y-2 p-4">
            <KeyValueRow label={transaction.dateLabel} value={transaction.clientName} />
            <KeyValueRow label={transaction.serviceName} value={transaction.amountLabel} />
            <Badge variant="secondary">{messages.trainer.income.statusPaid}</Badge>
          </PulseCard>
        ))}
      </div>
    </section>
  );
}
