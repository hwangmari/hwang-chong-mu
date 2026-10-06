// 템플릿 + 지금까지의 점수 → 각 경기의 팀·상태·승자, 최종 순위 (순수 함수)
import { isFinished, type MatchScore, type ScoreMap } from "../types";
import { BLOCKS, DOUBLE_ELIM_8 } from "./template";
import { playerAtSeed } from "./types";
import type {
  Placement,
  ResolvedMatch,
  ScheduleBlock,
  SlotRef,
  TeamEntry,
  TemplateMatch,
  TournamentEvent,
} from "./types";
import { toClock, toMinutes } from "../format";

function winnerOf(score: MatchScore | undefined): "A" | "B" | null {
  if (!score || !isFinished(score)) return null;
  if (score.scoreA === score.scoreB) return null; // 동점은 승자 없음(입력 오류로 본다)
  return score.scoreA > score.scoreB ? "A" : "B";
}

export function resolveBracket(
  event: TournamentEvent,
  scores: ScoreMap,
): ResolvedMatch[] {
  const bySeed = new Map(event.teams.map((t) => [t.seed, t]));
  const resolved = new Map<number, ResolvedMatch>();
  // 지금 뛰고 있는 팀은 다른 경기를 시작할 수 없다 (뒤에서 status를 정할 때 쓴다)
  const playingTeams = new Set<number>();
  const labelOf = (m: TemplateMatch | undefined) =>
    m ? `${m.label} ${m.no}번` : "?";

  const refTeam = (ref: SlotRef): { team: TeamEntry | null; label: string } => {
    if (ref.kind === "seed") {
      return {
        team: bySeed.get(ref.seed) ?? null,
        label: `${ref.seed}번 시드`,
      };
    }
    const prev = resolved.get(ref.of);
    const prevTemplate = DOUBLE_ELIM_8.find((m) => m.no === ref.of);
    if (!prev) return { team: null, label: labelOf(prevTemplate) };
    const team = ref.kind === "winner" ? prev.winner : prev.loser;
    return {
      team,
      label: `${labelOf(prevTemplate)} ${ref.kind === "winner" ? "승자" : "패자"}`,
    };
  };

  for (const template of DOUBLE_ELIM_8) {
    const a = refTeam(template.a);
    const b = refTeam(template.b);
    const score = scores[template.no];
    const w = winnerOf(score);

    let status: ResolvedMatch["status"];
    if (w) status = "done";
    else if (score?.startedAt) status = "playing";
    else if (
      a.team &&
      b.team &&
      !playingTeams.has(a.team.seed) &&
      !playingTeams.has(b.team.seed)
    )
      status = "ready";
    else status = "waiting";

    const teamA = a.team;
    const teamB = b.team;
    if (status === "playing") {
      if (teamA) playingTeams.add(teamA.seed);
      if (teamB) playingTeams.add(teamB.seed);
    }
    resolved.set(template.no, {
      template,
      teamA,
      teamB,
      aLabel: a.label,
      bLabel: b.label,
      status,
      winner: w === "A" ? teamA : w === "B" ? teamB : null,
      loser: w === "A" ? teamB : w === "B" ? teamA : null,
      scoreA: score && isFinished(score) ? score.scoreA : null,
      scoreB: score && isFinished(score) ? score.scoreB : null,
    });
  }
  return DOUBLE_ELIM_8.map((m) => resolved.get(m.no)!);
}

export function placements(matches: ResolvedMatch[]): Placement[] {
  const by = new Map(matches.map((m) => [m.template.no, m]));
  // 2026 규칙: 그랜드 파이널 한 판으로 1·2위. 3·4위는 패자조에서 떨어진 순서대로.
  const gf = by.get(16);
  const champion = gf?.status === "done" ? gf.winner : null;
  const runnerUp = gf?.status === "done" ? gf.loser : null;
  const m15 = by.get(15); // 패자조 결승
  const m13 = by.get(13); // 패자조 준결승
  const m14 = by.get(14);
  const m12 = by.get(12);
  return [
    { rank: 1, team: champion, how: "그랜드 파이널 승" },
    { rank: 2, team: runnerUp, how: "그랜드 파이널 패" },
    { rank: 3, team: m15?.loser ?? null, how: "패자조 결승 패" },
    { rank: 4, team: m13?.loser ?? null, how: "패자조 준결승 패" },
    { rank: 5, team: m14?.winner ?? null, how: "5-6위전 승" },
    { rank: 6, team: m14?.loser ?? null, how: "5-6위전 패" },
    { rank: 7, team: m12?.winner ?? null, how: "7-8위전 승" },
    { rank: 8, team: m12?.loser ?? null, how: "7-8위전 패" },
  ];
}

