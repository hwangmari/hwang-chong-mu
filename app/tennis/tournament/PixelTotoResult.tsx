"use client";

import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { fetchVoteTallies, type VoteTally } from "@/services/tennisVotes";
import { drawHeart, drawPlayer, px, type Sprite } from "./pixelSprites";
import { shirtOf } from "./PixelBracket";
import type { TeamEntry, TournamentEvent } from "./types";

/**
 * 픽셀 토토 결과 — 시상식 다음 칸 (주인 요청 2026-10-28 "토토 결과 보기 이렇게 해서 모션도").
 * "🎟️ 토토 결과 보기"를 누르면 한 번 공연하고 멈춘다.
 *  1) 팀별 표 막대가 올라온다  2) 반짝이 칸이 룰렛처럼 돌다 우승팀에 멈춘다
 *  3) 우승팀 꼬마들이 막대 위에서 만세 + 꽃가루  4) 맞힌 사람 이름이 하나씩 튀어나온다
 * 표·배당 계산은 투표 탭과 같다 (배당 = 참여 인원 ÷ 그 팀 표). 저장 공간은 읽기만 한다.
 * 체험 페이지는 실제 표가 없어서 명단으로 가짜 표를 만든다.
 */

const W = 240; // 막대 장면 폭 (넓은 화면에서는 배경만 넓힌다 — 시상식과 같은 방식)
const H = 112;
const PX_CSS = 2.4;
const MAX_FULL = 520;
const BASE = 92; // 막대 바닥
const BAR_MAX = 54;
const END_MS = 7000;
const NAMES_AT = 4600;
const CONFETTI = ["#ff5c8a", "#ffcf4a", "#4fb0f7", "#6cc96a", "#9a7cff", "#ffffff"];

// 3×5 숫자
const DIGITS = ["111101101101111", "010110010010111", "111001111100111", "111001111001111", "101101111001001",
  "111100111001111", "111100111101111", "111001001001001", "111101111101111", "111101111001111"];
function drawNumber(ctx: CanvasRenderingContext2D, n: number, cx: number, y: number, c: string) {
  const text = String(n);
  const x0 = Math.round(cx - (text.length * 4 - 1) / 2);
  [...text].forEach((ch, k) =>
    [...DIGITS[Number(ch)]].forEach((on, i) => {
      if (on === "1") px(ctx, x0 + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1, c);
    }),
  );
}

// 체험용 가짜 표: 이름마다 늘 같은 팀에 건다
function demoTally(event: TournamentEvent): VoteTally {
  const names: Record<string, string[]> = {};
  for (const r of event.roster) {
    let h = 7;
    for (const ch of r.name) h = (h * 31 + ch.charCodeAt(0)) % 9973;
    const seed = event.teams[(h % 5 === 0 ? 0 : h) % event.teams.length].seed;
    (names[String(seed)] ??= []).push(r.name);
  }
  const counts = Object.entries(names)
    .map(([choice, list]) => ({ choice, votes: list.length }))
    .sort((a, b) => b.votes - a.votes);
  return { kind: "champion", total: event.roster.length, counts, mine: [], names };
}

type Col = { seed: number; shirt: string; votes: number; x: number };

