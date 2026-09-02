// 경조사비 화면용 순수 포맷 헬퍼
import type { GiftDirection } from "../types";

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

// 방향에 따라 부호를 붙인다. 냈으면 -, 받았으면 +
export function formatSigned(amount: number, direction: GiftDirection): string {
  const sign = direction === "given" ? "-" : "+";
  return `${sign}${formatAmount(amount)}`;
}

// 차액(받은 - 준) 표기. 0이면 "같아요"
export function formatBalance(balance: number): string {
  if (balance === 0) return "주고받은 금액이 같아요";
  const sign = balance > 0 ? "+" : "-";
  return `${sign}${formatAmount(Math.abs(balance))}`;
}

// "2024-05-11" → "2024년 5월 11일"
export function formatDateKo(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  if (!y || !m || !d) return date;
  return `${y}년 ${m}월 ${d}일`;
}
