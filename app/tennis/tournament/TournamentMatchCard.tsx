"use client";

import { useState } from "react";
import { toClock } from "../format";
import {
  StBall,
  StCourtPick,
  StElapsed,
  StElapsedFill,
  StElapsedTrack,
  StFinalScore,
  StGhostBtn,
  StLiveBadge,
  StLiveDot,
  StMatch,
  StMatchMeta,
  StOrderNo,
  StPairRotation,
  StPlayedTime,
  StSaveBtn,
  StScoreColon,
  StScoreInput,
  StScoreRow,
  StSeedTag,
  StStateBadge,
  StTeam,
  StTeamLabel,
  StTeamName,
  StTeams,
  StTiming,
  StVs,
} from "../page.styles";
import { playedMinutes } from "../timeline";
import { matchCardId } from "../jump";
import type { Court, MatchScore } from "../types";
import { PAIR_ROTATION, STAGE_COLOR, type ResolvedMatch, type TeamEntry } from "./types";

type Props = {
  match: ResolvedMatch;
  score: MatchScore | null;
  blockTime: string; // "13:00 — 13:30"
  gamesToWin: number;
  clock: number; // 현재 시각(분)
  courts: Court[]; // 이 대회의 코트들
  occupied: Set<Court>; // 지금 경기 중인 코트
  busy: boolean;
  onStart: (matchNo: number, court: Court) => Promise<void>;
  onSave: (matchNo: number, scoreA: number, scoreB: number, tiebreak: [number, number] | null) => Promise<void>;
  onClear: (matchNo: number) => Promise<void>;
};

function parseGames(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 20 ? n : null;
}