function draw(ctx: CanvasRenderingContext2D, t: number, full: number, cols: Col[], win: number, team: Sprite[]) {
  const frame = Math.floor(t / 260);
  // 전광판: 남색 바탕 + 점 무늬, 아래 바닥 줄
  px(ctx, 0, 0, full, H, "#1f2a4d");
  for (let y = 4; y < BASE; y += 6) for (let x = (y / 6) % 2 ? 3 : 0; x < full; x += 6) px(ctx, x, y, 1, 1, "#2c3a66");
  px(ctx, 0, BASE, full, H - BASE, "#141c36");
  const ox = Math.round((full - W) / 2);
  ctx.save();
  ctx.translate(ox, 0);
  const top = Math.max(1, ...cols.map((c) => c.votes));
  const grow = Math.min(1, t / 1600);
  // 룰렛: 1.6초부터 1.8초 동안 칸을 옮겨 다니다 점점 느려져 우승팀에서 멈춘다
  const winIdx = Math.max(0, cols.findIndex((c) => c.seed === win));
  const hops = cols.length * 2 + winIdx;
  const spin = t < 1600 ? -1 : t >= 3400 ? winIdx : Math.floor(hops * (1 - (1 - (t - 1600) / 1800) ** 2)) % cols.length;
  const decided = t >= 3400;
  cols.forEach((c, i) => {
    const h = Math.round((c.votes / top) * BAR_MAX * grow);
    const dim = decided && i !== winIdx;
    const blink = decided && i === winIdx && t < 4200 && frame % 2 === 0;
    if (spin === i && !decided) px(ctx, c.x - 3, BASE - BAR_MAX - 14, 16, BAR_MAX + 14, "#ffffff26");
    if (decided && i === winIdx) px(ctx, c.x - 3, BASE - BAR_MAX - 14, 16, BAR_MAX + 14, "#ffcf4a33");
    px(ctx, c.x, BASE - h, 10, h, blink ? "#ffffff" : dim ? "#4a5578" : c.shirt);
    if (h > 0) px(ctx, c.x, BASE - h, 10, 1, "#ffffff88");
    drawNumber(ctx, c.votes, c.x + 5, BASE - h - 7, dim ? "#6b76a0" : "#ffffff");
    drawNumber(ctx, c.seed, c.x + 5, BASE + 4, dim ? "#6b76a0" : "#ffcf4a");
  });
  // 우승팀 꼬마들이 막대 위로 폴짝 → 만세
  if (t >= 4200) {
    const c = cols[winIdx];
    const h = Math.round((c.votes / top) * BAR_MAX);
    const p = Math.min(1, (t - 4200) / 300);
    team.slice(0, 4).forEach((sp, i) => {
      const x = c.x + 5 - (Math.min(4, team.length) * 9) / 2 + i * 9;
      const y = BASE - h - 22 - Math.sin(p * Math.PI) * 6;
      const lift = t < END_MS ? (frame + i) % 2 : 0;
      drawPlayer(ctx, x, y - lift, sp, frame, 1, true);
      if (t < END_MS && (frame + i) % 4 === 0) drawHeart(ctx, x + 2, y - 7);
    });
  }
  ctx.restore();
  // 꽃가루
  if (t >= 4200) {
    const age = (t - 4200) / 1000;
    for (let k = 0; k < 60; k++) {
      const x = ((k * 97) % 240) / 240 * full;
      const y = Math.min(BASE + 2 + (k % 14), -((k * 53) % 50) + (34 + (k % 5) * 6) * age);
      if (y > -2) px(ctx, x + (y < BASE ? Math.sin(age * 4 + k) * 2 : 0), y, 2, y >= BASE ? 1 : 2, CONFETTI[k % 6]);
    }
  }
}

