// 참가 팀 목록 텍스트 파서. 한 줄에 한 팀: `팀이름 / 선수1 · 선수2`
// 예) "번개파 / 김민준 · 이서연", "구름클럽 / 박도윤, 최하은", "바람팀" (선수는 나중에 채워도 된다)
// 표를 붙여 넣은 경우 "|"와 앞 번호("1.", "1)")는 걷어낸다. 선수 구분은 · , / 가운데 아무거나.
import type { GeneralTeam } from "./types";

export type TeamLine = {
  raw: string;
  team: GeneralTeam | null;
  error: string; // 비어 있으면 정상
};

const MAX_PLAYERS = 2;

function splitPlayers(text: string): string[] {
  return text
    .split(/[·,、/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_PLAYERS);
}

export function parseTeamLine(raw: string, index: number): TeamLine | null {
  const line = raw.replace(/\t/g, " ").replace(/\|/g, " ").replace(/\s+/g, " ").trim();
  if (!line) return null;
  const cleaned = line.replace(/^\d{1,3}[.)]\s+/, "");

  // 팀 이름과 선수는 첫 "/" 로 가른다. "/"가 없으면 줄 전체가 팀 이름
  const cut = cleaned.indexOf("/");
  const name = (cut >= 0 ? cleaned.slice(0, cut) : cleaned).trim();
  const players = cut >= 0 ? splitPlayers(cleaned.slice(cut + 1)) : [];

  if (!name) return { raw, team: null, error: `${index + 1}번째 줄에 팀 이름이 없어요.` };
  if (name.length > 30) return { raw, team: null, error: `팀 이름이 너무 길어요 (30자까지): ${name.slice(0, 12)}…` };
  return {
    raw,
    team: { id: "", seed: 0, name, players },
    error: "",
  };
}

export function parseTeamsText(text: string): TeamLine[] {
  const lines: TeamLine[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = parseTeamLine(raw, i);
    if (line) lines.push(line);
  });

  // 같은 팀 이름이 두 번 나오면 뒤쪽을 오류로
  const seen = new Set<string>();
  for (const line of lines) {
    if (!line.team) continue;
    if (seen.has(line.team.name)) {
      line.error = `같은 팀 이름이 두 번 있어요: ${line.team.name}`;
      line.team = null;
    } else {
      seen.add(line.team.name);
    }
  }

  // 자리(시드)와 id는 정상인 줄에만, 순서대로 매긴다
  let seed = 0;
  for (const line of lines) {
    if (!line.team) continue;
    seed += 1;
    line.team = { ...line.team, id: `t${seed}`, seed };
  }
  return lines;
}

// 정상적으로 읽힌 팀만
export function teamsOf(lines: TeamLine[]): GeneralTeam[] {
  return lines.map((l) => l.team).filter((t): t is GeneralTeam => t !== null);
}

export function teamLineErrors(lines: TeamLine[]): string[] {
  return lines.map((l) => l.error).filter(Boolean);
}

// 저장된 팀 목록 → 다시 텍스트로 (수정용)
export function teamsToText(teams: GeneralTeam[]): string {
  return teams
    .map((t) => (t.players.length > 0 ? `${t.name} / ${t.players.join(" · ")}` : t.name))
    .join("\n");
}