function isoToMinutes(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

// 팀의 페어 구성: 시드 번호 → 선수 이름
function pairNames(team: TeamEntry | null, seeds: [number, number]) {
  if (!team) return "-";
  return seeds
    .map((sd) => team.players.find((p) => p.seed === sd)?.name || `시드${sd}`)
    .join(" · ");
}

export default function TournamentMatchCard({
  match,
  score,
  blockTime,
  gamesToWin,
  clock,
  courts,
  occupied,
  busy,
  onStart,
  onSave,
  onClear,
}: Props) {
  const done = match.status === "done";
  const [a, setA] = useState(done && match.scoreA !== null ? String(match.scoreA) : "");
  const [b, setB] = useState(done && match.scoreB !== null ? String(match.scoreB) : "");
  const [tbA, setTbA] = useState(score?.tiebreakA !== undefined ? String(score.tiebreakA) : "");
  const [tbB, setTbB] = useState(score?.tiebreakB !== undefined ? String(score.tiebreakB) : "");
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const key = done ? `${match.scoreA}:${match.scoreB}:${score?.tiebreakA ?? ""}:${score?.tiebreakB ?? ""}` : "";
  const [synced, setSynced] = useState(key);
  if (synced !== key) {
    setSynced(key);
    setA(done && match.scoreA !== null ? String(match.scoreA) : "");
    setB(done && match.scoreB !== null ? String(match.scoreB) : "");
    setTbA(score?.tiebreakA !== undefined ? String(score.tiebreakA) : "");
    setTbB(score?.tiebreakB !== undefined ? String(score.tiebreakB) : "");
    setEditing(false);
  }

  const parsedA = parseGames(a);
  const parsedB = parseGames(b);
  const needsTiebreak =
    parsedA !== null && parsedB !== null && Math.max(parsedA, parsedB) === gamesToWin && Math.min(parsedA, parsedB) === gamesToWin - 1;

  function validate(): string {
    if (parsedA === null || parsedB === null) return "양 팀 게임 수를 넣어 주세요.";
    if (parsedA === parsedB) return "동점으로는 저장할 수 없어요. 승자가 정해져야 해요.";
    const hi = Math.max(parsedA, parsedB);
    const lo = Math.min(parsedA, parsedB);
    if (hi !== gamesToWin) return `${gamesToWin}게임 선취예요. 이긴 팀은 ${gamesToWin}게임이어야 해요.`;
    if (lo > gamesToWin - 1) return `진 팀은 최대 ${gamesToWin - 1}게임이에요.`;
    if (needsTiebreak) {
      const ta = parseGames(tbA);
      const tb = parseGames(tbB);
      if ((tbA.trim() || tbB.trim()) && (ta === null || tb === null)) return "타이브레이크 점수는 둘 다 넣거나 둘 다 비워 주세요.";
      if (ta !== null && tb !== null && (ta === tb || Math.max(ta, tb) < 7)) return "타이브레이크는 7점 선취예요. 예) 7-4";
      if (ta !== null && tb !== null && (ta > tb) !== (parsedA > parsedB)) return "타이브레이크 승자와 게임 승자가 달라요.";
    }
    return "";
  }

  const state = match.status === "hidden" ? "waiting" : match.status;
  const color = STAGE_COLOR[match.template.stage];
  const elapsed =
    match.status === "playing" && score?.startedAt
      ? Math.max(0, clock - isoToMinutes(score.startedAt))
      : null;

  const renderTeam = (team: TeamEntry | null, label: string, side: "A" | "B") => {
    const winner = done && match.winner?.seed === team?.seed && team !== null;
    return (
      <StTeam $winner={!done || winner} $align={side === "A" ? "left" : "right"}>
        <StTeamLabel $color={color}>{side}팀{winner ? " · 승" : ""}</StTeamLabel>
        {team ? (
          <StTeamName>
            <StSeedTag>#{team.seed}</StSeedTag> {team.name}
          </StTeamName>
        ) : (
          <StTeamName $muted>{label}</StTeamName>
        )}
      </StTeam>
    );
  };

  return (
    <StMatch id={matchCardId(match.template.no)} $color={color} $state={state} data-match-no={match.template.no} data-state={match.status}>
      <StMatchMeta>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <StOrderNo>{match.template.no}</StOrderNo>
          <span>
            {match.template.label}
            {score?.court ? ` · 코트 ${score.court}` : ` · 계획 코트 ${match.template.court}`}
          </span>
        </span>
        {match.status === "playing" ? (
          <StLiveBadge>
            <StLiveDot /> LIVE <StBall>🎾</StBall>
          </StLiveBadge>
        ) : (
          <StStateBadge $state={state}>
            {match.status === "done" ? "✓ 완료" : match.status === "ready" ? "▶ 시작 가능" : "⏳ 앞 경기 대기"}
          </StStateBadge>
        )}
      </StMatchMeta>

      <StTiming $tone={done ? "done" : match.status === "playing" ? "playing" : "plain"}>
        ⏱ 예정 {blockTime}
        {score?.startedAt ? ` · ${toClock(isoToMinutes(score.startedAt))} 시작` : ""}
        {done && score ? (() => { const m = playedMinutes(score); return m !== null ? ` · ${m}분 플레이` : ""; })() : ""}
      </StTiming>

      <StTeams>
        {renderTeam(match.teamA, match.aLabel, "A")}
        <StVs>{match.status === "playing" ? "⚡" : "vs"}</StVs>
        {renderTeam(match.teamB, match.bLabel, "B")}
      </StTeams>

      {match.teamA && match.teamB && !done ? (
        <StPairRotation>
          <b>순서</b>
          <b>{match.teamA.name}</b>
          <b>{match.teamB.name}</b>
          {PAIR_ROTATION.map((r) => (
            <div key={r.key} style={{ display: "contents" }}>
              <span>
                페어{r.key} <em style={{ fontStyle: "normal" }}>({r.games})</em>
              </span>
              <span className="names">{pairNames(match.teamA, r.seeds)}</span>
              <span className="names">{pairNames(match.teamB, r.seeds)}</span>
            </div>
          ))}
        </StPairRotation>
      ) : null}

      {elapsed !== null ? (
        <>
          <StElapsed>
            <span>🔥 경기 중 · {elapsed}분 경과</span>
            <span>{elapsed >= 30 ? "예정 시간 지남 · 점수 넣어 주세요" : `남은 예상 ${30 - elapsed}분`}</span>
          </StElapsed>
          <StElapsedTrack>
            <StElapsedFill $ratio={Math.min(1, elapsed / 30)} />
          </StElapsedTrack>
        </>
      ) : null}

      {match.status === "ready" ? (
        <StScoreRow>
          {courts.map((court) => {
            const free = !occupied.has(court);
            return (
              <StCourtPick
                key={court}
                type="button"
                $primary={free && court === match.template.court}
                disabled={busy || !free}
                title={free ? undefined : "이 코트는 경기 중이에요"}
                onClick={() => void onStart(match.template.no, court)}
              >
                ▶ 코트 {court}
              </StCourtPick>
            );
          })}
        </StScoreRow>
      ) : null}

      {done && !editing ? (
        <>
          <StFinalScore>
            <span>{match.scoreA}</span>
            <StScoreColon>:</StScoreColon>
            <span>{match.scoreB}</span>
            <StGhostBtn type="button" disabled={busy} onClick={() => setEditing(true)}>
              고치기
            </StGhostBtn>
          </StFinalScore>
          {score?.tiebreakA !== undefined && score?.tiebreakB !== undefined ? (
            <StPlayedTime $known>
              타이브레이크 {score.tiebreakA} - {score.tiebreakB}
            </StPlayedTime>
          ) : null}
        </>
      ) : null}

      {match.status === "playing" || (done && editing) ? (
        <>
          <StScoreRow>
            <StScoreInput type="number" inputMode="numeric" min={0} max={20} placeholder="A" aria-label="A팀 게임" value={a} onChange={(e) => setA(e.target.value)} />
            <StScoreColon>:</StScoreColon>
            <StScoreInput type="number" inputMode="numeric" min={0} max={20} placeholder="B" aria-label="B팀 게임" value={b} onChange={(e) => setB(e.target.value)} />
            {needsTiebreak ? (
              <>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>타이브레이크</span>
                <StScoreInput type="number" inputMode="numeric" min={0} max={30} placeholder="7" aria-label="A팀 타이브레이크" value={tbA} onChange={(e) => setTbA(e.target.value)} />
                <StScoreColon>-</StScoreColon>
                <StScoreInput type="number" inputMode="numeric" min={0} max={30} placeholder="4" aria-label="B팀 타이브레이크" value={tbB} onChange={(e) => setTbB(e.target.value)} />
              </>
            ) : null}
          </StScoreRow>
          <StScoreRow>
            <StSaveBtn
              type="button"
              disabled={busy}
              onClick={() => {
                const msg = validate();
                setError(msg);
                if (msg || parsedA === null || parsedB === null) return;
                const ta = parseGames(tbA);
                const tb = parseGames(tbB);
                void onSave(match.template.no, parsedA, parsedB, needsTiebreak && ta !== null && tb !== null ? [ta, tb] : null);
              }}
            >
              {done ? "점수 고치기" : "경기 끝 · 점수 저장"}
            </StSaveBtn>
            {done ? (
              <StGhostBtn type="button" disabled={busy} onClick={() => setEditing(false)}>
                취소
              </StGhostBtn>
            ) : null}
            <StGhostBtn type="button" disabled={busy} onClick={() => void onClear(match.template.no)}>
              {done ? "기록 지우기" : "시작 취소"}
            </StGhostBtn>
          </StScoreRow>
          {error ? <StTiming $tone="shifted">⚠️ {error}</StTiming> : null}
          <StTiming $tone="plain">
            {gamesToWin}게임 선취 · 5:5면 7점 타이브레이크 (이긴 팀 {gamesToWin}:{gamesToWin - 1}로 적고 타이브레이크 점수를 함께)
          </StTiming>
        </>
      ) : null}
    </StMatch>
  );
}
