// 일반 대회 순위표 (순수 함수). 팀 단위 · 승수 기준.
// 기준 순서: 승수 → 맞대결 → 게임 득실 → 딴 게임 → 팀 이름(가나다)
// 무승부는 없다 (동점 저장을 막는다). 교류전의 승점(3-1-0)은 쓰지 않는다.
import { isFinished, type ScoreMap } from "../types";
import type { GeneralMatch, GeneralTeam, TeamStanding } from "./types";

type Row = TeamStanding;

function emptyRow(team: GeneralTeam, groupId?: string): Row {
  return {
    team,
    groupId,
    played: 0,
    scheduled: 0,
    wins: 0,
    losses: 0,
    gamesFor: 0,
    gamesAgainst: 0,
    diff: 0,
    rank: 0,
    advancing: false,
  };
}

// 두 팀의 맞대결 승자 (끝난 경기 중 마지막 것). 없으면 null
function headToHead(
  matches: GeneralMatch[],
  scores: ScoreMap,
  x: string,
  y: string,
): string | null {
  let winner: string | null = null;
  for (const m of matches) {
    if (m.a.kind !== "team" || m.b.kind !== "team") continue;
    const ids = [m.a.teamId, m.b.teamId];
    if (!ids.includes(x) || !ids.includes(y)) continue;
    const score = scores[m.no];
    if (!score || !isFinished(score) || score.scoreA === score.scoreB) continue;
    winner = score.scoreA > score.scoreB ? m.a.teamId : m.b.teamId;
  }
  return winner;
}

// 한 무리(리그 전체 또는 한 조)의 순위표
export function buildStandings(
  teams: GeneralTeam[],
  matches: GeneralMatch[],
  scores: ScoreMap,
  options: { groupId?: string; advance?: number } = {},
): TeamStanding[] {
  const byId = new Map<string, Row>();
  for (const team of teams) byId.set(team.id, emptyRow(team, options.groupId));

  for (const m of matches) {
    if (m.a.kind !== "team" || m.b.kind !== "team") continue;
    const rowA = byId.get(m.a.teamId);
    const rowB = byId.get(m.b.teamId);
    if (!rowA || !rowB) continue;
    rowA.scheduled += 1;
    rowB.scheduled += 1;
    const score = scores[m.no];
    if (!score || !isFinished(score)) continue;
    rowA.played += 1;
    rowB.played += 1;
    rowA.gamesFor += score.scoreA;
    rowA.gamesAgainst += score.scoreB;
    rowB.gamesFor += score.scoreB;
    rowB.gamesAgainst += score.scoreA;
    if (score.scoreA > score.scoreB) {
      rowA.wins += 1;
      rowB.losses += 1;
    } else if (score.scoreB > score.scoreA) {
      rowB.wins += 1;
      rowA.losses += 1;
    }
  }

  const rows = [...byId.values()];
  for (const row of rows) row.diff = row.gamesFor - row.gamesAgainst;

  rows.sort(
    (a, b) =>
      b.wins - a.wins ||
      b.diff - a.diff ||
      b.gamesFor - a.gamesFor ||
      a.team.name.localeCompare(b.team.name, "ko"),
  );

  // 맞대결: 딱 두 팀만 같은 승수로 붙어 있을 때만 본다 (세 팀 이상 동률이면 득실로 간다)
  for (let i = 0; i < rows.length - 1; i++) {
    const x = rows[i];
    const y = rows[i + 1];
    if (x.wins !== y.wins) continue;
    const before = i > 0 && rows[i - 1].wins === x.wins;
    const after = i + 2 < rows.length && rows[i + 2].wins === x.wins;
    if (before || after) continue; // 세 팀 이상 동률
    const winner = headToHead(matches, scores, x.team.id, y.team.id);
    if (winner === y.team.id) {
      rows[i] = y;
      rows[i + 1] = x;
    }
  }

  // 등수는 줄 순서 그대로 매긴다. 성적이 똑같아도 같은 등수를 주지 않는다 —
  // 세 팀이 동률인데 두 팀만 올라가는 조에서 "셋 다 1위"로 보이면 누가 올라가는지 알 수 없어서다.
  // 끝까지 갈리지 않으면 팀 이름 순으로 정하고, 그 사실을 화면 안내에 적는다.
  const advance = options.advance ?? 0;
  rows.forEach((row, i) => {
    row.rank = i + 1;
    row.advancing = advance > 0 && i < advance;
  });
  return rows;
}

// 조가 다 끝났는지 (결선을 만들어도 되는지)
export function groupFinished(matches: GeneralMatch[], scores: ScoreMap, groupId: string): boolean {
  const list = matches.filter((m) => m.groupId === groupId);
  return list.length > 0 && list.every((m) => isFinished(scores[m.no]));
}
