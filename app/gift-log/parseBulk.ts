// "명단 한번에 담기"용 텍스트 파서.
// 한 줄에 한 명: `이름 금액 [메모]`  예) "황다은 5", "이종엽 20 카톡송금", "윤여몽 (강태) 10"
// 금액은 1,000 미만이면 만원 단위로 본다 (5 → 50,000원). 콤마·"원"·"만원"도 허용.
// 이름이 없는 줄("5 봉투")은 이름을 "(이름 없음)"으로 채운다.
export type BulkLine = {
  raw: string;
  personName: string;
  amount: number; // 원
  memo: string;
  error: string; // 비어 있으면 정상
};

const AMOUNT_TOKEN = /^(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)(만원|만|원)?$/;

function parseAmount(token: string): number | null {
  const m = token.match(AMOUNT_TOKEN);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (m[2] === "만원" || m[2] === "만") return Math.round(n * 10000);
  if (m[2] === "원") return Math.round(n);
  // 단위 없음: 1,000 미만이면 만원 단위로 해석
  return n < 1000 ? Math.round(n * 10000) : Math.round(n);
}

export function parseBulkLine(raw: string): BulkLine | null {
  const line = raw.replace(/\t/g, " ").trim();
  if (!line) return null;

  // 표를 붙여 넣은 경우 "|"와 앞 번호("1.", "1)")를 걷어낸다
  let cleaned = line.replace(/\|/g, " ").replace(/\s+/g, " ").trim();
  // 앞 번호("1.", "1)", "1 이름")는 뒤에 금액이 따로 있을 때만 걷어낸다 ("5 봉투"는 금액이 앞에 온 줄)
  const numbered = cleaned.match(/^\d{1,3}[.)]?\s+(?=[가-힣A-Za-z(])/);
  if (numbered) {
    const rest = cleaned.slice(numbered[0].length);
    if (rest.split(" ").some((t) => parseAmount(t) !== null)) cleaned = rest;
  }

  const tokens = cleaned.split(" ");
  // 뒤에서부터 첫 금액 토큰을 찾는다 (이름 괄호 안 숫자와 구분)
  let amountIdx = -1;
  let amount: number | null = null;
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const parsed = parseAmount(tokens[i]);
    if (parsed !== null) {
      amountIdx = i;
      amount = parsed;
      break;
    }
  }
  if (amountIdx === -1 || amount === null) {
    return { raw, personName: "", amount: 0, memo: "", error: "금액을 찾지 못했어요" };
  }

  const personName = tokens.slice(0, amountIdx).join(" ").trim() || "(이름 없음)";
  const memo = tokens.slice(amountIdx + 1).join(" ").trim();
  return { raw, personName, amount, memo, error: "" };
}

export function parseBulkText(text: string): BulkLine[] {
  return text
    .split(/\r?\n/)
    .map(parseBulkLine)
    .filter((line): line is BulkLine => line !== null);
}
