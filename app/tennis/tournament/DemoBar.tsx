"use client";

import styled from "styled-components";
import type { ResolvedMatch } from "./types";
import { isFinished, type Court, type MatchScore, type ScoreMap } from "../types";
import { courtLetters } from "../timeline";

/**
 * 체험 모드 조작 띠 (주인 요청 2026-10-28 "픽셀 코트 프로토타입으로 전체 더미 데이터로 볼 수 있어?").
 * /tennis/pixel-demo 에서만 뜬다. 가짜 점수를 이 브라우저에만 넣고 빼며 대회 흐름을 미리 본다.
 * 실제 저장 공간에는 아무것도 쓰지 않는다 — TournamentView 가 demo 일 때 저장 공간을 아예 부르지 않는다.
 */

type Props = {
  matches: ResolvedMatch[];
  scores: ScoreMap;
  courts: number;
  onChange: (next: ScoreMap) => void;
};

const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

// 이긴 팀 6게임, 진 팀 0~5게임. 5면 6:5 + 타이브레이크
function randomResult(): Pick<MatchScore, "scoreA" | "scoreB" | "tiebreakA" | "tiebreakB"> {
  const lose = Math.floor(Math.random() * 6);
  const aWins = Math.random() < 0.5;
  const tb = lose === 5 ? [7, Math.floor(Math.random() * 6)] : null;
  return {
    scoreA: aWins ? 6 : lose,
    scoreB: aWins ? lose : 6,
    tiebreakA: tb ? (aWins ? tb[0] : tb[1]) : undefined,
    tiebreakB: tb ? (aWins ? tb[1] : tb[0]) : undefined,
  };
}

/** 한 단계: 경기 중인 게 있으면 하나 끝내고, 없으면 시작할 수 있는 경기를 빈 코트에서 시작 */
function step(matches: ResolvedMatch[], scores: ScoreMap, courtCount: number): ScoreMap | null {
  const playing = matches.find((m) => {
    const sc = scores[m.template.no];
    return sc?.startedAt && !isFinished(sc);
  });
  if (playing) {
    const sc = scores[playing.template.no]!;
    return { ...scores, [playing.template.no]: { ...sc, ...randomResult(), finishedAt: new Date().toISOString() } };
  }
  return startAllReady(matches, scores, courtCount, 1);
}

function startAllReady(matches: ResolvedMatch[], scores: ScoreMap, courtCount: number, limit: number): ScoreMap | null {
  const busy = new Set<Court>();
  for (const sc of Object.values(scores)) if (sc.startedAt && !isFinished(sc) && sc.court) busy.add(sc.court);
  const free = courtLetters(courtCount).filter((c) => !busy.has(c));
  const ready = matches.filter((m) => m.status === "ready").slice(0, Math.min(limit, free.length));
  if (ready.length === 0) return null;
  const next = { ...scores };
  ready.forEach((m, i) => {
    const court = free.includes(m.template.court) ? m.template.court : free[i];
    free.splice(free.indexOf(court), 1);
    next[m.template.no] = { matchNo: m.template.no, scoreA: 0, scoreB: 0, court, startedAt: ago(12 - i * 3) };
  });
  return next;
}

/** 한 라운드: 경기 중인 걸 다 끝내고, 시작할 수 있는 걸 코트 수만큼 시작 */
function round(matches: ResolvedMatch[], scores: ScoreMap, courtCount: number): ScoreMap | null {
  let next = { ...scores };
  let changed = false;
  for (const m of matches) {
    const sc = next[m.template.no];
    if (sc?.startedAt && !isFinished(sc)) {
      next[m.template.no] = { ...sc, ...randomResult(), finishedAt: new Date().toISOString() };
      changed = true;
    }
  }
  if (changed) return next;
  const started = startAllReady(matches, next, courtCount, courtCount);
  if (started) next = started;
  return started ? next : null;
}

export default function DemoBar({ matches, scores, courts, onChange }: Props) {
  const done = matches.filter((m) => m.status === "done").length;
  const total = matches.filter((m) => m.status !== "hidden").length;
  const over = matches.some((m) => m.template.stage === "grand-final" && m.status === "done");

  const apply = (next: ScoreMap | null) => {
    if (next) onChange(next);
  };

  return (
    <StBar>
      <StText>
        🧪 <b>체험 모드</b> · 가짜 데이터예요. 실제 대회 기록에는 아무것도 저장되지 않아요 (이 브라우저에만).
        <span>
          {done}/{total}경기 끝{over ? " · 우승 결정!" : ""}
        </span>
      </StText>
      <StBtns>
        <StBtn type="button" disabled={over} onClick={() => apply(step(matches, scores, courts))}>
          ▶ 한 경기씩
        </StBtn>
        <StBtn type="button" disabled={over} onClick={() => apply(round(matches, scores, courts))}>
          ⏩ 한 라운드씩
        </StBtn>
        <StBtn type="button" $ghost onClick={() => onChange({})}>
          ⏮ 처음부터
        </StBtn>
      </StBtns>
    </StBar>
  );
}

const StBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.7rem 0.9rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.yellow50};
  color: ${({ theme }) => theme.semantic.text};
`;

const StText = styled.p`
  font-size: 0.84rem;
  line-height: 1.5;

  b {
    font-weight: 800;
  }

  span {
    margin-left: 0.4rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StBtns = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const StBtn = styled.button<{ $ghost?: boolean }>`
  padding: 0.45rem 0.8rem;
  border: 0;
  font-size: 0.82rem;
  font-weight: 800;
  color: #24343b;
  background: ${({ $ghost }) => ($ghost ? "#ffffff" : "#ffcf4a")};
  box-shadow: 3px 3px 0 #24343b;
  cursor: pointer;

  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 #24343b;
  }

  &:disabled {
    color: #9aa6a9;
    box-shadow: 3px 3px 0 #c2cdd0;
    cursor: default;
  }
`;
