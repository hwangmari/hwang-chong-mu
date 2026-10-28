"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import type { RosterPlayer, TeamEntry, ResolvedMatch } from "./types";
import { PAIR_ROTATION, playerAtSeed } from "./types";
import type { ScoreMap } from "../types";
import { teamPath } from "./resolve";
import { shirtOf } from "./PixelBracket";
import { COURT_H, COURT_W, drawCourt, drawFire, drawHeart, drawPlayer, px, type Sprite } from "./pixelSprites";

/**
 * 팀별 여정 픽셀 다시 보기 (주인 요청 2026-10-28 "팀별 여정을 픽셀 코트처럼, 게임 끝나고 실제 경기 느낌으로").
 * 고른 팀의 끝난 경기를 차례로 픽셀 코트에서 다시 튼다.
 *  · 한 게임씩 점수가 올라가 최종 점수에서 멈춘다. 4게임마다 페어가 바뀌고(페어A→B→C) 코트 위 선수도 바뀐다
 *  · 끝나면 이긴 쪽은 만세·하트, 진 쪽은 불꽃. 다음 경기로 넘어간다
 * 게임별 순서는 기록되지 않으므로(최종 점수만 저장) 경기 번호로 정한 "그럴듯한 순서"다 — 최종 점수와 마지막 게임 승자만 실제와 같다.
 */

type Props = {
  team: TeamEntry;
  matches: ResolvedMatch[];
  scores: ScoreMap;
  roster: RosterPlayer[];
};

const GAME_MS = 1300;
const END_HOLD_MS = 2600;

// 경기 번호로 항상 같은 순서가 나오는 작은 난수
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 게임마다 우리 팀이 땄으면 true. 마지막 게임은 늘 이긴 팀 */
function gameOrder(no: number, mine: number, theirs: number): boolean[] {
  const iWon = mine > theirs;
  const winnerGames = Math.max(mine, theirs);
  const loserGames = Math.min(mine, theirs);
  const bag = [...Array(winnerGames - 1).fill(true), ...Array(loserGames).fill(false)] as boolean[];
  const r = rng(no * 97 + 13);
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  bag.push(true);
  // true = 이긴 팀이 딴 게임 → 우리 팀 기준으로 바꾼다
  return bag.map((w) => (iWon ? w : !w));
}

const segOf = (game: number) => Math.min(2, Math.floor(game / 4)); // 0=A 1=B 2=C

