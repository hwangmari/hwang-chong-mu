"use client";

import { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { drawHeart, drawPlayer, px, type Sprite } from "./pixelSprites";
import type { Placement } from "./types";

/**
 * 픽셀 시상식 — 대회가 다 끝나면 픽셀 코트 맨 아래에 (주인 요청 2026-10-28 "시상대 만들어서 시상식 퍼포먼스도").
 * 화면에 보이면 한 번만 공연하고 마지막 장면에서 멈춘다 (움직임은 한 번, 그다음 고정 — 화면 규칙).
 *  1) 4위 → 3위 → 2위 → 1위 순서로 걸어 들어와 단상에 폴짝
 *  2) 3·2·1위 메달이 위에서 떨어져 목에 걸림
 *  3) 우승 트로피가 내려오고 조명이 켜짐 → 폭죽 세 번 + 꽃가루
 * 동작 줄이기 설정이면 처음부터 마지막 장면만 보여 준다. "다시 보기"로 처음부터 다시.
 */

const W = 240;
const H = 120;
const FLOOR = 104;
const END_MS = 9800;

type Step = { rank: number; x0: number; x1: number; top: number; from: 1 | -1; delay: number };
// 단상: 가운데 1위가 제일 높고, 왼쪽 2위, 오른쪽 3위, 맨 오른쪽 낮은 4위 자리
const STEPS: Step[] = [
  { rank: 1, x0: 90, x1: 140, top: 68, from: 1, delay: 1500 },
  { rank: 2, x0: 40, x1: 90, top: 80, from: 1, delay: 1000 },
  { rank: 3, x0: 140, x1: 190, top: 88, from: -1, delay: 500 },
  { rank: 4, x0: 196, x1: 232, top: 96, from: -1, delay: 0 },
];
const WALK = 1400;
const HOP = 350;
const MEDAL: Record<number, string> = { 1: "#ffd34a", 2: "#d9e2e6", 3: "#d9904f" };
const BLOCK: Record<number, string> = { 1: "#ffcf4a", 2: "#e9eef0", 3: "#f2b77e", 4: "#d7f0dd" };
const CONFETTI = ["#ff5c8a", "#ffcf4a", "#4fb0f7", "#6cc96a", "#9a7cff", "#ffffff"];

// 3×5 숫자 (단상 앞면 번호)
const DIGIT: Record<number, string[]> = {
  1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"],
  4: ["101", "101", "111", "001", "001"],
};
function drawDigit(ctx: CanvasRenderingContext2D, n: number, x: number, y: number, c: string) {
  DIGIT[n].forEach((row, j) =>
    [...row].forEach((on, i) => {
      if (on === "1") px(ctx, x + i * 2, y + j * 2, 2, 2, c);
    }),
  );
}

// 9×9 트로피
function drawTrophy(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const g = "#ffd34a";
  const d = "#e0a21a";
  px(ctx, x + 1, y, 7, 1, g);
  px(ctx, x, y + 1, 1, 2, g);
  px(ctx, x + 8, y + 1, 1, 2, g);
  px(ctx, x + 1, y + 1, 7, 3, g);
  px(ctx, x + 2, y + 1, 1, 2, "#fff6c9");
  px(ctx, x + 2, y + 4, 5, 1, d);
  px(ctx, x + 4, y + 5, 1, 2, d);
  px(ctx, x + 2, y + 7, 5, 2, "#7a5a3a");
}

// 같은 꽃가루가 매번 같은 자리에서 떨어지게 고정된 난수
function seeded(n: number) {
  let s = 63;
  return Array.from({ length: n }, () => {
    s = (s * 9301 + 49297) % 233280;
    const a = s / 233280;
    s = (s * 9301 + 49297) % 233280;
    const b = s / 233280;
    s = (s * 9301 + 49297) % 233280;
    return { x: a * W, y0: -b * 60, speed: 35 + (s / 233280) * 20, c: CONFETTI[Math.floor(a * 97) % CONFETTI.length] };
  });
}
const PIECES = seeded(70);
const BURSTS = [
  { x: 56, y: 26, at: 4800, c: "#ff5c8a" },
  { x: 184, y: 22, at: 5400, c: "#4fb0f7" },
  { x: 120, y: 16, at: 6000, c: "#ffcf4a" },
];

function drawStage(ctx: CanvasRenderingContext2D) {
  // 보라 커튼 벽 + 세로 주름
  px(ctx, 0, 0, W, FLOOR, "#8f74ff");
  for (let x = 0; x < W; x += 12) px(ctx, x, 0, 4, FLOOR, "#9c84ff");
  // 줄줄이 삼각 깃발
  px(ctx, 0, 5, W, 1, "#ffffff");
  for (let x = 2, k = 0; x < W; x += 12, k++) {
    const c = CONFETTI[k % 5];
    for (let r = 0; r < 5; r++) px(ctx, x + r, 6 + r, 7 - r * 2 > 0 ? 7 - r * 2 : 1, 1, c);
  }
  // 바닥: 나무 무대 + 가운데 빨간 카펫
  px(ctx, 0, FLOOR, W, H - FLOOR, "#c98d5a");
  px(ctx, 0, FLOOR, W, 1, "#a8703f");
  px(ctx, 70, FLOOR + 1, 100, H - FLOOR - 1, "#e8504a");
}

function drawBlocks(ctx: CanvasRenderingContext2D) {
  for (const s of STEPS) {
    const w = s.x1 - s.x0;
    px(ctx, s.x0, s.top, w, FLOOR - s.top, BLOCK[s.rank]);
    px(ctx, s.x0, s.top, w, 2, "#ffffff");
    px(ctx, s.x1 - 2, s.top, 2, FLOOR - s.top, "#0000001a");
    // 낮은 4위 자리는 번호가 안 들어가서 바로 앞 바닥에 쓴다
    if (FLOOR - s.top >= 14) drawDigit(ctx, s.rank, s.x0 + w / 2 - 3, s.top + (FLOOR - s.top) / 2 - 4, "#24343b");
    else drawDigit(ctx, s.rank, s.x0 + w / 2 - 3, FLOOR + 3, "#ffffffcc");
  }
}

function draw(ctx: CanvasRenderingContext2D, t: number, places: { rank: number; team: Sprite[] }[]) {
  ctx.clearRect(0, 0, W, H);
  drawStage(ctx);
  const frame = Math.floor(t / 280);

  // 조명: 트로피가 내려온 뒤 1위 단상에
  if (t >= 4400) {
    ctx.fillStyle = "#fff6b340";
    ctx.beginPath();
    ctx.moveTo(108, 0);
    ctx.lineTo(132, 0);
    ctx.lineTo(146, FLOOR);
    ctx.lineTo(84, FLOOR);
    ctx.closePath();
    ctx.fill();
  }
  drawBlocks(ctx);

  for (const s of STEPS) {
    const team = places.find((p) => p.rank === s.rank)?.team ?? [];
    const n = team.length;
    const span = n * 9;
    const startX = (s.x0 + s.x1) / 2 - span / 2;
    const local = t - s.delay;
    team.forEach((sp, i) => {
      const fx = startX + i * 9; // 단상 위 최종 자리
      const fy = s.top - 12;
      let x = fx;
      let y = fy;
      let walking = false;
      if (local < WALK) {
        // 무대 밖에서 걸어 들어온다 (한 줄로, 앞사람과 9칸 간격)
        const edge = s.from > 0 ? -12 - (n - i) * 9 : W + 4 + i * 9;
        const p = Math.max(0, local) / WALK;
        x = edge + (fx - edge) * p;
        y = FLOOR - 12;
        walking = true;
      } else if (local < WALK + HOP) {
        // 폴짝: 바닥에서 단상 위로 포물선
        const p = (local - WALK) / HOP;
        y = FLOOR - 12 + (fy - (FLOOR - 12)) * p - Math.sin(p * Math.PI) * 8;
      }
      const landed = !walking && local >= WALK + HOP;
      const cheer = landed && (s.rank === 1 ? t >= 4400 : t >= 3400 && t < END_MS - 400 ? (frame + i) % 3 !== 0 : false);
      const lift = cheer && t < END_MS ? (frame + i) % 2 : 0;
      drawPlayer(ctx, x, y - lift, sp, walking ? Math.floor(t / 120) : frame, walking ? s.from : 1, cheer);
      // 메달: 3위 → 2위 → 1위 순서로 위에서 떨어진다
      const medal = MEDAL[s.rank];
      if (medal && landed) {
        const at = 3400 + (3 - s.rank) * 300;
        if (t >= at) {
          const p = Math.min(1, (t - at) / 400);
          const my = -6 + (y - lift + 6 - -6) * p;
          px(ctx, x + 3, my - 1, 2, 1, s.rank === 1 ? "#e8504a" : "#4fb0f7");
          px(ctx, x + 3, my, 2, 2, medal);
        }
      }
      if (s.rank === 4 && landed && t >= 3400 && (frame + i) % 4 === 0) drawHeart(ctx, x + 2, y - 7);
    });
  }

  // 트로피: 1위 단상 위로 내려와 머리 위에 멈춘다
  if (t >= 4000) {
    const p = Math.min(1, (t - 4000) / 600);
    const ty = -10 + (68 - 12 - 12 - -10) * p;
    drawTrophy(ctx, 111, ty);
    if (p >= 1 && t < END_MS && frame % 3 === 0) drawHeart(ctx, 100, ty - 2);
  }

  // 폭죽: 점들이 원으로 퍼지며 사라진다
  for (const b of BURSTS) {
    const age = t - b.at;
    if (age < 0 || age > 900) continue;
    const r = (age / 700) * 18;
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      px(ctx, b.x + Math.cos(a) * r, b.y + Math.sin(a) * r, 2, 2, k % 2 ? b.c : "#ffffff");
    }
  }

  // 꽃가루: 내려와 바닥에 쌓인다 (마지막 장면에도 바닥에 남아 있음)
  if (t >= 4600) {
    const age = (t - 4600) / 1000;
    for (const c of PIECES) {
      const y = Math.min(FLOOR + 2 + (c.x % 12), c.y0 + c.speed * age);
      const landedPiece = y >= FLOOR + 2;
      const x = c.x + (landedPiece ? 0 : Math.sin(age * 4 + c.x) * 2);
      if (y > -2) px(ctx, x, y, 2, landedPiece ? 1 : 2, c.c);
    }
  }
}

