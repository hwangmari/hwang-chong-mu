// 선수 명단 텍스트 파서. 한 줄에 한 명: `이름 성별 [구력]`
// 예) "박종연 남 10", "서지수 여 4년", "차종근 남 1", "이선민 여" (구력 없으면 0)
// 성별은 남/여/M/F/m/f 모두 허용. 표를 붙여 넣은 경우 "|"와 앞 번호("1.", "1)")는 걷어낸다.
import type { Gender, Player } from "./types";

export type PlayerLine = {
  raw: string;
  player: Player | null;
  error: string; // 비어 있으면 정상
};

function parseGender(token: string): Gender | null {
  const t = token.trim().toLowerCase();
  if (t === "남" || t === "남자" || t === "m" || t === "male") return "M";
  if (t === "여" || t === "여자" || t === "f" || t === "female") return "F";
  return null;
}

function parseYears(token: string): number | null {
  const m = token.trim().match(/^(\d+(?:\.\d+)?)(년|y)?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n >= 0 && n <= 60 ? n : null;
}

export function parsePlayerLine(raw: string): PlayerLine | null {
  const line = raw.replace(/\t/g, " ").trim();
  if (!line) return null;

  let cleaned = line.replace(/\|/g, " ").replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/^\d{1,3}[.)]\s+/, "");
  const tokens = cleaned.split(" ");

  let gender: Gender | null = null;
  let years: number | null = null;
  const nameTokens: string[] = [];
  for (const token of tokens) {
    if (gender === null && parseGender(token) !== null) {
      gender = parseGender(token);
      continue;
    }
    if (gender !== null && years === null && parseYears(token) !== null) {
      years = parseYears(token);
      continue;
    }
    if (gender === null) nameTokens.push(token);
  }

  const name = nameTokens.join(" ").trim();
  if (!name) return { raw, player: null, error: "이름을 찾지 못했어요" };
  if (gender === null) return { raw, player: null, error: "성별(남/여)을 찾지 못했어요" };
  return { raw, player: { name, gender, years: years ?? 0 }, error: "" };
}

export function parsePlayersText(text: string): PlayerLine[] {
  const lines = text
    .split(/\r?\n/)
    .map(parsePlayerLine)
    .filter((line): line is PlayerLine => line !== null);

  // 같은 이름이 두 번 나오면 뒤쪽을 오류로
  const seen = new Set<string>();
  for (const line of lines) {
    if (!line.player) continue;
    if (seen.has(line.player.name)) {
      line.error = "같은 이름이 이미 있어요";
      line.player = null;
    } else {
      seen.add(line.player.name);
    }
  }
  return lines;
}

// 저장된 선수 명단 → 다시 텍스트로 (수정용)
export function playersToText(players: Player[]): string {
  return players
    .map((p) => `${p.name} ${p.gender === "M" ? "남" : "여"} ${p.years}`)
    .join("\n");
}
