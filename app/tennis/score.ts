// 테니스 점수 규칙(순수 함수) — 팀 토너먼트와 일반 대회가 함께 쓴다.
// 규칙: 정해진 게임 수(기본 6) 선취 · 5:5면 7점 타이브레이크 · 동점은 저장할 수 없다.
// 카드 화면은 종류마다 따로 두고, 이 규칙만 한 곳에서 고친다.

// 게임 수 칸 한 개 읽기. 빈 칸이면 null, 0~20 정수만 인정
export function parseGames(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : null;
}

export type GameScoreInput = {
  a: string;
  b: string;
  tbA: string;
  tbB: string;
  gamesToWin: number;
};

export type GameScoreCheck = {
  error: string; // 비어 있으면 저장해도 되는 점수
  a: number | null;
  b: number | null;
  tiebreak: [number, number] | null;
  needsTiebreak: boolean; // 6:5처럼 타이브레이크로 갈린 점수인지
};

export function validateGameScore(input: GameScoreInput): GameScoreCheck {
  const { tbA, tbB, gamesToWin } = input;
  const a = parseGames(input.a);
  const b = parseGames(input.b);
  const needsTiebreak =
    a !== null && b !== null && Math.max(a, b) === gamesToWin && Math.min(a, b) === gamesToWin - 1;
  const ta = parseGames(tbA);
  const tb = parseGames(tbB);
  const tiebreak: [number, number] | null =
    needsTiebreak && ta !== null && tb !== null ? [ta, tb] : null;
  const fail = (error: string): GameScoreCheck => ({ error, a, b, tiebreak: null, needsTiebreak });

  if (a === null || b === null) return fail("양 팀 게임 수를 넣어 주세요.");
  if (a === b) return fail("동점으로는 저장할 수 없어요. 승자가 정해져야 해요.");
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  if (hi !== gamesToWin) return fail(`${gamesToWin}게임 선취예요. 이긴 팀은 ${gamesToWin}게임이어야 해요.`);
  if (lo > gamesToWin - 1) return fail(`진 팀은 최대 ${gamesToWin - 1}게임이에요.`);
  if (needsTiebreak) {
    if ((tbA.trim() || tbB.trim()) && (ta === null || tb === null))
      return fail("타이브레이크 점수는 둘 다 넣거나 둘 다 비워 주세요.");
    if (ta !== null && tb !== null && (ta === tb || Math.max(ta, tb) < 7))
      return fail("타이브레이크는 7점 선취예요. 예) 7-4");
    if (ta !== null && tb !== null && (ta > tb) !== (a > b))
      return fail("타이브레이크 승자와 게임 승자가 달라요.");
  }
  return { error: "", a, b, tiebreak, needsTiebreak };
}
