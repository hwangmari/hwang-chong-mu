// 템플릿 + 지금까지의 점수 → 각 경기의 팀·상태·승자, 최종 순위 (순수 함수)
import { isFinished, type MatchScore, type ScoreMap } from "../types";
import { BLOCKS, DOUBLE_ELIM_8 } from "./template";
import type {
  Placement,
  ResolvedMatch,
  ScheduleBlock,
  SlotRef,
  TeamEntry,
  TemplateMatch,
  TournamentEvent,
} from "./types";
import { roundTime } from "../format";

function winnerOf(score: MatchScore | undefined): "A" | "B" | null {
  if (!score || !isFinished(score)) return null;
  if (score.scoreA === score.scoreB) return null; // 동점은 승자 없음(입력 오류로 본다)
  return score.scoreA > score.scoreB ? "A" : "B";
}

export function resolveBracket(event: TournamentEvent, scores: ScoreMap): ResolvedMatch[] {
  const bySeed = new Map(event.teams.map((t) => [t.seed, t]));
  const resolved = new Map<number, ResolvedMatch>();
  // 지금 뛰고 있는 팀은 다른 경기를 시작할 수 없다 (뒤에서 status를 정할 때 쓴다)
  const playingTeams = new Set<number>();
  const labelOf = (m: TemplateMatch | undefined) => (m ? `${m.label} ${m.no}번` : "?");

  const refTeam = (ref: SlotRef): { team: TeamEntry | null; label: string } => {
    if (ref.kind === "seed") {
      return { team: bySeed.get(ref.seed) ?? null, label: `${ref.seed}번 시드` };
    }
    const prev = resolved.get(ref.of);
    const prevTemplate = DOUBLE_ELIM_8.find((m) => m.no === ref.of);
    if (!prev) return { team: null, label: labelOf(prevTemplate) };
    const team = ref.kind === "winner" ? prev.winner : prev.loser;
    return { team, label: `${labelOf(prevTemplate)} ${ref.kind === "winner" ? "승자" : "패자"}` };
  };

  for (const template of DOUBLE_ELIM_8) {
    const a = refTeam(template.a);
    const b = refTeam(template.b);
    const score = scores[template.no];
    const w = winnerOf(score);

    let status: ResolvedMatch["status"];
    if (template.conditional === "reset") {
      // 그랜드 파이널을 패자조 출신(B팀)이 이겼을 때만 열린다
      const gf = resolved.get(16);
      const needed = gf?.winner !== null && gf?.winner === gf?.teamB;
      if (!needed) status = "hidden";
      else if (w) status = "done";
      else if (score?.startedAt) status = "playing";
      else status = "ready";
    } else if (w) status = "done";
    else if (score?.startedAt) status = "playing";
    else if (a.team && b.team && !playingTeams.has(a.team.seed) && !playingTeams.has(b.team.seed)) status = "ready";
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
  const gf = by.get(16);
  const reset = by.get(18);
  // 리셋이 열렸으면 리셋 결과가 최종, 아니면 그랜드 파이널 결과
  const finalMatch = reset && reset.status !== "hidden" ? reset : gf;
  const champion = finalMatch?.status === "done" ? finalMatch.winner : null;
  const runnerUp = finalMatch?.status === "done" ? finalMatch.loser : null;
  const m17 = by.get(17);
  const m14 = by.get(14);
  const m12 = by.get(12);
  return [
    { rank: 1, team: champion, how: reset && reset.status !== "hidden" ? "리셋 재경기 승" : "그랜드 파이널 승" },
    { rank: 2, team: runnerUp, how: "그랜드 파이널 패" },
    { rank: 3, team: m17?.winner ?? null, how: "3-4위전 승" },
    { rank: 4, team: m17?.loser ?? null, how: "3-4위전 패" },
    { rank: 5, team: m14?.winner ?? null, how: "5-6위전 승" },
    { rank: 6, team: m14?.loser ?? null, how: "5-6위전 패" },
    { rank: 7, team: m12?.winner ?? null, how: "7-8위전 승" },
    { rank: 8, team: m12?.loser ?? null, how: "7-8위전 패" },
  ];
}

export function scheduleBlocks(event: TournamentEvent): ScheduleBlock[] {
  return BLOCKS.map((b, i) => ({ ...b, time: roundTime(event.startTime, event.minutesPerMatch, i) }));
}

// 한 팀의 여정: 참가한 경기와 결과
export function teamPath(matches: ResolvedMatch[], team: TeamEntry) {
  return matches
    .filter((m) => m.status !== "hidden" && (m.teamA?.seed === team.seed || m.teamB?.seed === team.seed))
    .map((m) => {
      const side = m.teamA?.seed === team.seed ? "A" : "B";
      const opponent = side === "A" ? m.teamB : m.teamA;
      const outcome = m.status !== "done" ? null : m.winner?.seed === team.seed ? "win" : "loss";
      return { match: m, side, opponent, outcome } as const;
    });
}

export function countFinishedTournament(matches: ResolvedMatch[]) {
  const visible = matches.filter((m) => m.status !== "hidden");
  return { done: visible.filter((m) => m.status === "done").length, total: visible.length };
}