export default function PixelJourney({ team, matches, scores, roster }: Props) {
  const female = useMemo(() => new Set(roster.filter((r) => r.gender === "F").map((r) => r.name)), [roster]);
  const played = useMemo(
    () =>
      teamPath(matches, team)
        .filter((p) => p.outcome && p.opponent && p.match.scoreA !== null && p.match.scoreB !== null)
        .map((p) => {
          const mine = p.side === "A" ? p.match.scoreA! : p.match.scoreB!;
          const theirs = p.side === "A" ? p.match.scoreB! : p.match.scoreA!;
          const sc = scores[p.match.template.no];
          const tb =
            sc?.tiebreakA !== undefined && sc?.tiebreakB !== undefined
              ? p.side === "A"
                ? `${sc.tiebreakA}-${sc.tiebreakB}`
                : `${sc.tiebreakB}-${sc.tiebreakA}`
              : null;
          return {
            no: p.match.template.no,
            label: p.match.template.label,
            court: sc?.court ?? p.match.template.court,
            opponent: p.opponent!,
            mine,
            theirs,
            win: p.outcome === "win",
            tb,
            order: gameOrder(p.match.template.no, mine, theirs),
          };
        }),
    [matches, team, scores],
  );

  const [idx, setIdx] = useState(0);
  const [shown, setShown] = useState(0); // 지금까지 끝난 게임 수
  const [auto, setAuto] = useState(true);
  const [still] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [run, setRun] = useState(0); // 다시 보기를 누를 때마다 처음부터
  const ref = useRef<HTMLCanvasElement>(null);

  const cur = played[Math.min(idx, played.length - 1)];

  const spritesOf = (t: TeamEntry, game: number): Sprite[] =>
    PAIR_ROTATION[segOf(game)].seeds.map((seed) => {
      const name = playerAtSeed(t, seed)?.name ?? "";
      return { shirt: shirtOf(t), female: female.has(name) };
    });

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx || !cur) return;
    const total = cur.order.length;
    let raf = 0;
    let lastShown = -1;
    const begin = performance.now();

    const draw = (t: number) => {
      // rAF 시각이 시작 시각보다 살짝 앞설 수 있어 0 아래로 내려가지 않게 (음수면 -1게임째가 되어 페어를 못 찾았다)
      const elapsed = still ? total * GAME_MS + 1 : Math.max(0, t - begin);
      const done = Math.min(total, Math.floor(elapsed / GAME_MS));
      const ended = done >= total;
      if (done !== lastShown) {
        lastShown = done;
        setShown(done);
      }
      const game = Math.min(total - 1, done); // 지금 뛰는(또는 마지막) 게임
      const frame = Math.floor(elapsed / 260);
      drawCourt(ctx);
      const mineSp = spritesOf(team, game);
      const theirSp = spritesOf(cur.opponent, game);
      const within = (elapsed % GAME_MS) / GAME_MS;
      const sway = (k: number) => (ended || still ? 0 : Math.round(Math.sin(elapsed / 500 + k) * 4));
      // 방금 끝난 게임을 딴 쪽은 잠깐 펄쩍
      const justWonMine = !ended && done > 0 && within < 0.25 ? cur.order[done - 1] : null;
      const spots: [number, number, Sprite, 1 | -1, boolean][] = [
        [32 + sway(1), 22, mineSp[0], 1, true],
        [44 + sway(2), 54, mineSp[1], 1, true],
        [COURT_W - 40 + sway(3), 22, theirSp[0], -1, false],
        [COURT_W - 52 + sway(4), 54, theirSp[1], -1, false],
      ];
      for (const [x, y, sp, facing, isMine] of spots) {
        const winnerSide = isMine === cur.win;
        const cheer = ended && winnerSide;
        const hop = (ended && winnerSide && frame % 2) || (justWonMine !== null && justWonMine === isMine) ? 2 : 0;
        drawPlayer(ctx, x, y - hop, sp, frame, facing, cheer);
        if (ended && winnerSide && frame % 3 === 0) drawHeart(ctx, x + 2, y - 8);
        if (ended && !winnerSide) drawFire(ctx, x + 2, y - 8, frame);
      }
      if (!ended && !still) {
        const p = within * 2;
        const k = p < 1 ? p : 2 - p;
        const base = 36 + (p < 1 ? 0 : 10);
        const bx = 44 + k * (COURT_W - 96);
        px(ctx, bx, base + 4, 2, 1, "#0005");
        px(ctx, bx, base - Math.sin(k * Math.PI) * 14, 2, 2, "#d8f24a");
      }
      if (ended && !still && auto && elapsed > total * GAME_MS + END_HOLD_MS && idx < played.length - 1) {
        setIdx((v) => v + 1);
        return;
      }
      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
    // 경기·다시 보기가 바뀔 때만 처음부터 (spritesOf 는 매 렌더 새로 만들어진다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur?.no, run, still, auto, team.seed]);

  if (played.length === 0) {
    return (
      <StWrap>
        <StEmpty>아직 끝난 경기가 없어요. 경기가 끝나면 여기서 픽셀로 다시 볼 수 있어요.</StEmpty>
      </StWrap>
    );
  }

  const total = cur.order.length;
  const now = cur.order.slice(0, shown);
  const mineScore = now.filter(Boolean).length;
  const theirScore = now.length - mineScore;
  const ended = shown >= total;
  const game = Math.min(total - 1, shown);
  const seg = PAIR_ROTATION[segOf(game)];
  const pairChanged = !ended && shown > 0 && shown % 4 === 0;

  return (
    <StWrap>
      <StHead>
        <StTitle>🎬 픽셀로 다시 보기</StTitle>
        <StBtns>
          <StBtn type="button" onClick={() => { setIdx(0); setRun((v) => v + 1); }}>
            ⏮ 처음부터
          </StBtn>
          <StBtn type="button" aria-pressed={auto} onClick={() => setAuto((v) => !v)}>
            {auto ? "다음 경기 자동 ✓" : "다음 경기 자동"}
          </StBtn>
        </StBtns>
      </StHead>
      <StChips>
        {played.map((p, i) => (
          <StChip
            key={p.no}
            type="button"
            aria-pressed={i === idx}
            $win={p.win}
            onClick={() => { setIdx(i); setRun((v) => v + 1); }}
          >
            {p.label} · vs {p.opponent.name} {p.win ? "승" : "패"} {p.mine}:{p.theirs}
          </StChip>
        ))}
      </StChips>

      <StStage>
        <StCanvas ref={ref} width={COURT_W} height={COURT_H} aria-label={`${cur.label} ${team.name} 대 ${cur.opponent.name} 다시 보기`} />
        <StBoard>
          <StSide>
            <i style={{ background: shirtOf(team) }} />
            {team.name}
          </StSide>
          <StScore>
            <span>{mineScore}</span>:<span>{theirScore}</span>
          </StScore>
          <StSide $right>
            {cur.opponent.name}
            <i style={{ background: shirtOf(cur.opponent) }} />
          </StSide>
        </StBoard>
        <StInfo>
          {ended ? (
            <StResult $win={cur.win}>
              {cur.win ? "🏆" : "🔥"} {cur.mine}:{cur.theirs} {cur.win ? "승리!" : "아쉬운 패배 — 다음 경기에서 불태워요"}
              {cur.tb ? ` · 타이브레이크 ${cur.tb}` : ""}
            </StResult>
          ) : (
            <>
              <span>
                {cur.court}코트 · {game + 1}게임째 ·{" "}
                <b>
                  페어{seg.key} {seg.games}
                </b>
              </span>
              {pairChanged ? <StChange>페어 체인지!</StChange> : null}
            </>
          )}
        </StInfo>
        <StPairs>
          <span>{`${team.name} ${seg.seeds.map((s) => playerAtSeed(team, s)?.name ?? `${s}번`).join("·")}`}</span>
          <span>{`${cur.opponent.name} ${seg.seeds.map((s) => playerAtSeed(cur.opponent, s)?.name ?? `${s}번`).join("·")}`}</span>
        </StPairs>
      </StStage>
      <StNote>게임별 순서는 기록되지 않아 그럴듯하게 다시 그린 거예요. 최종 점수와 마지막 게임 승자는 실제와 같아요.</StNote>
    </StWrap>
  );
}

