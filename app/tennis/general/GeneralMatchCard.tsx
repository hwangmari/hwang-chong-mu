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
  StTeamSubName,
  StTeams,
  StTiming,
  StVs,
} from "../page.styles";
import { playedMinutes } from "../timeline";
import { matchCardId } from "../jump";
import { validateGameScore } from "../score";
import type { Court, MatchScore } from "../types";
import { STAGE_COLOR, type GeneralTeam, type ResolvedGeneralMatch } from "./types";

type Props = {
  match: ResolvedGeneralMatch;
  score: MatchScore | null;
  blockTime: string; // "13:00 — 13:30"
  gamesToWin: number;
  minutesPerMatch: number;
  clock: number; // 현재 시각(분)
  courts: Court[];
  occupied: Set<Court>;
  busy: boolean;
  onStart: (matchNo: number, court: Court) => Promise<void>;
  onSave: (matchNo: number, scoreA: number, scoreB: number, tiebreak: [number, number] | null) => Promise<void>;
  onClear: (matchNo: number) => Promise<void>;
};

function isoToMinutes(iso: string) {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export default function GeneralMatchCard({
  match,
  score,
  blockTime,
  gamesToWin,
  minutesPerMatch,
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

  // 저장된 점수가 바뀌면(다른 사람이 넣었을 때) 입력칸을 그 값으로 맞춘다
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

  const check = validateGameScore({ a, b, tbA, tbB, gamesToWin });
  const needsTiebreak = check.needsTiebreak;
  const color = STAGE_COLOR[match.match.stage];
  const elapsed =
    match.status === "playing" && score?.startedAt
      ? Math.max(0, clock - isoToMinutes(score.startedAt))
      : null;

  const renderTeam = (team: GeneralTeam | null, label: string, side: "A" | "B") => {
    const winner = done && team !== null && match.winner?.id === team.id;
    return (
      <StTeam $winner={!done || winner} $align={side === "A" ? "left" : "right"}>
        <StTeamLabel $color={color}>
          {side}팀{winner ? " · 승" : ""}
        </StTeamLabel>
        {team ? (
          <StTeamName>
            <StSeedTag>#{team.seed}</StSeedTag> {team.name}
            {team.players.length > 0 ? <StTeamSubName>{team.players.join(" · ")}</StTeamSubName> : null}
          </StTeamName>
        ) : (
          <StTeamName $muted>{label}</StTeamName>
        )}
      </StTeam>
    );
  };

  return (
    <StMatch
      id={matchCardId(match.match.no)}
      $color={color}
      $state={match.status}
      data-match-no={match.match.no}
      data-state={match.status}
    >
      <StMatchMeta>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <StOrderNo $wide={match.match.no >= 100}>{match.match.no}</StOrderNo>
          <span>
            {match.match.label}
            {score?.court ? ` · 코트 ${score.court}` : ` · 계획 코트 ${match.match.court}`}
          </span>
        </span>
        {match.status === "playing" ? (
          <StLiveBadge>
            <StLiveDot /> LIVE <StBall>🎾</StBall>
          </StLiveBadge>
        ) : (
          <StStateBadge $state={match.status}>
            {match.status === "done" ? "✓ 완료" : match.status === "ready" ? "▶ 시작 가능" : "⏳ 앞 경기 대기"}
          </StStateBadge>
        )}
      </StMatchMeta>

      <StTiming $tone={done ? "done" : match.status === "playing" ? "playing" : "plain"}>
        ⏱ 예정 {blockTime}
        {score?.startedAt ? ` · ${toClock(isoToMinutes(score.startedAt))} 시작` : ""}
        {done && score
          ? (() => {
              const m = playedMinutes(score);
              return m !== null ? ` · ${m}분 플레이` : "";
            })()
          : ""}
      </StTiming>

      <StTeams>
        {renderTeam(match.teamA, match.aLabel, "A")}
        <StVs>{match.status === "playing" ? "⚡" : "vs"}</StVs>
        {renderTeam(match.teamB, match.bLabel, "B")}
      </StTeams>

      {elapsed !== null ? (
        <>
          <StElapsed>
            <span>🔥 경기 중 · {elapsed}분 경과</span>
            <span>
              {elapsed >= minutesPerMatch
                ? "예정 시간 지남 · 점수 넣어 주세요"
                : `남은 예상 ${minutesPerMatch - elapsed}분`}
            </span>
          </StElapsed>
          <StElapsedTrack>
            <StElapsedFill $ratio={Math.min(1, elapsed / Math.max(1, minutesPerMatch))} />
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
                $primary={free && court === match.match.court}
                disabled={busy || !free}
                title={free ? undefined : "이 코트는 경기 중이에요"}
                onClick={() => void onStart(match.match.no, court)}
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
            <StScoreInput
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              placeholder="A"
              aria-label="A팀 게임"
              value={a}
              onChange={(e) => setA(e.target.value)}
            />
            <StScoreColon>:</StScoreColon>
            <StScoreInput
              type="number"
              inputMode="numeric"
              min={0}
              max={20}
              placeholder="B"
              aria-label="B팀 게임"
              value={b}
              onChange={(e) => setB(e.target.value)}
            />
            {needsTiebreak ? (
              <>
                <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#64748b" }}>타이브레이크</span>
                <StScoreInput
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={30}
                  placeholder="7"
                  aria-label="A팀 타이브레이크"
                  value={tbA}
                  onChange={(e) => setTbA(e.target.value)}
                />
                <StScoreColon>-</StScoreColon>
                <StScoreInput
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={30}
                  placeholder="4"
                  aria-label="B팀 타이브레이크"
                  value={tbB}
                  onChange={(e) => setTbB(e.target.value)}
                />
              </>
            ) : null}
          </StScoreRow>
          <StScoreRow>
            <StSaveBtn
              type="button"
              disabled={busy}
              onClick={() => {
                setError(check.error);
                if (check.error || check.a === null || check.b === null) return;
                void onSave(match.match.no, check.a, check.b, check.tiebreak);
              }}
            >
              {done ? "점수 고치기" : "경기 끝 · 점수 저장"}
            </StSaveBtn>
            {done ? (
              <StGhostBtn type="button" disabled={busy} onClick={() => setEditing(false)}>
                취소
              </StGhostBtn>
            ) : null}
            <StGhostBtn type="button" disabled={busy} onClick={() => void onClear(match.match.no)}>
              {done ? "기록 지우기" : "시작 취소"}
            </StGhostBtn>
          </StScoreRow>
          {error ? <StTiming $tone="shifted">⚠️ {error}</StTiming> : null}
          <StTiming $tone="plain">
            {gamesToWin}게임 선취 · 5:5면 7점 타이브레이크 (이긴 팀 {gamesToWin}:{gamesToWin - 1}로 적고 타이브레이크
            점수를 함께)
          </StTiming>
        </>
      ) : null}
    </StMatch>
  );
}
