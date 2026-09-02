"use client";

import { useState } from "react";
import { outcomeForA } from "../standings";
import { describeTiming, elapsedOf, type MatchTiming, type Timeline } from "../timeline";
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
  StPlayerLine,
  StReorderBtn,
  StSaveBtn,
  StScoreColon,
  StScoreInput,
  StScoreRow,
  StStateBadge,
  StTag,
  StTeam,
  StTeamLabel,
  StTeams,
  StTiming,
  StVs,
  StYears,
} from "../page.styles";
import {
  GENDER_COLOR,
  GENDER_LABEL,
  MATCH_TYPE_COLOR,
  MATCH_TYPE_LABEL,
  isFinished,
  type Court,
  type Match,
  type MatchScore,
  type Player,
} from "../types";

type Props = {
  match: Match;
  players: Map<string, Player>;
  score: MatchScore | null;
  timing: MatchTiming;
  timeline: Timeline;
  courts: Court[];
  busy: boolean;
  // 순서 바꾸기 모드일 때만 위/아래 버튼이 보인다
  reorder?: { canUp: boolean; canDown: boolean; onUp: () => void; onDown: () => void };
  onStart: (matchNo: number, court: Court) => Promise<void>;
  onSave: (matchNo: number, scoreA: number, scoreB: number) => Promise<void>;
  onClear: (matchNo: number) => Promise<void>;
};

const STATE_LABEL = {
  done: "완료",
  playing: "진행 중",
  ready: "지금 시작 가능",
  waiting: "대기",
} as const;

function parseGames(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 99) return null;
  return n;
}