export default function PixelTotoResult({
  event,
  winner,
  sprites,
  demo = false,
}: {
  event: TournamentEvent;
  winner: TeamEntry;
  sprites: Map<number, Sprite[]>;
  demo?: boolean;
}) {
  const [tally, setTally] = useState<VoteTally | null>(() => (demo ? demoTally(event) : null));
  const [failed, setFailed] = useState(false);
  const [run, setRun] = useState(0); // 0 = 아직 안 봄
  const [showNames, setShowNames] = useState(false);
  const [moving] = useState(
    () => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [full, setFull] = useState(W);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (demo) return;
    fetchVoteTallies(event.id, "")
      .then((all) => setTally(all.champion))
      .catch(() => setFailed(true));
  }, [demo, event.id]);

  useEffect(() => {
    const box = ref.current?.parentElement;
    if (!box) return;
    const measure = () => setFull(Math.max(W, Math.min(MAX_FULL, Math.round(box.clientWidth / PX_CSS / 2) * 2)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(box);
    return () => ro.disconnect();
  }, [run]);

  const cols: Col[] = [...event.teams]
    .sort((a, b) => a.seed - b.seed)
    .map((team, i, all) => ({
      seed: team.seed,
      shirt: shirtOf(team),
      votes: tally?.counts.find((c) => c.choice === String(team.seed))?.votes ?? 0,
      x: Math.round(W / 2 - (all.length * 26 - 16) / 2 + i * 26),
    }));
  const sig = cols.map((c) => c.votes).join(",");

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx || run === 0) return;
    const team = sprites.get(winner.seed) ?? [];
    if (!moving) {
      draw(ctx, END_MS, full, cols, winner.seed, team);
      return;
    }
    let raf = 0;
    let begin: number | null = null;
    const loop = (now: number) => {
      begin ??= now;
      const t = now - begin;
      draw(ctx, Math.min(t, END_MS), full, cols, winner.seed, team);
      if (t >= NAMES_AT) setShowNames(true);
      if (t < END_MS) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // cols 는 매 렌더 새로 만들어지므로 sig 로 대신한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, full, sig, winner.seed, sprites, moving]);

  const start = () => {
    setShowNames(!moving);
    setRun((n) => n + 1);
  };

  if (failed) return <StNote>토토 결과를 불러오지 못했어요. 투표 탭에서 확인해 주세요.</StNote>;
  if (!tally) return <StNote>토토 결과를 불러오는 중…</StNote>;

  const hits = tally.names[String(winner.seed)] ?? [];
  const winVotes = tally.counts.find((c) => c.choice === String(winner.seed))?.votes ?? 0;
  const odds = winVotes > 0 ? `×${(tally.total / winVotes).toFixed(1)}` : "-";

  if (run === 0) {
    return (
      <StIntro>
        <p>
          {tally.total}명이 우승팀에 걸었어요. 누가 맞혔을까요?
          {demo ? " (체험용 가짜 표)" : ""}
        </p>
        <StBigBtn type="button" onClick={start}>
          🎟️ 토토 결과 보기
        </StBigBtn>
      </StIntro>
    );
  }

  return (
    <StWrap>
      <StCanvas
        ref={ref}
        width={full}
        height={H}
        style={{ aspectRatio: `${full} / ${H}` }}
        role="img"
        aria-label={`토토 결과: 팀별 표 막대 중 ${winner.name} 막대에 불이 들어와요`}
      />
      {showNames ? (
        <StResult>
          <StHeadline>
            🏆 {winner.name} 우승 · 맞힌 사람 <b>{hits.length}명</b> · 배당 <b>{odds}</b>
          </StHeadline>
          {hits.length > 0 ? (
            <StNames>
              {hits.map((name, i) => (
                <StName key={name} style={{ animationDelay: `${i * 90}ms` }}>
                  🎉 {name}
                </StName>
              ))}
            </StNames>
          ) : (
            <StNote>아무도 못 맞혔어요 😱 이번 대회는 이변의 연속!</StNote>
          )}
          <StBigBtn type="button" $small onClick={start}>
            🎬 다시 보기
          </StBigBtn>
        </StResult>
      ) : null}
    </StWrap>
  );
}

const pop = keyframes`
  from { opacity: 0; transform: translateY(6px) scale(0.6); }
  to { opacity: 1; transform: none; }
`;

const StWrap = styled.div`
  display: grid;
  gap: 0.7rem;
`;

const StCanvas = styled.canvas`
  display: block;
  width: 100%;
  image-rendering: pixelated;
  box-shadow: 4px 4px 0 #2f7a4f22;
`;

const StIntro = styled.div`
  display: grid;
  justify-items: center;
  gap: 0.6rem;
  padding: 1.2rem 0.8rem;
  text-align: center;
  font-size: 0.88rem;
  color: #f4f6ff;
  background: #1f2a4d;
  box-shadow: 4px 4px 0 #2f7a4f22;
`;

const StBigBtn = styled.button<{ $small?: boolean }>`
  justify-self: center;
  padding: ${({ $small }) => ($small ? "0.45rem 0.8rem" : "0.7rem 1.3rem")};
  border: 0;
  font-size: ${({ $small }) => ($small ? "0.82rem" : "1rem")};
  font-weight: 800;
  color: #24343b;
  background: #ffcf4a;
  box-shadow: 3px 3px 0 #24343b;
  cursor: pointer;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 #24343b;
  }
`;

const StResult = styled.div`
  display: grid;
  gap: 0.6rem;
`;

const StHeadline = styled.p`
  font-size: 0.95rem;
  font-weight: 700;
  text-align: center;

  b {
    font-weight: 900;
    color: #e8761c;
  }
`;

const StNames = styled.ul`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.35rem;
  list-style: none;
`;

const StName = styled.li`
  padding: 0.3rem 0.6rem;
  font-size: 0.82rem;
  font-weight: 700;
  background: #fff3c4;
  animation: ${pop} 0.35s ease-out both;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StNote = styled.p`
  font-size: 0.86rem;
  text-align: center;
  color: #6b7c80;
`;
