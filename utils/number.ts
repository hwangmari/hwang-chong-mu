
// "1,200"·"120 kcal"처럼 쉼표·단위가 섞인 입력도 숫자로 읽는다. 비어 있거나 숫자가 없으면 undefined (리뷰 2026-09-15)
export function toNumberLoose(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const cleaned = String(value).replace(/[^\d.]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
