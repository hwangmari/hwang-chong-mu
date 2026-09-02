// 점수 → 선수별 순위·개인 일정 집계 (순수 함수)
import {
  POINTS,
  isFinished,
  type Match,
  type MatchOutcome,
  type MatchScore,
  type PlayerMatchView,
  type PlayerStanding,
  type ScoreMap,
  type TennisEvent,
} from "./types";

// 팀 A 기준 결과
export function outcomeForA(score: MatchScore): MatchOutcome {
  if (score.scoreA > score.scoreB) return "win";
  if (score.scoreA < score.scoreB) return "loss";
  return "draw";
}

function flip(outcome: MatchOutcome): MatchOutcome {
  if (outcome === "win") return "loss";
  if (outcome === "loss") return "win";
  return "draw";
}

function sideOf(match: Match, name: string): "A" | "B" | null {
  if (match.teamA.includes(name)) return "A";
  if (match.teamB.includes(name)) return "B";
  return null;
}

export function buildStandings(
  event: TennisEvent,
  scores: ScoreMap,
): PlayerStanding[] {
  const rows: PlayerStanding[] = event.players.map((player) => ({
    player,
    played: 0,
    scheduled: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gamesFor: 0,
    gamesAgainst: 0,
    diff: 0,
    points: 0,
    rank: 0,
  }));
  const byName = new Map(rows.map((row) => [row.player.name, row]));

  for (const match of event.matches) {
    const raw = scores[match.no];
    const score = raw && isFinished(raw) ? raw : null;
    for (const name of [...match.teamA, ...match.teamB]) {
      const row = byName.get(name);
      if (!row) continue;
      row.scheduled += 1;
      if (!score) continue;

      const side = sideOf(match, name);
      const outcome =
        side === "A" ? outcomeForA(score) : flip(outcomeForA(score));
      const mine = side === "A" ? score.scoreA : score.scoreB;
      const theirs = side === "A" ? score.scoreB : score.scoreA;

      row.played += 1;
      row.gamesFor += mine;
      row.gamesAgainst += theirs;
      if (outcome === "win") row.wins += 1;
      else if (outcome === "draw") row.draws += 1;
      else row.losses += 1;
    }
  }

  for (const row of rows) {
    row.diff = row.gamesFor - row.gamesAgainst;
    row.points =
      row.wins * POINTS.win + row.draws * POINTS.draw + row.losses * POINTS.loss;
  }

  // 승점 → 득실 → 득게임 → 승수 → 이름
  rows.sort(
    (a, b) =>
      b.points - a.points ||
      b.diff - a.diff ||
      b.gamesFor - a.gamesFor ||
      b.wins - a.wins ||
      a.player.name.localeCompare(b.player.name, "ko"),
  );

  // 동률이면 같은 순위
  let rank = 0;
  let prevKey = "";
  rows.forEach((row, index) => {
    const key = `${row.points}|${row.diff}|${row.gamesFor}|${row.wins}`;
    if (key !== prevKey) {
      rank = index + 1;
      prevKey = key;
    }
    row.rank = rank;
  });

  return rows;
}

// 선수 한 명의 출전 일정 (라운드 순)
export function buildPlayerSchedule(
  event: TennisEvent,
  scores: ScoreMap,
  name: string,
): PlayerMatchView[] {
  const views: PlayerMatchView[] = [];

  event.matches.forEach((match, index) => {
    const side = sideOf(match, name);
    if (!side) return;

    const mine = side === "A" ? match.teamA : match.teamB;
    const opponents = side === "A" ? match.teamB : match.teamA;
    const partner = mine[0] === name ? mine[1] : mine[0];
    const raw = scores[match.no];
    const score = raw && isFinished(raw) ? raw : null;
    const outcome = score
      ? side === "A"
        ? outcomeForA(score)
        : flip(outcomeForA(score))
      : null;

    views.push({ match, position: index + 1, partner, opponents, side, score, outcome });
  });

  return views;
}

export function countFinished(event: TennisEvent, scores: ScoreMap) {
  return event.matches.filter((match) => isFinished(scores[match.no])).length;
}