const PIX = "ui-monospace, Menlo, Consolas, monospace";
const INK = "#24343b";
const DIM = "#6b7c80";
const ACCENT = "#e8761c";
const LED = "#ffcf4a";

const StWrap = styled.section`
  display: grid;
  gap: 0.6rem;
  padding: 0.8rem;
  color: ${INK};
  background-color: #e6f7ea;
  background-image:
    linear-gradient(#d2efdb 2px, transparent 2px),
    linear-gradient(90deg, #d2efdb 2px, transparent 2px);
  background-size: 32px 32px;
  border-radius: 0.8rem;
`;

const StHead = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
`;

const StBtns = styled.div`
  display: flex;
  gap: 0.4rem;
`;

const StBtn = styled.button`
  padding: 0.3rem 0.7rem;
  border: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${INK};
  background: #fff;
  box-shadow: 2px 2px 0 ${INK};
  cursor: pointer;

  &[aria-pressed="true"] {
    background: ${LED};
  }
`;

const StChips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const StChip = styled.button<{ $win: boolean }>`
  padding: 0.3rem 0.6rem;
  border: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ $win }) => ($win ? "#2e9e5e" : "#e5484d")};
  background: #ffffffcc;
  cursor: pointer;

  &[aria-pressed="true"] {
    color: ${INK};
    background: ${LED};
    box-shadow: 2px 2px 0 ${INK};
  }
`;

const StStage = styled.div`
  display: grid;
  gap: 0.45rem;
  padding: 0.6rem;
  background: #fff;
  box-shadow: 4px 4px 0 #2f7a4f22;
  max-width: 640px;
  width: 100%;
  justify-self: center;
`;

const StCanvas = styled.canvas`
  display: block;
  width: 100%;
  aspect-ratio: ${COURT_W} / ${COURT_H};
  image-rendering: pixelated;
`;

const StBoard = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
`;

const StSide = styled.span<{ $right?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $right }) => ($right ? "flex-end" : "flex-start")};
  gap: 0.4rem;
  font-size: 0.92rem;
  font-weight: 900;

  i {
    width: 0.7rem;
    height: 0.7rem;
  }
`;

const StScore = styled.span`
  font-family: ${PIX};
  font-size: 1.5rem;
  font-weight: 800;
  color: ${ACCENT};
  font-variant-numeric: tabular-nums;

  span {
    padding-inline: 0.25rem;
  }
`;

const StInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 1.6rem;
  font-size: 0.82rem;
  color: ${DIM};

  b {
    color: ${INK};
  }
`;

const StChange = styled.span`
  padding: 0.1rem 0.5rem;
  font-family: ${PIX};
  font-size: 0.72rem;
  font-weight: 800;
  color: #fff;
  background: #7a5cf0;
`;

const StResult = styled.span<{ $win: boolean }>`
  font-size: 0.9rem;
  font-weight: 900;
  color: ${({ $win }) => ($win ? "#2e9e5e" : "#e5484d")};
`;

const StPairs = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.74rem;
  font-weight: 700;
  color: ${DIM};
`;

const StNote = styled.p`
  font-size: 0.74rem;
  color: ${DIM};
`;

const StEmpty = styled.p`
  font-size: 0.84rem;
  color: ${DIM};
`;