export default function MatchCard({
  match,
  players,
  score,
  timing,
  timeline,
  courts,
  busy,
  reorder,
  onStart,
  onSave,
  onClear,
}: Props) {
  const elapsed = elapsedOf(timeline, timing);
  const finished = score !== null && isFinished(score);
  const [a, setA] = useState(finished && score ? String(score.scoreA) : "");
  const [b, setB] = useState(finished && score ? String(score.scoreB) : "");
  const [editingScore, setEditingScore] = useState(false);

  // 다른 사람이 넣은 점수가 새로 내려오면 입력칸도 맞춘다 (값이 같으면 건드리지 않음)
  const scoreKey = finished && score ? `${score.scoreA}:${score.scoreB}` : "";
  const [syncedKey, setSyncedKey] = useState(scoreKey);
  if (syncedKey !== scoreKey) {
    setSyncedKey(scoreKey);
    setA(finished && score ? String(score.scoreA) : "");
    setB(finished && score ? String(score.scoreB) : "");
    setEditingScore(false);
  }

  const parsedA = parseGames(a);
  const parsedB = parseGames(b);
  const ready = parsedA !== null && parsedB !== null;
  const dirty =
    ready && (!finished || !score || score.scoreA !== parsedA || score.scoreB !== parsedB);

  const outcome = finished && score ? outcomeForA(score) : null;
  const color = MATCH_TYPE_COLOR[match.type];
  const state = timing.status;

  function renderTeam(names: [string, string], side: "A" | "B") {
    const winner =
      outcome === null || outcome === "draw"
        ? false
        : (outcome === "win" && side === "A") || (outcome === "loss" && side === "B");
    return (
      <StTeam $winner={!finished || winner} $align={side === "A" ? "left" : "right"}>
        <StTeamLabel $color={color}>{side}팀{winner ? " · 승" : ""}</StTeamLabel>
        {names.map((name) => {
          const player = players.get(name);
          return (
            <StPlayerLine key={name} $strong={winner}>
              {name}
              {player ? (
                <>
                  <StTag $color={GENDER_COLOR[player.gender]}>
                    {GENDER_LABEL[player.gender]}
                  </StTag>
                  <StYears>
                    {player.years}년{player.team ? ` · ${player.team}` : ""}
                  </StYears>
                </>
              ) : null}
            </StPlayerLine>
          );
        })}
      </StTeam>
    );
  }

  const showScoreInputs = state === "playing" || (finished && editingScore);

  return (
    <StMatch $color={color} $state={state}>
      <StMatchMeta>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
          <StOrderNo>{timing.position}</StOrderNo>
          <span>
            {MATCH_TYPE_LABEL[match.type]}
            {match.round ? ` · 계획 R${match.round}${match.court ? ` ${match.court}` : ""}` : ""}
          </span>
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
          {reorder ? (
            <>
              <StReorderBtn type="button" disabled={!reorder.canUp || busy} onClick={reorder.onUp} aria-label="위로">
                ▲
              </StReorderBtn>
              <StReorderBtn type="button" disabled={!reorder.canDown || busy} onClick={reorder.onDown} aria-label="아래로">
                ▼
              </StReorderBtn>
            </>
          ) : null}
          {state === "playing" ? (
            <StLiveBadge>
              <StLiveDot /> LIVE <StBall>🎾</StBall>
            </StLiveBadge>
          ) : (
            <StStateBadge $state={state}>
              {state === "ready" ? "▶ " : state === "done" ? "✓ " : "⏳ "}
              {state === "done" && outcome === "draw" ? "무승부" : STATE_LABEL[state]}
            </StStateBadge>
          )}
        </span>
      </StMatchMeta>

      <StTiming
        $tone={
          state === "done" ? "done" : state === "playing" ? "playing" : state === "ready" ? "shifted" : "plain"
        }
      >
        ⏱ {describeTiming(timing)}
      </StTiming>

      <StTeams>
        {renderTeam(match.teamA, "A")}
        <StVs>{state === "playing" ? "⚡" : "vs"}</StVs>
        {renderTeam(match.teamB, "B")}
      </StTeams>

      {elapsed ? (
        <>
          <StElapsed>
            <span>🔥 경기 중 · {elapsed.minutes}분 경과</span>
            <span>
              {elapsed.ratio >= 1
                ? "예정 시간 지남 · 점수 넣어 주세요"
                : `남은 예상 ${Math.max(0, timeline.minutesPerMatch - elapsed.minutes)}분`}
            </span>
          </StElapsed>
          <StElapsedTrack>
            <StElapsedFill $ratio={elapsed.ratio} />
          </StElapsedTrack>
        </>
      ) : null}

      {state === "ready" || state === "waiting" ? (
        <StScoreRow>
          {courts.map((court) => (
            <StCourtPick
              key={court}
              type="button"
              $primary={court === timing.court && state === "ready"}
              disabled={busy || state !== "ready"}
              onClick={() => void onStart(match.no, court)}
            >
              ▶ 코트 {court}에서 시작
            </StCourtPick>
          ))}
        </StScoreRow>
      ) : null}

      {finished && score && !editingScore ? (
        <StFinalScore>
          <span>{score.scoreA}</span>
          <StScoreColon>:</StScoreColon>
          <span>{score.scoreB}</span>
          <StGhostBtn type="button" disabled={busy} onClick={() => setEditingScore(true)}>
            고치기
          </StGhostBtn>
        </StFinalScore>
      ) : null}

      {showScoreInputs ? (
        <StScoreRow>
          <StScoreInput
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            placeholder="A"
            aria-label="A팀 게임 수"
            value={a}
            onChange={(e) => setA(e.target.value)}
          />
          <StScoreColon>:</StScoreColon>
          <StScoreInput
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            placeholder="B"
            aria-label="B팀 게임 수"
            value={b}
            onChange={(e) => setB(e.target.value)}
          />
          <StSaveBtn
            type="button"
            disabled={busy || !dirty}
            onClick={() => {
              if (parsedA === null || parsedB === null) return;
              void onSave(match.no, parsedA, parsedB);
            }}
          >
            {finished ? "점수 고치기" : "경기 끝 · 점수 저장"}
          </StSaveBtn>
          {finished ? (
            <StGhostBtn type="button" disabled={busy} onClick={() => setEditingScore(false)}>
              취소
            </StGhostBtn>
          ) : null}
          <StGhostBtn type="button" disabled={busy} onClick={() => void onClear(match.no)}>
            {finished ? "기록 지우기" : "시작 취소"}
          </StGhostBtn>
        </StScoreRow>
      ) : null}
    </StMatch>
  );
}
