"use client";

import { useState } from "react";
import { matchLabel } from "../data";
import { outcomeForA } from "../standings";
import { describeTiming, type MatchTiming } from "../timeline";
import {
  StGhostBtn,
  StMatch,
  StMatchMeta,
  StPlayerLine,
  StResultBadge,
  StSaveBtn,
  StScoreColon,
  StScoreInput,
  StScoreRow,
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
  type Match,
  type MatchScore,
  type Player,
} from "../types";

type Props = {
  match: Match;
  players: Map<string, Player>;
  score: MatchScore | null;
  timing?: MatchTiming;
  busy: boolean;
  onSave: (matchNo: number, scoreA: number, scoreB: number) => Promise<void>;
  onClear: (matchNo: number) => Promise<void>;
};

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
  busy,
  onSave,
  onClear,
}: Props) {
  const [a, setA] = useState(score ? String(score.scoreA) : "");
  const [b, setB] = useState(score ? String(score.scoreB) : "");
  // 다른 사람이 넣은 점수가 새로 내려오면 입력칸도 맞춘다 (React 권장: 렌더 중 파생 상태 갱신).
  // 20초마다 다시 읽어도 값이 같으면 건드리지 않아서, 입력 중인 숫자가 날아가지 않는다.
  const scoreKey = score ? `${score.scoreA}:${score.scoreB}` : "";
  const [syncedKey, setSyncedKey] = useState(scoreKey);
  if (syncedKey !== scoreKey) {
    setSyncedKey(scoreKey);
    setA(score ? String(score.scoreA) : "");
    setB(score ? String(score.scoreB) : "");
  }

  const parsedA = parseGames(a);
  const parsedB = parseGames(b);
  const ready = parsedA !== null && parsedB !== null;
  const dirty =
    ready && (!score || score.scoreA !== parsedA || score.scoreB !== parsedB);

  const outcome = score ? outcomeForA(score) : null;
  const color = MATCH_TYPE_COLOR[match.type];

  function renderTeam(names: [string, string], side: "A" | "B") {
    const winner =
      outcome === "draw"
        ? false
        : (outcome === "win" && side === "A") || (outcome === "loss" && side === "B");
    return (
      <StTeam $winner={!score || winner} $align={side === "A" ? "left" : "right"}>
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

  return (
    <StMatch $color={color} $done={Boolean(score)}>
      <StMatchMeta>
        <span>
          {matchLabel(match.no)} · 코트 {match.court} · {MATCH_TYPE_LABEL[match.type]}
        </span>
        {score ? (
          <StResultBadge $tone={outcome === "draw" ? "draw" : "win"}>
            {outcome === "draw" ? "무승부" : "경기 완료"}
          </StResultBadge>
        ) : timing?.status === "playing" ? (
          <StResultBadge $tone="win">진행 중</StResultBadge>
        ) : (
          <StResultBadge $tone="todo">점수 입력 전</StResultBadge>
        )}
      </StMatchMeta>
      {timing ? (
        <StTiming
          $tone={
            timing.status === "done"
              ? "done"
              : timing.status === "playing"
                ? "playing"
                : timing.expectedStart !== timing.plannedStart
                  ? "shifted"
                  : "plain"
          }
        >
          ⏱ {describeTiming(timing)}
          {timing.waitingFor === "players" && timing.waitingPlayers.length > 0
            ? ` · ${timing.waitingPlayers.join(", ")} 다른 코트 경기 끝나면`
            : ""}
        </StTiming>
      ) : null}

      <StTeams>
        {renderTeam(match.teamA, "A")}
        <StVs>vs</StVs>
        {renderTeam(match.teamB, "B")}
      </StTeams>

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
          {score ? "점수 고치기" : "점수 저장"}
        </StSaveBtn>
        {score ? (
          <StGhostBtn type="button" disabled={busy} onClick={() => void onClear(match.no)}>
            지우기
          </StGhostBtn>
        ) : null}
      </StScoreRow>
    </StMatch>
  );
}
