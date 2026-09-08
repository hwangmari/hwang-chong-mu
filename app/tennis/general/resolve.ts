// 저장된 대진 + 지금까지의 점수 → 각 경기의 팀·상태·승자 (순수 함수).
// 조 순위 자리("A조 1위")는 그 조 경기가 다 끝났을 때만 실제 팀으로 바뀐다.
import { roundTime } from "../format";
import { isFinished, type MatchScore, type ScoreMap } from "../types";
import { buildKnockoutFromGroups as buildKoMatches, assignBlocks } from "./generate";
import { buildStandings, groupFinished } from "./standings";
import type {
  GeneralEvent,
  GeneralMatch,
  GeneralSlot,
  GeneralTeam,
  ResolvedGeneralMatch,
  TeamStanding,
} from "./types";

function winnerOf(score: MatchScore | undefined): "A" | "B" | null {
  if (!score || !isFinished(score)) return null;
  if (score.scoreA === score.scoreB) return null; // 동점은 승자 없음(입력 오류로 본다)
  return score.scoreA > score.scoreB ? "A" : "B";
}

// 조별 순위표 (조가 있을 때만). 결선 자리를 채우는 데도 쓴다
export function groupStandings(
  event: GeneralEvent,
  scores: ScoreMap,
): Map<string, TeamStanding[]> {
  const byId = new Map(event.teams.map((t) => [t.id, t]));
  const map = new Map<string, TeamStanding[]>();
  for (const group of event.groups) {
    const teams = group.teamIds
      .map((id) => byId.get(id))
      .filter((t): t is GeneralTeam => t !== undefined);
    const matches = event.matches.filter((m) => m.groupId === group.id);
    map.set(
      group.id,
      buildStandings(teams, matches, scores, {
        groupId: group.id,
        advance: event.settings.advancePerGroup,
      }),
    );
  }
  return map;
}

// 풀리그 순위표 (league 모드)
export function leagueStandings(event: GeneralEvent, scores: ScoreMap): TeamStanding[] {
  return buildStandings(
    event.teams,
    event.matches.filter((m) => m.stage === "league"),
    scores,
  );
}

export function resolveGeneral(event: GeneralEvent, scores: ScoreMap): ResolvedGeneralMatch[] {
  const byId = new Map(event.teams.map((t) => [t.id, t]));
  const byNo = new Map(event.matches.map((m) => [m.no, m]));
  const standings = groupStandings(event, scores);
  const resolved = new Map<number, ResolvedGeneralMatch>();
  const playingTeams = new Set<string>();

  const labelOf = (no: number) => {
    const m = byNo.get(no);
    return m ? `${m.label} ${m.no}번` : `${no}번`;
  };

  const refTeam = (slot: GeneralSlot): { team: GeneralTeam | null; label: string } => {
    if (slot.kind === "team") {
      const team = byId.get(slot.teamId) ?? null;
      return { team, label: team?.name ?? "팀 없음" };
    }
    if (slot.kind === "bye") return { team: null, label: "부전승 (빈자리)" };
    if (slot.kind === "groupRank") {
      const label = `${slot.group}조 ${slot.rank}위`;
      if (!groupFinished(event.matches, scores, slot.group)) return { team: null, label };
      const rows = standings.get(slot.group) ?? [];
      return { team: rows[slot.rank - 1]?.team ?? null, label };
    }
    const prev = resolved.get(slot.of);
    const label = `${labelOf(slot.of)} ${slot.kind === "winner" ? "승자" : "패자"}`;
    if (!prev) return { team: null, label };
    return { team: slot.kind === "winner" ? prev.winner : prev.loser, label };
  };

  for (const match of event.matches) {
    const a = refTeam(match.a);
    const b = refTeam(match.b);
    const score = scores[match.no];
    const w = winnerOf(score);

    let status: ResolvedGeneralMatch["status"];
    if (w) status = "done";
    else if (score?.startedAt) status = "playing";
    else if (
      a.team &&
      b.team &&
      !playingTeams.has(a.team.id) &&
      !playingTeams.has(b.team.id)
    )
      status = "ready";
    else status = "waiting";

    if (status === "playing") {
      if (a.team) playingTeams.add(a.team.id);
      if (b.team) playingTeams.add(b.team.id);
    }

    resolved.set(match.no, {
      match,
      teamA: a.team,
      teamB: b.team,
      aLabel: a.label,
      bLabel: b.label,
      status,
      winner: w === "A" ? a.team : w === "B" ? b.team : null,
      loser: w === "A" ? b.team : w === "B" ? a.team : null,
      scoreA: score && isFinished(score) ? score.scoreA : null,
      scoreB: score && isFinished(score) ? score.scoreB : null,
    });
  }

  return event.matches.map((m) => resolved.get(m.no)!);
}

export function countFinishedGeneral(matches: ResolvedGeneralMatch[]) {
  return { done: matches.filter((m) => m.status === "done").length, total: matches.length };
}

// 블록(타임) 번호 → "13:00 — 13:30"
export function blockTimeOf(event: GeneralEvent, block: number): string {
  return roundTime(event.startTime, event.minutesPerMatch, Math.max(0, block - 1));
}

export function blockNumbers(matches: GeneralMatch[]): number[] {
  return [...new Set(matches.map((m) => m.block))].sort((x, y) => x - y);
}

// 예상 종료 시각: 마지막 블록이 끝나는 시각
export function expectedEnd(event: GeneralEvent): string {
  const last = event.matches.reduce((m, x) => Math.max(m, x.block), 0);
  return roundTime(event.startTime, event.minutesPerMatch, Math.max(0, last - 1)).split(" — ")[1] ?? event.startTime;
}

// 한 팀의 여정: 참가한 경기와 결과
export function teamPath(matches: ResolvedGeneralMatch[], team: GeneralTeam) {
  return matches
    .filter((m) => m.teamA?.id === team.id || m.teamB?.id === team.id)
    .map((m) => {
      const side = m.teamA?.id === team.id ? "A" : "B";
      const opponent = side === "A" ? m.teamB : m.teamA;
      const outcome = m.status !== "done" ? null : m.winner?.id === team.id ? "win" : "loss";
      return { match: m, side, opponent, outcome } as const;
    });
}

// 조별 경기가 전부 끝났는지 (결선을 만들 수 있는지)
export function groupsAllFinished(event: GeneralEvent, scores: ScoreMap): boolean {
  const groupMatches = event.matches.filter((m) => m.stage === "group");
  return groupMatches.length > 0 && groupMatches.every((m) => isFinished(scores[m.no]));
}

// 조별 → 결선 대진 만들기. 조별 경기는 그대로 두고 뒤에 붙일 경기만 돌려준다
export function buildKnockoutMatches(event: GeneralEvent): GeneralMatch[] {
  const groupMatches = event.matches.filter((m) => m.stage === "group");
  const ko = buildKoMatches(event.groups, event.settings);
  assignBlocks(ko, event.courts, groupMatches);
  return ko;
}

// 결선 점수가 하나라도 있으면 다시 만들 수 없다
export function hasKnockoutScores(event: GeneralEvent, scores: ScoreMap): boolean {
  return event.matches.some((m) => m.stage === "ko" && scores[m.no] !== undefined);
}
