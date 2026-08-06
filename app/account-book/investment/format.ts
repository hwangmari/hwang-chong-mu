// 등락·손익 색상 (국내 관례): 상승/이익 빨강, 하락/손실 파랑
const GAIN_COLOR = "#d64c4c";
const LOSS_COLOR = "#3182f6";

export function toneColor(value: number) {
  if (value > 0) return GAIN_COLOR;
  if (value < 0) return LOSS_COLOR;
  return "#4a515c";
}

export function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

export function formatSignedWon(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(value)).toLocaleString("ko-KR")}원`;
}

export function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

export function formatQuantity(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

export function formatClock(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}