export default function PixelPodium({
  ranks,
  sprites,
}: {
  ranks: Placement[];
  sprites: Map<number, Sprite[]>;
}) {
  const [moving] = useState(
    () => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [run, setRun] = useState(0); // 다시 보기 누를 때마다 1 증가
  const ref = useRef<HTMLCanvasElement>(null);
  const places = ranks
    .filter((r) => r.rank <= 4 && r.team)
    .map((r) => ({ rank: r.rank, team: sprites.get(r.team!.seed) ?? [] }));
  const sig = places.map((p) => `${p.rank}:${p.team.length}`).join("|");

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (!moving) {
      draw(ctx, END_MS, places);
      return;
    }
    draw(ctx, 0, places);
    let raf = 0;
    let begin: number | null = null;
    const loop = (now: number) => {
      if (begin === null) begin = now;
      const t = now - begin;
      draw(ctx, Math.min(t, END_MS), places);
      if (t < END_MS) raf = requestAnimationFrame(loop);
    };
    // 화면에 25% 이상 보일 때 한 번 시작
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && begin === null && !raf) raf = requestAnimationFrame(loop);
      },
      { threshold: 0.25 },
    );
    io.observe(canvas);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // places 는 매 렌더 새로 만들어지므로 sig 로 대신한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, moving, run]);

  return (
    <StWrap>
      <StCanvas
        ref={ref}
        width={W}
        height={H}
        role="img"
        aria-label="시상식: 우승팀이 가장 높은 단상에서 트로피를 들고, 2·3위가 메달을 받아요"
      />
      <StList>
        {ranks
          .filter((r) => r.rank <= 4 && r.team)
          .map((r) => (
            <li key={r.rank}>
              <StMedal>{["🥇", "🥈", "🥉", "🎖️"][r.rank - 1]}</StMedal>
              <b>
                {r.rank}위 · {r.team!.name}
              </b>
              <span>
                {[...r.team!.players]
                  .sort((a, b) => a.seed - b.seed)
                  .map((p) => p.name)
                  .filter((n) => n.trim())
                  .join("·")}
              </span>
            </li>
          ))}
      </StList>
      {moving ? (
        <StReplay type="button" onClick={() => setRun((n) => n + 1)}>
          🎬 시상식 다시 보기
        </StReplay>
      ) : null}
    </StWrap>
  );
}

const StWrap = styled.div`
  display: grid;
  gap: 0.7rem;
`;

const StCanvas = styled.canvas`
  display: block;
  width: 100%;
  max-width: 720px;
  aspect-ratio: ${W} / ${H};
  image-rendering: pixelated;
  box-shadow: 4px 4px 0 #2f7a4f22;
`;

const StList = styled.ol`
  display: grid;
  gap: 0.35rem;
  list-style: none;
  max-width: 720px;

  li {
    display: grid;
    grid-template-columns: 1.6rem 7rem minmax(0, 1fr);
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.6rem;
    font-size: 0.85rem;
    background: #ffffffcc;
  }

  b {
    font-weight: 800;
  }

  span {
    font-size: 0.78rem;
    color: #6b7c80;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StMedal = styled.span`
  font-size: 1rem;
`;

const StReplay = styled.button`
  justify-self: start;
  padding: 0.45rem 0.8rem;
  border: 0;
  font-size: 0.82rem;
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
