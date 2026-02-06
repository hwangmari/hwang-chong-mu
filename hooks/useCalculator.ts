import { useMemo } from "react";
import { Expense } from "@/types";

export const useCalculator = (
  members: string[],
  expenses: Expense[],
  unit: number = 10, // 정산 단위 (기본 10원 단위)
) => {
  return useMemo(() => {
    // 1. 초기 예외 처리
    if (members.length === 0) {
      return {
        totalCommonSpend: 0,
        perPersonShare: 0,
        settlements: [],
        remainder: 0,
        remainderReceiver: null,
      };
    }

    // 2. 공동 지출 필터링 및 총액 계산
    const commonExpenses = expenses.filter((e) => e.type === "COMMON");
    const totalCommonSpend = commonExpenses.reduce(
      (acc, cur) => acc + cur.amount,
      0,
    );

    // 멤버별 지출 합계 (공통 지출만)
    const paidByMember: Record<string, number> = {};
    members.forEach((member) => {
      paidByMember[member] = 0;
    });
    commonExpenses.forEach((e) => {
      paidByMember[e.payer] = (paidByMember[e.payer] || 0) + e.amount;
    });

    // 3. 1인당 부담금 계산 (정해진 단위로 절사: 예 36,375원 -> 36,370원)
    // 나머지 잔차는 지출이 가장 많았던 '황총무'가 감수하거나 별도 처리하는 것이 일반적입니다.
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

    // 4. 멤버별 차액(Balance) 계산
    const balances: { [key: string]: number } = {};
    members.forEach((member) => {
      const paid = paidByMember[member] || 0;

      // (내가 낸 돈) - (내가 내야 할 돈)
      // 결과값이 (+)면 받아야 할 사람, (-)면 보내야 할 사람
      balances[member] = paid - perPersonShare;
    });
    if (remainderReceiver) {
      balances[remainderReceiver] += remainder;
    }

    // 5. 정산 대상자 분류 (받을 사람 / 보낼 사람)
    const receivers: { name: string; amount: number }[] = [];
    const senders: { name: string; amount: number }[] = [];

    Object.entries(balances).forEach(([name, bal]) => {
      // 1원 미만의 미세 오차는 무시
      if (bal >= 1) {
        receivers.push({ name, amount: Math.floor(bal) });
      } else if (bal <= -1) {
        senders.push({ name, amount: Math.abs(Math.floor(bal)) });
      }
    });

    // 큰 금액부터 정렬하여 송금 횟수 최소화 (Greedy Algorithm)
    receivers.sort((a, b) => b.amount - a.amount);
    senders.sort((a, b) => b.amount - a.amount);

    // 6. 매칭 로직 (Settlements)
    const settlements: { from: string; to: string; amount: number }[] = [];
    let i = 0; // receivers index
    let j = 0; // senders index

    // 복사본을 만들어 루프 돌리기
    const localReceivers = receivers.map((r) => ({ ...r }));
    const localSenders = senders.map((s) => ({ ...s }));

    while (i < localReceivers.length && j < localSenders.length) {
      const receiver = localReceivers[i];
      const sender = localSenders[j];

      // 둘 중 작은 금액만큼 이동
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
