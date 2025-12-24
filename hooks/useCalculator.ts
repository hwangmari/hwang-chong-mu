import { useMemo } from "react";
import { Expense } from "@/types"; // 타입은 별도 파일이나 page.tsx 상단에 정의

export const useCalculator = (members: string[], expenses: Expense[]) => {
  return useMemo(() => {
    if (members.length === 0)
      return { totalCommonSpend: 0, perPersonShare: 0, settlements: [] };

    const commonExpenses = expenses.filter((e) => e.type === "COMMON");
    const totalCommonSpend = commonExpenses.reduce(
      (acc, cur) => acc + cur.amount,
      0
    );
    const perPersonShare = totalCommonSpend / members.length;

    const balances: { [key: string]: number } = {};

    // 초기화
    members.forEach((m) => (balances[m] = 0));

    members.forEach((member) => {
      const paid = commonExpenses
        .filter((e) => e.payer === member)
        .reduce((acc, cur) => acc + cur.amount, 0);
      balances[member] = paid - perPersonShare;
    });

    const receivers: { name: string; amount: number }[] = [];
    const senders: { name: string; amount: number }[] = [];

    Object.entries(balances).forEach(([name, bal]) => {
      if (bal > 0) receivers.push({ name, amount: bal });
      else if (bal < -0.01) senders.push({ name, amount: -bal }); // 부동소수점 오차 보정
    });

    receivers.sort((a, b) => b.amount - a.amount);
    senders.sort((a, b) => b.amount - a.amount);

    const settlements = [];
    let i = 0;
    let j = 0;

    while (i < receivers.length && j < senders.length) {
      const receiver = receivers[i];
      const sender = senders[j];
      const amountToTransfer = Math.min(receiver.amount, sender.amount);

      if (amountToTransfer > 0) {
        settlements.push({
          from: sender.name,
          to: receiver.name,
          amount: Math.round(amountToTransfer),
        });
      }

      receiver.amount -= amountToTransfer;
      sender.amount -= amountToTransfer;

      if (receiver.amount < 1) i++;
      if (sender.amount < 1) j++;
    }

    return { totalCommonSpend, perPersonShare, settlements };
  }, [expenses, members]);
};
