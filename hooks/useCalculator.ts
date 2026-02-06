import { useMemo } from "react";
import { Expense } from "@/types";

export const useCalculator = (
  members: string[],
  expenses: Expense[],
  unit: number = 10, // 정산 단위 (기본 10원 단위)
) => {
  return useMemo(() => {
    if (members.length === 0) {
      return {
        totalCommonSpend: 0,
        perPersonShare: 0,
        settlements: [],
        remainder: 0,
        remainderReceiver: null,
      };
    }

    const commonExpenses = expenses.filter((e) => e.type === "COMMON");
    const totalCommonSpend = commonExpenses.reduce(
      (acc, cur) => acc + cur.amount,
      0,
    );

    const paidByMember: Record<string, number> = {};
    members.forEach((member) => {
      paidByMember[member] = 0;
    });
    commonExpenses.forEach((e) => {
      paidByMember[e.payer] = (paidByMember[e.payer] || 0) + e.amount;
    });

    const perPersonShare =
      Math.floor(totalCommonSpend / members.length / unit) * unit;
    const remainder = totalCommonSpend - perPersonShare * members.length;

    let remainderReceiver: string | null = null;
    if (remainder !== 0) {
      remainderReceiver = members.reduce((current, candidate) => {
        return paidByMember[candidate] > paidByMember[current]
          ? candidate
          : current;
      }, members[0]);
    }

    const balances: { [key: string]: number } = {};
    members.forEach((member) => {
      const paid = paidByMember[member] || 0;

      balances[member] = paid - perPersonShare;
    });
    if (remainderReceiver) {
      balances[remainderReceiver] += remainder;
    }

    const receivers: { name: string; amount: number }[] = [];
    const senders: { name: string; amount: number }[] = [];

    Object.entries(balances).forEach(([name, bal]) => {
      if (bal >= 1) {
        receivers.push({ name, amount: Math.floor(bal) });
      } else if (bal <= -1) {
        senders.push({ name, amount: Math.abs(Math.floor(bal)) });
      }
    });

    receivers.sort((a, b) => b.amount - a.amount);
    senders.sort((a, b) => b.amount - a.amount);

    const settlements: { from: string; to: string; amount: number }[] = [];
    let i = 0; // receivers index
    let j = 0; // senders index

    const localReceivers = receivers.map((r) => ({ ...r }));
    const localSenders = senders.map((s) => ({ ...s }));

    while (i < localReceivers.length && j < localSenders.length) {
      const receiver = localReceivers[i];
      const sender = localSenders[j];

      const amountToTransfer = Math.min(receiver.amount, sender.amount);

      if (amountToTransfer > 0) {
        settlements.push({
          from: sender.name,
          to: receiver.name,
          amount: amountToTransfer,
        });
      }

      receiver.amount -= amountToTransfer;
      sender.amount -= amountToTransfer;

      if (receiver.amount <= 0) i++;
      if (sender.amount <= 0) j++;
    }

    return {
      totalCommonSpend,
      perPersonShare,
      settlements,
      remainder,
      remainderReceiver,
    };
  }, [expenses, members, unit]);
};