export function scheduleBlocks(event: TournamentEvent): ScheduleBlock[] {
  // 타임마다 경기 시간을 쌓되, breakBefore 가 있으면 그 앞에서 쉬는 시간만큼 밀린다
  let cursor = toMinutes(event.startTime);
  return BLOCKS.map((b) => {
    cursor += b.breakBefore ?? 0;
    const start = cursor;
    cursor += event.minutesPerMatch;
    return { ...b, time: `${toClock(start)} — ${toClock(cursor)}` };
  });
}

// 한 팀의 여정: 참가한 경기와 결과
export function teamPath(matches: ResolvedMatch[], team: TeamEntry) {
  return matches
    .filter(
      (m) =>
        m.status !== "hidden" &&
        (m.teamA?.seed === team.seed || m.teamB?.seed === team.seed),
    )
    .map((m) => {
      const side = m.teamA?.seed === team.seed ? "A" : "B";
      const opponent = side === "A" ? m.teamB : m.teamA;
      const outcome =
        m.status !== "done"
          ? null
          : m.winner?.seed === team.seed
            ? "win"
            : "loss";
      return { match: m, side, opponent, outcome } as const;
    });
}

export function countFinishedTournament(matches: ResolvedMatch[]) {
  const visible = matches.filter((m) => m.status !== "hidden");
  return {
    done: visible.filter((m) => m.status === "done").length,
    total: visible.length,
  };
}

// === 선수별 실제 뛴 게임 수 ===
// 페어 교체 규칙(4게임 단위 A→B→C)에 총 게임 수를 대입한다. 6:4면 10게임 → 1~4 페어A, 5~8 페어B, 9~10 페어C
export type SeedGames = Record<1 | 2 | 3 | 4, number>;

export function seedGamesForMatch(scoreA: number, scoreB: number): SeedGames {
  const total = scoreA + scoreB;
  const clamp = (n: number) => Math.max(0, Math.min(4, n));
  const a = clamp(total); // 1~4게임
  const b = clamp(total - 4); // 5~8게임
  const c = clamp(total - 8); // 9~12게임
  // 페어A = 시드2+4, 페어B = 시드1+3, 페어C = 시드1+2
  return { 1: b + c, 2: a + c, 3: b, 4: a };
}

// 한 경기에서 페어 블록별로 뛴 게임 수 (A: 1~4, B: 5~8, C: 9~12)
export function pairBlocks(
  scoreA: number,
  scoreB: number,
): { a: number; b: number; c: number; total: number } {
  const total = scoreA + scoreB;
  const clamp = (n: number) => Math.max(0, Math.min(4, n));
  return { a: clamp(total), b: clamp(total - 4), c: clamp(total - 8), total };
}

export type PlayerLoad = {
  seed: 1 | 2 | 3 | 4;
  name: string;
  games: number; // 끝난 경기에서 실제 뛴 게임 합
  teamGames: number; // 팀이 치른 총 게임 (끝난 경기)
  perMatch: { matchNo: number; label: string; games: number }[];
};

export function teamPlayerLoad(
  matches: ResolvedMatch[],
  team: TeamEntry,
): PlayerLoad[] {
  const done = matches.filter(
    (m) =>
      m.status === "done" &&
      m.scoreA !== null &&
      m.scoreB !== null &&
      (m.teamA?.seed === team.seed || m.teamB?.seed === team.seed),
  );
  const teamGames = done.reduce((sum, m) => sum + m.scoreA! + m.scoreB!, 0);
  return ([1, 2, 3, 4] as const).map((seed) => {
    const player = playerAtSeed(team, seed);
    const perMatch = done.map((m) => ({
      matchNo: m.template.no,
      label: m.template.label,
      games: seedGamesForMatch(m.scoreA!, m.scoreB!)[seed],
    }));
    return {
      seed,
      name: player?.name || `시드 ${seed}`,
      games: perMatch.reduce((sum, x) => sum + x.games, 0),
      teamGames,
      perMatch,
    };
  });
}
