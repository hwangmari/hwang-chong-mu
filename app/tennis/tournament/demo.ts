// 시연 데이터: 참가자 명단을 8팀에 나눠 넣고, 1라운드부터 끝까지 결과를 무작위로 채운다 (저장하지 않음)
import type { MatchScore, ScoreMap } from "../types";
import { PLAYERS_PER_TEAM, TEAM_COUNT } from "./template";
import { resolveBracket } from "./resolve";
import type { TeamEntry, TournamentEvent } from "./types";

function rng(seed: number) {
  let s = seed % 2147483647;
  return () => {
    s = (s * 48271) % 2147483647;
    return s / 2147483647;
  };
}

export function demoTeams(event: TournamentEvent): TeamEntry[] {
  const names = event.roster.length > 0 ? event.roster : Array.from({ length: 32 }, (_, i) => `선수${i + 1}`);
  return Array.from({ length: TEAM_COUNT }, (_, i) => {
    const members = names.slice(i * PLAYERS_PER_TEAM, (i + 1) * PLAYERS_PER_TEAM);
    const lead = members[0] ?? `${i + 1}번`;
    return {
      seed: i + 1,
      name: `${lead} 팀`,
      players: Array.from({ length: PLAYERS_PER_TEAM }, (_, j) => ({
        name: members[j] ?? "",
        seed: (j + 1) as 1 | 2 | 3 | 4,
      })),
    };
  });
}

// ready인 경기를 차례로 "끝난 것"으로 만들며 끝까지 진행
export function demoScores(event: TournamentEvent, teams: TeamEntry[], seed = 63): ScoreMap {
  const rand = rng(seed);
  const ev = { ...event, teams };
  const scores: ScoreMap = {};
  const [y, m, d] = event.date.split("-").map(Number);
  const [hh, mm] = event.startTime.split(":").map(Number);
  const base = new Date(y, m - 1, d, hh, mm).getTime();

  for (let guard = 0; guard < 40; guard += 1) {
    const ready = resolveBracket(ev, scores).filter((x) => x.status === "ready");
    if (ready.length === 0) break;
    for (const r of ready) {
      const aWins = rand() < 0.55;
      const loserGames = Math.floor(rand() * 6); // 0~5
      const scoreA = aWins ? 6 : loserGames;
      const scoreB = aWins ? loserGames : 6;
      const tb = loserGames === 5 ? [7, Math.floor(rand() * 6)] : null; // 5:5면 타이브레이크
      const startedAt = new Date(base + (r.template.block - 1) * event.minutesPerMatch * 60000 + Math.floor(rand() * 4) * 60000);
      const finishedAt = new Date(startedAt.getTime() + (22 + Math.floor(rand() * 12)) * 60000);
      const score: MatchScore = {
        matchNo: r.template.no,
        scoreA,
        scoreB,
        court: r.template.court,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        ...(tb ? (aWins ? { tiebreakA: tb[0], tiebreakB: tb[1] } : { tiebreakA: tb[1], tiebreakB: tb[0] }) : {}),
      };
      scores[r.template.no] = score;
    }
  }
  return scores;
}
