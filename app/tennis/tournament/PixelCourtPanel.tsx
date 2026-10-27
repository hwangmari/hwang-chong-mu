"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styled from "styled-components";
import type { ResolvedMatch, ScheduleBlock, TeamEntry, TournamentEvent } from "./types";
import { isFinished, type Court, type ScoreMap } from "../types";
import { courtLetters } from "../timeline";
import PixelBracket, { shirtOf } from "./PixelBracket";
import { BLUSH, drawHeart, drawPlayer, px, type Sprite } from "./pixelSprites";
import { getSavedVoter } from "../voterKey";

type Props = {
  event: TournamentEvent;
  matches: ResolvedMatch[];
  scores: ScoreMap;
  blocks: ScheduleBlock[];
  /** 코트를 누르면 그 경기 아래에 여는 시작·점수 입력 칸. 점수 화면과 같은 카드를 위에서 넘겨준다 */
  renderMatch?: (match: ResolvedMatch) => ReactNode;
};

/**
 * 픽셀 코트 — 대회 진행을 위에서 내려다본 픽셀 테니스장으로 보여 준다. (주인 요청 2026-10-27)
 * 새 데이터를 만들지 않고 점수 화면과 같은 점수 기록(scores)만 읽는다.
 *  · 시작했고 점수가 없는 경기 → 그 코트에서 선수들이 랠리한다
 *  · 이 시간대에 이 코트로 잡힌, 두 팀이 정해진 경기 → 코트 옆에 서서 기다린다
 *  · 그 코트에서 마지막으로 끝난 경기 → 최종 점수, 이긴 팀이 만세
 * 점수는 경기가 끝나야 들어오므로(게임별 기록 없음) 경기 중에는 시작 뒤 지난 시간을 보여 준다.
 * 코트를 누르면 그 경기의 시작·점수 입력 칸이 코트 바로 아래(두 열이면 그 줄 아래)에 열린다 (주인 요청 2026-10-27).
 */


const W = 160;
const H = 88;

type CourtView =
  | { kind: "playing"; match: ResolvedMatch; startedAt: string }
  | { kind: "ready"; match: ResolvedMatch }
  | { kind: "done"; match: ResolvedMatch }
  | { kind: "empty" };

// 코트 색: 대회장(아식스 테니스 아카데미) 2026 코트처럼 안쪽 보라 · 바깥 파랑, 밝고 화사하게 (주인 요청 2026-10-27)
const OUT_A = "#4fb0f7";
const OUT_B = "#5ab8fa";
const IN = "#9a7cff";
const IN_LIGHT = "#a68bff";
const LINE = "#ffffff";

function drawCourt(ctx: CanvasRenderingContext2D) {
  px(ctx, 0, 0, W, H, OUT_A);
  for (let i = 0; i < W; i += 8) px(ctx, i, 0, 4, H, OUT_B);
  const cx = 16, cy = 12, cw = W - 32, ch = H - 24;
  px(ctx, cx, cy, cw, ch, IN);
  // 반사광 한 줄 — 바닥이 반짝여 보이게
  px(ctx, cx + 1, cy + 1, cw - 2, 1, IN_LIGHT);
  px(ctx, cx, cy, cw, 1, LINE);
  px(ctx, cx, cy + ch - 1, cw, 1, LINE);
  px(ctx, cx, cy, 1, ch, LINE);
  px(ctx, cx + cw - 1, cy, 1, ch, LINE);
  px(ctx, cx, cy + 6, cw, 1, LINE);
  px(ctx, cx, cy + ch - 7, cw, 1, LINE);
  const sx = Math.round(cw * 0.23);
  px(ctx, cx + sx, cy + 6, 1, ch - 12, LINE);
  px(ctx, cx + cw - sx - 1, cy + 6, 1, ch - 12, LINE);
  px(ctx, cx + sx, cy + ch / 2, cw - sx * 2, 1, LINE);
  px(ctx, W / 2 - 1, cy - 4, 2, ch + 8, "#f4f1ea");
  px(ctx, W / 2 - 1, cy - 5, 2, 2, "#2b3340");
  px(ctx, W / 2 - 1, cy + ch + 3, 2, 2, "#2b3340");
  drawDecor(ctx);
}

// 코트 밖 꾸밈: 네 구석 화분 · 네트 옆 심판 의자 · 공 바구니 · 수건
function drawDecor(ctx: CanvasRenderingContext2D) {
  for (const [bx, by] of [[1, 0], [W - 9, 0], [1, H - 9], [W - 9, H - 9]] as const) {
    px(ctx, bx + 1, by + 1, 6, 4, "#3fbf6e");
    px(ctx, bx + 2, by, 4, 1, "#3fbf6e");
    px(ctx, bx + 2, by + 2, 1, 1, "#7be09a");
    px(ctx, bx + 5, by + 1, 1, 1, "#ff8fb1"); // 꽃 한 송이
    px(ctx, bx + 2, by + 5, 4, 3, "#ff9f5a");
    px(ctx, bx + 2, by + 5, 4, 1, "#e07b38");
  }
  // 심판 의자
  px(ctx, W / 2 + 4, 1, 5, 3, "#ffcf4a");
  px(ctx, W / 2 + 4, 4, 1, 6, "#c98f2a");
  px(ctx, W / 2 + 8, 4, 1, 6, "#c98f2a");
  // 공 바구니
  px(ctx, 22, H - 9, 8, 5, "#ffffff");
  px(ctx, 22, H - 7, 8, 1, "#d6dde2");
  for (const bx of [23, 25, 27]) px(ctx, bx, H - 11, 2, 2, "#d8f24a");
  // 오른쪽 아래 수건
  px(ctx, W - 32, H - 8, 7, 3, "#ff8fb1");
  px(ctx, W - 32, H - 7, 7, 1, "#ffffff");
}

// 빈 코트: 고양이가 낮잠을 잔다
function drawCat(ctx: CanvasRenderingContext2D) {
  const x = W / 2 - 18, y = H / 2 + 4;
  px(ctx, x, y, 10, 4, "#ffb15c");
  px(ctx, x + 1, y - 2, 1, 2, "#ffb15c");
  px(ctx, x + 4, y - 2, 1, 2, "#ffb15c");
  px(ctx, x + 1, y - 1, 4, 1, "#ffb15c");
  px(ctx, x + 2, y + 1, 1, 1, "#7a4a2a");
  px(ctx, x + 4, y + 1, 1, 1, "#7a4a2a");
  px(ctx, x + 1, y + 2, 1, 1, BLUSH);
  px(ctx, x + 10, y + 2, 3, 1, "#ffb15c");
  px(ctx, x + 6, y, 1, 4, "#e8923e");
  px(ctx, x + 1, y + 4, 9, 1, "#0002");
  const z = "#ffffff";
  px(ctx, x + 6, y - 6, 3, 1, z);
  px(ctx, x + 7, y - 5, 1, 1, z);
  px(ctx, x + 6, y - 4, 3, 1, z);
  px(ctx, x + 11, y - 10, 2, 1, z);
  px(ctx, x + 11, y - 9, 2, 1, z);
}

function paint(
  ctx: CanvasRenderingContext2D,
  view: CourtView,
  sprites: { a: Sprite[]; b: Sprite[] },
  t: number,
  moving: boolean,
) {
  drawCourt(ctx);
  if (view.kind === "empty") {
    drawCat(ctx);
    return;
  }
  const frame = moving ? Math.floor(t / 260) : 0;
  const playing = view.kind === "playing";
  const sway = (k: number) => (moving && playing ? Math.round(Math.sin(t / 700 + k) * 4) : 0);

  if (view.kind === "ready") {
    // 코트 밖 아래쪽 라인에 나란히 서서 기다린다. 한 명씩 번갈아 손을 흔든다
    sprites.a.forEach((s, i) => drawPlayer(ctx, 36 + i * 10, H - 14, s, frame, 1, moving && (frame + i) % 4 === 0));
    sprites.b.forEach((s, i) => drawPlayer(ctx, W - 44 - i * 10, H - 14, s, frame, -1, moving && (frame + i + 2) % 4 === 0));
    return;
  }

  const aWon = view.kind === "done" && view.match.winner?.seed === view.match.teamA?.seed;
  const spots: [number, number, Sprite | undefined, 1 | -1, boolean][] = [
    [32 + sway(1), 22, sprites.a[0], 1, view.kind === "done" && aWon],
    [44 + sway(2), 54, sprites.a[1], 1, view.kind === "done" && aWon],
    [W - 40 + sway(3), 22, sprites.b[0], -1, view.kind === "done" && !aWon],
    [W - 52 + sway(4), 54, sprites.b[1], -1, view.kind === "done" && !aWon],
  ];
  for (const [x, y, s, facing, cheer] of spots) {
    if (!s) continue;
    const lift = cheer && frame % 2 ? 2 : 0;
    drawPlayer(ctx, x, y - lift, s, frame, facing, cheer);
    if (cheer) drawHeart(ctx, x + 2, y - 7 - lift - (frame % 3));
  }
  if (playing) {
    // 공: 양쪽을 포물선으로 오간다
    const p = moving ? (t / 1400) % 2 : 0.5;
    const k = p < 1 ? p : 2 - p;
    const base = 36 + (p < 1 ? 0 : 10);
    const bx = 44 + k * (W - 96);
    px(ctx, bx, base + 4, 2, 1, "#0005");
    px(ctx, bx, base - Math.sin(k * Math.PI) * 14, 2, 2, "#d8f24a");
  }
}

function PixelCourt({
  view,
  sprites,
  moving,
}: {
  view: CourtView;
  sprites: { a: Sprite[]; b: Sprite[] };
  moving: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const animate = moving && view.kind !== "empty";
    if (!animate) {
      paint(ctx, view, sprites, 0, false);
      return;
    }
    let raf = 0;
    const loop = (t: number) => {
      paint(ctx, view, sprites, t, true);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [view, sprites, moving]);
  return <StCanvas ref={ref} width={W} height={H} aria-hidden="true" />;
}

// ───── 응원석 (주인 요청 2026-10-28 "벤치 응원석에 이 녀석들이 응원하게") ─────
// 주인이 보낸 그림의 다섯 친구를 닮은 오리지널 꼬마들: 잎사귀 새싹이 · 노란 꼬마 공룡 · 분홍 동글이 ·
// 쌍안경 든 여자아이 · 손 흔드는 아기. 공개 사이트라 다른 회사 캐릭터를 그대로 베끼지 않았다.
const CW = 160;
const CH = 36;
function drawCheer(ctx: CanvasRenderingContext2D, frame: number) {
  ctx.clearRect(0, 0, CW, CH);
  const up = (i: number) => ((frame + i) % 2 === 0 ? 0 : 1); // 번갈아 통통
  // 바닥·벤치
  px(ctx, 0, 31, CW, 5, "#bfe3ff");
  px(ctx, 10, 26, 140, 3, "#a8763e");
  px(ctx, 10, 26, 140, 1, "#c99558");
  for (const lx of [16, 52, 88, 124, 144]) px(ctx, lx, 29, 3, 4, "#7a5230");
  // 양옆 수건 더미
  px(ctx, 0, 24, 8, 3, "#9be07a"); px(ctx, 0, 27, 8, 2, "#ffffff"); px(ctx, 0, 29, 8, 2, "#d6dde2");
  px(ctx, 152, 25, 8, 3, "#ff9fbf"); px(ctx, 152, 28, 8, 2, "#ffffff"); px(ctx, 152, 30, 8, 1, "#ff9fbf");

  // ① 잎사귀 새싹이 — 파란 동글 몸 + 초록 잎
  {
    const x = 16, y = 14 + up(0);
    const sway = frame % 2 ? 1 : -1;
    px(ctx, x + 4 + sway, y - 7, 2, 5, "#3e9e4f");
    px(ctx, x + 1, y - 5, 3, 4, "#5cc46b");
    px(ctx, x + 7, y - 5, 3, 4, "#5cc46b");
    px(ctx, x - 1 + sway, y - 3, 3, 2, "#7bd389");
    px(ctx, x + 9 + sway, y - 3, 3, 2, "#7bd389");
    px(ctx, x + 1, y, 9, 8, "#5b8fd6");
    px(ctx, x, y + 2, 11, 5, "#5b8fd6");
    px(ctx, x + 3, y + 3, 1, 1, "#1b1b1b"); px(ctx, x + 7, y + 3, 1, 1, "#1b1b1b");
    px(ctx, x + 2, y + 5, 1, 1, "#ff9fbf"); px(ctx, x + 8, y + 5, 1, 1, "#ff9fbf");
    px(ctx, x + 2, y + 8, 2, 2, "#4a78b8"); px(ctx, x + 7, y + 8, 2, 2, "#4a78b8");
  }
  // ② 노란 꼬마 공룡
  {
    const x = 42, y = 10 + up(1);
    px(ctx, x + 1, y, 10, 7, "#f6d32b");
    px(ctx, x + 9, y + 3, 4, 4, "#f6d32b"); // 주둥이
    px(ctx, x + 6, y + 2, 2, 2, "#2e9e5e"); px(ctx, x + 7, y + 2, 1, 1, "#1b1b1b");
    px(ctx, x + 10, y + 6, 3, 1, "#c99a12");
    px(ctx, x + 2, y + 7, 9, 9, "#f6d32b");
    px(ctx, x + 4, y + 9, 5, 6, "#fff3c4"); // 배
    px(ctx, x, y + 9 - up(1), 2, 4, "#f6d32b"); px(ctx, x + 11, y + 8 - up(1), 2, 4, "#f6d32b"); // 팔
    px(ctx, x + 12, y + 8 - up(1), 1, 1, "#ffffff");
    px(ctx, x + 3, y + 16, 3, 1, "#ffffff"); px(ctx, x + 8, y + 16, 3, 1, "#ffffff"); // 발톱
  }
  // ③ 분홍 동글이
  {
    const x = 68, y = 11 + up(2);
    px(ctx, x + 5, y - 2, 2, 2, "#f27a9a"); // 머리 새싹
    px(ctx, x + 1, y, 12, 13, "#f7a1b5");
    px(ctx, x, y + 2, 14, 9, "#f7a1b5");
    px(ctx, x + 1, y, 2, 2, "#f27a9a"); px(ctx, x + 11, y, 2, 2, "#f27a9a"); // 귀
    px(ctx, x + 4, y + 4, 1, 2, "#1b1b1b"); px(ctx, x + 9, y + 4, 1, 2, "#1b1b1b");
    px(ctx, x + 5, y + 7, 4, 3, "#c43d5c"); px(ctx, x + 6, y + 7, 2, 1, "#ffffff"); // 입·앞니
    px(ctx, x + 2, y + 7, 2, 1, "#f27a9a"); px(ctx, x + 10, y + 7, 2, 1, "#f27a9a");
    px(ctx, x + 4, y + 12, 6, 2, "#ffffff");
  }
  // ④ 쌍안경 든 여자아이(옥지) — 빵빵이처럼 큰 동글 얼굴·앞머리·볼터치·웃는 입 (주인 요청 2026-10-28)
  {
    const x = 92, y = 4 + up(3);
    const HAIR = "#6b3f2a", HAIR_HI = "#8a5536", FACE = "#f7d9be";
    // 풍성한 웨이브 머리 (뒷머리가 어깨 아래까지)
    px(ctx, x + 3, y, 12, 2, HAIR);
    px(ctx, x + 1, y + 2, 16, 14, HAIR);
    px(ctx, x, y + 6, 18, 9, HAIR);
    px(ctx, x + 1, y + 15, 3, 3, HAIR); px(ctx, x + 14, y + 15, 3, 3, HAIR);
    px(ctx, x + 4, y + 1, 3, 1, HAIR_HI); px(ctx, x + 2, y + 4, 1, 3, HAIR_HI); // 머리 윤기
    // 큰 동글 얼굴
    px(ctx, x + 4, y + 4, 10, 9, FACE);
    px(ctx, x + 3, y + 6, 12, 5, FACE);
    // 앞머리 (삐죽삐죽)
    px(ctx, x + 4, y + 4, 10, 1, HAIR);
    px(ctx, x + 5, y + 5, 2, 1, HAIR); px(ctx, x + 9, y + 5, 3, 1, HAIR);
    // 작은 쌍안경 — 눈에 대고 있다
    px(ctx, x + 4, y + 6, 4, 3, "#2b3557"); px(ctx, x + 10, y + 6, 4, 3, "#2b3557");
    px(ctx, x + 8, y + 7, 2, 1, "#2b3557");
    px(ctx, x + 5, y + 7, 2, 1, "#8fb4ff"); px(ctx, x + 11, y + 7, 2, 1, "#8fb4ff");
    px(ctx, x + 5, y + 6, 1, 1, "#ffffff"); px(ctx, x + 11, y + 6, 1, 1, "#ffffff");
    // 볼터치 · 웃는 입
    px(ctx, x + 4, y + 10, 2, 1, "#ff9fbf"); px(ctx, x + 12, y + 10, 2, 1, "#ff9fbf");
    px(ctx, x + 8, y + 10, 2, 2, "#c43d5c"); px(ctx, x + 8, y + 11, 2, 1, "#ff7a8a");
    // 쌍안경 든 손
    px(ctx, x + 2, y + 8, 2, 3, FACE); px(ctx, x + 14, y + 8, 2, 3, FACE);
    // 노란 옷 · 파란 치마 · 발
    px(ctx, x + 5, y + 13, 8, 5, "#ffd447");
    px(ctx, x + 7, y + 13, 4, 1, "#ffffff"); // 칼라
    px(ctx, x + 4, y + 18, 10, 3, "#5a7bd6");
    px(ctx, x + 6, y + 21, 2, 1, FACE); px(ctx, x + 10, y + 21, 2, 1, FACE);
  }
  // ⑤ 손 흔드는 아기
  {
    const x = 122, y = 8 + up(4);
    const wave = frame % 2;
    px(ctx, x + 5, y - 1, 2, 1, "#1b1b1b"); px(ctx, x + 6, y - 2, 1, 1, "#1b1b1b"); // 머리카락 한 가닥
    px(ctx, x + 1, y, 10, 10, "#f7d9be");
    px(ctx, x, y + 2, 12, 6, "#f7d9be");
    px(ctx, x + 3, y + 4, 1, 2, "#1b1b1b"); px(ctx, x + 8, y + 4, 1, 2, "#1b1b1b");
    px(ctx, x + 2, y + 7, 2, 1, "#ff9fbf"); px(ctx, x + 8, y + 7, 2, 1, "#ff9fbf");
    px(ctx, x + 5, y + 7, 2, 1, "#c43d5c");
    px(ctx, x + 2, y + 10, 8, 7, "#3fa34d"); // 초록 옷
    px(ctx, x - 1, y + 6 - wave * 2, 2, 5, "#f7d9be"); // 만세
    px(ctx, x + 11, y + 6 - (1 - wave) * 2, 2, 5, "#f7d9be");
  }
}

function CheerSquad({ moving }: { moving: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    if (!moving) {
      drawCheer(ctx, 0);
      return;
    }
    let raf = 0;
    const loop = (t: number) => {
      drawCheer(ctx, Math.floor(t / 420));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [moving]);
  return <StCheerCanvas ref={ref} width={CW} height={CH} role="img" aria-label="응원석에서 꼬마 친구들이 응원하고 있어요" />;
}

function BenchSeat({ team, sprites }: { team: TeamEntry; sprites: Sprite[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 44, 20);
    px(ctx, 0, 13, 44, 3, "#8a6a48");
    px(ctx, 2, 16, 2, 4, "#5a4430");
    px(ctx, 40, 16, 2, 4, "#5a4430");
    sprites.forEach((s, i) => drawPlayer(ctx, 2 + i * 10, 2, s, 0, 1, false));
    // 벤치 밑 물병
    for (const bx of [10, 31]) {
      px(ctx, bx, 16, 2, 4, "#5ab4e8");
      px(ctx, bx, 15, 2, 1, "#ffffff");
    }
  }, [sprites, team.seed]);
  return <StBenchCanvas ref={ref} width={44} height={20} aria-hidden="true" />;
}

const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function PixelCourtPanel({ event, matches, scores, blocks, renderMatch }: Props) {
  // 움직임을 줄여 달라고 설정한 기기에서는 처음부터 멈춘 그림.
  // 탭을 눌러야 그려지는 화면이라 서버 렌더와 어긋날 일이 없다
  const [moving, setMoving] = useState(
    () =>
      typeof window === "undefined" ||
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [now, setNow] = useState(() => Date.now());
  // 투표 탭에서 이 폰에 들어온 "나" — 있으면 우리 팀 경기만 모아 보기를 기본으로 (주인 제안 2026-10-28)
  // 보기만 거르는 것이라 "전체"로 바꾸면 다른 코트도 입력할 수 있다(권한은 진행 요원 규칙 그대로)
  const [myName] = useState(() => getSavedVoter()?.name ?? "");
  const myTeam = event.teams.find((t) => t.players.some((p) => p.name === myName)) ?? null;
  const [scope, setScope] = useState<"mine" | "all">(() => (myTeam ? "mine" : "all"));

  // 화면 너비로 넓힌 픽셀 배경이 가로 스크롤을 만들지 않게, 이 탭이 열린 동안만 옆으로 넘친 부분을 잘라 둔다
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflowX;
    html.style.overflowX = "clip";
    return () => {
      html.style.overflowX = prev;
    };
  }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const female = useMemo(
    () => new Set(event.roster.filter((r) => r.gender === "F").map((r) => r.name)),
    [event.roster],
  );
  // 팀마다 픽셀 선수 묶음. 코트에는 앞의 두 명(복식), 벤치에는 전원
  const spritesByTeam = useMemo(() => {
    const map = new Map<number, Sprite[]>();
    for (const team of event.teams) {
      const named = team.players.filter((p) => p.name.trim());
      const list = (named.length > 0 ? named : team.players).map((p) => ({
        shirt: shirtOf(team),
        female: female.has(p.name),
      }));
      map.set(team.seed, list);
    }
    return map;
  }, [event.teams, female]);

  const visible = matches.filter((m) => m.status !== "hidden");
  // 지금 시간대: 아직 안 끝난 경기가 있는 가장 앞 시간대. 다 끝났으면 마지막
  const openBlocks = visible.filter((m) => m.status !== "done").map((m) => m.template.block);
  const nowBlock = openBlocks.length > 0 ? Math.min(...openBlocks) : blocks.length;
  const blockDone = (no: number) =>
    visible.filter((m) => m.template.block === no).every((m) => m.status === "done");

  const courts = courtLetters(event.courts);
  const courtOf = (m: ResolvedMatch): Court => scores[m.template.no]?.court ?? m.template.court;

  const views = courts.map((court): [Court, CourtView] => {
    const playing = visible.find((m) => {
      const sc = scores[m.template.no];
      return sc?.startedAt && !isFinished(sc) && sc.court === court;
    });
    if (playing) return [court, { kind: "playing", match: playing, startedAt: scores[playing.template.no]!.startedAt! }];
    const ready = visible.find(
      (m) => m.template.block === nowBlock && m.status === "ready" && m.template.court === court,
    );
    if (ready) return [court, { kind: "ready", match: ready }];
    const lastDone = visible
      .filter((m) => m.status === "done" && courtOf(m) === court)
      .sort((x, y) =>
        (scores[y.template.no]?.finishedAt ?? "").localeCompare(scores[x.template.no]?.finishedAt ?? ""),
      )[0];
    if (lastDone) return [court, { kind: "done", match: lastDone }];
    return [court, { kind: "empty" }];
  });

  // 우리 팀 경기: 경기 중 → 시작 가능 → 앞 경기 기다리는 중(번호 순) → 마지막으로 끝난 경기
  const mineList = myTeam
    ? visible.filter((m) => m.teamA?.seed === myTeam.seed || m.teamB?.seed === myTeam.seed)
    : [];
  const myMatch =
    mineList.find((m) => m.status === "playing") ??
    mineList.find((m) => m.status === "ready") ??
    mineList.find((m) => m.status === "waiting") ??
    mineList
      .filter((m) => m.status === "done")
      .sort((x, y) =>
        (scores[y.template.no]?.finishedAt ?? "").localeCompare(scores[x.template.no]?.finishedAt ?? ""),
      )[0] ??
    null;
  const myView: CourtView | null = !myMatch
    ? null
    : myMatch.status === "playing"
      ? { kind: "playing", match: myMatch, startedAt: scores[myMatch.template.no]?.startedAt ?? new Date(now).toISOString() }
      : myMatch.status === "done"
        ? { kind: "done", match: myMatch }
        : { kind: "ready", match: myMatch };
  const mineOnly = scope === "mine" && !!myView;
  const cards: [Court, CourtView][] = mineOnly && myMatch && myView ? [[courtOf(myMatch), myView]] : views;
  const myBlock = myMatch ? blocks.find((b) => b.no === myMatch.template.block) : undefined;

  const onCourt = new Set<number>();
  for (const [, v] of views) {
    if (v.kind !== "playing") continue;
    if (v.match.teamA) onCourt.add(v.match.teamA.seed);
    if (v.match.teamB) onCourt.add(v.match.teamB.seed);
  }
  const nextFor = (team: TeamEntry) =>
    visible.find(
      (m) =>
        m.status === "ready" &&
        (m.teamA?.seed === team.seed || m.teamB?.seed === team.seed),
    );

  // 중계: 점수 기록의 시작·끝 시각으로 만든다
  const log = visible
    .flatMap((m) => {
      const sc = scores[m.template.no];
      if (!sc) return [];
      const court = sc.court ?? m.template.court;
      const vs = `${m.teamA?.name ?? m.aLabel}·${m.teamB?.name ?? m.bLabel}`;
      const items: { at: string; text: string }[] = [];
      if (sc.startedAt) items.push({ at: sc.startedAt, text: `${court}코트 ${vs} ${m.template.label} 시작` });
      if (m.status === "done" && m.winner && sc.finishedAt) {
        const hi = Math.max(sc.scoreA, sc.scoreB);
        const lo = Math.min(sc.scoreA, sc.scoreB);
        items.push({ at: sc.finishedAt, text: `${court}코트 ${m.winner.name}이 ${hi}:${lo}로 이겼어요` });
      }
      return items;
    })
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 6);

  const clock = hhmm(new Date(now).toISOString());

  return (
    <StScene>
      <StSceneHead>
        <StSceneTitle>👾 픽셀 코트</StSceneTitle>
        <StSceneHint>
          {myTeam
            ? "점수 화면과 같은 기록을 보여 줘요. 코트 카드 아래에서 바로 시작·점수 입력을 해요."
            : "점수 화면과 같은 기록을 보여 줘요. 코트 카드 아래에서 바로 시작·점수 입력을 해요. 투표 탭에서 내 이름으로 들어오면 우리 팀 경기만 모아 볼 수 있어요."}
        </StSceneHint>
        {myTeam ? (
          <StScopeRow>
            <StScopes role="group" aria-label="보기">
              <StScopeBtn type="button" aria-pressed={scope === "mine"} onClick={() => setScope("mine")}>
                🙋 우리 팀
              </StScopeBtn>
              <StScopeBtn type="button" aria-pressed={scope === "all"} onClick={() => setScope("all")}>
                전체 코트
              </StScopeBtn>
            </StScopes>
            {scope === "mine" ? (
              <StMine>
                <StSwatch style={{ background: shirtOf(myTeam) }} />
                <b>{myTeam.name}</b> · {myName}님
                {myMatch
                  ? ` — ${myMatch.status === "playing" ? "지금 경기 중" : myMatch.status === "done" ? "마지막 경기" : "다음 경기"}: ${myMatch.template.label} · ${courtOf(myMatch)}코트${myBlock && myMatch.status !== "done" && myMatch.status !== "playing" ? ` · ${myBlock.time.split(" — ")[0]}` : ""}${myMatch.status === "waiting" ? " (앞 경기 결과를 기다려요)" : ""}`
                  : " — 아직 정해진 경기가 없어요"}
              </StMine>
            ) : null}
          </StScopeRow>
        ) : null}
      </StSceneHead>
        <StBoard>
          <StBoardTop>
            <div>
              <StBoardTitle>{event.title}</StBoardTitle>
              <StBoardMeta>
                {event.place} · 코트 {courts.length}면 · {event.gamesToWin}게임 선승
              </StBoardMeta>
            </div>
            <StClock>{clock}</StClock>
          </StBoardTop>
          <StBlocks $count={blocks.length}>
            {blocks.map((b) => (
              <StBlock
                key={b.no}
                $state={b.no === nowBlock && !blockDone(b.no) ? "now" : blockDone(b.no) ? "done" : "next"}
                title={b.title}
              >
                <b>{b.no}</b>
                {b.time.split(" — ")[0]}
              </StBlock>
            ))}
          </StBlocks>
        </StBoard>

        <StCourts $one={mineOnly}>
          {cards.map(([court, view]) => {
            const m = view.kind === "empty" ? null : view.match;
            const sprites = {
              a: m?.teamA ? (spritesByTeam.get(m.teamA.seed) ?? []).slice(0, 2) : [],
              b: m?.teamB ? (spritesByTeam.get(m.teamB.seed) ?? []).slice(0, 2) : [],
            };
            const sc = m ? scores[m.template.no] : undefined;
            const done = view.kind === "done";
            const aLost = done && m?.winner?.seed !== m?.teamA?.seed;
            return (
              <StCourt key={court} aria-label={`${court}코트 ${m ? m.template.label : "비어 있음"}`}>
                <StCourtHead>
                  <StCourtName>{court} COURT</StCourtName>
                  <StRound>{m ? m.template.label : "비어 있음"}</StRound>
                  {view.kind === "playing" ? (
                    <StState $tone="live">
                      경기 중 {Math.max(0, Math.floor((now - new Date(view.startedAt).getTime()) / 60_000))}분
                    </StState>
                  ) : view.kind === "ready" ? (
                    <StState $tone="wait">대기</StState>
                  ) : view.kind === "done" ? (
                    <StState $tone="done">끝</StState>
                  ) : null}
                </StCourtHead>
                <PixelCourt view={view} sprites={sprites} moving={moving} />
                <StScore>
                  <StSide>
                    {m?.teamA ? <StSwatch style={{ background: shirtOf(m.teamA) }} /> : null}
                    <StTeam>{m ? (m.teamA?.name ?? m.aLabel) : "—"}</StTeam>
                  </StSide>
                  <StGames>
                    {done && sc ? (
                      <>
                        <StGame $dim={aLost}>{sc.scoreA}</StGame> : <StGame $dim={!aLost}>{sc.scoreB}</StGame>
                      </>
                    ) : (
                      "VS"
                    )}
                  </StGames>
                  <StSide $right>
                    <StTeam>{m ? (m.teamB?.name ?? m.bLabel) : "—"}</StTeam>
                    {m?.teamB ? <StSwatch style={{ background: shirtOf(m.teamB) }} /> : null}
                  </StSide>
                </StScore>
                {/* 코트마다 자기 입력 칸 — 코트를 바꿔 누를 일 없이 각자 자기 코트에서 (주인 요청 2026-10-28) */}
                {m && renderMatch ? <StCardEntry>{renderMatch(m)}</StCardEntry> : null}
              </StCourt>
            );
          })}
        </StCourts>

        <StLower>
          <StPanel>
            <StPanelTitle>벤치 · 응원석</StPanelTitle>
            <CheerSquad moving={moving} />
            <StBench>
              {event.teams.map((team) => {
                const next = onCourt.has(team.seed) ? null : nextFor(team);
                return (
                  <StSeat key={team.seed} $on={onCourt.has(team.seed)}>
                    <BenchSeat team={team} sprites={spritesByTeam.get(team.seed) ?? []} />
                    <StSeatName>{team.name}</StSeatName>
                    <StSeatState>
                      {onCourt.has(team.seed)
                        ? "코트에서 경기 중"
                        : next
                          ? `다음 ${next.template.court}코트`
                          : "쉬는 중"}
                    </StSeatState>
                  </StSeat>
                );
              })}
            </StBench>
          </StPanel>
          <StPanel>
            <StPanelTitle>중계</StPanelTitle>
            {log.length > 0 ? (
              <StLog>
                {log.map((l) => (
                  <li key={`${l.at}-${l.text}`}>
                    <time>{hhmm(l.at)}</time>
                    <span>{l.text}</span>
                  </li>
                ))}
              </StLog>
            ) : (
              <StEmpty>아직 시작한 경기가 없어요. 첫 경기를 시작하면 여기에 쌓여요.</StEmpty>
            )}
            <StMotionBtn type="button" onClick={() => setMoving((v) => !v)}>
              {moving ? "움직임 멈추기" : "움직임 켜기"}
            </StMotionBtn>
          </StPanel>
        </StLower>

        <StPanel>
          <StPanelTitle>🏆 대진표</StPanelTitle>
          <PixelBracket matches={matches} blocks={blocks} sprites={spritesByTeam} moving={moving} />
        </StPanel>
    </StScene>
  );
}

// ───── 스타일: 코트 그림 영역은 테마와 상관없이 늘 밤의 실내 테니스장 색 ─────
const PIX = "ui-monospace, Menlo, Consolas, monospace";
const INK = "#24343b";
const DIM = "#6b7c80";
const LED = "#ffcf4a"; // 지금 라운드 칸 · 움직임 버튼 바탕
const FLOOR = "#ffffff";
const ACCENT = "#e8761c"; // 밝은 판 위 강조 글자
const CARD_SHADOW = "4px 4px 0 #2f7a4f22";

// 픽셀 배경은 흰 카드 없이 화면 좌우 끝까지 깐다 (주인 요청 2026-10-27 — PC 좌우 여백도 픽셀로).
// 내용 폭은 페이지 폭 그대로 두고, 배경만 ::before 로 화면 너비만큼 넓힌다.
// 넓힌 배경이 가로 스크롤을 만들지 않게 이 탭이 열린 동안 html 에 overflow-x: clip 을 건다(아래 effect).
const StScene = styled.section`
  position: relative;
  isolation: isolate;
  display: grid;
  gap: 0.9rem;
  padding-block: 1rem 1.4rem;
  color: ${INK};

  &::before {
    content: "";
    position: absolute;
    z-index: -1;
    top: 0;
    bottom: 0;
    left: 50%;
    width: 100vw;
    transform: translateX(-50%);
    /* 낮의 테니스 클럽 — 하늘에서 잔디로 넘어가는 밝은 바탕에 옅은 격자 (주인 요청 2026-10-27 "배경도 낮으로") */
    background-color: #e6f7ea;
    background-image:
      linear-gradient(#d2efdb 2px, transparent 2px),
      linear-gradient(90deg, #d2efdb 2px, transparent 2px),
      linear-gradient(#c9ecff, #e6f7ea 360px);
    background-size: 32px 32px;
    background-position: center top;
  }
`;

const StSceneHead = styled.div`
  display: grid;
  gap: 0.3rem;
`;

const StSceneTitle = styled.h2`
  font-size: 1rem;
  font-weight: 800;
`;

const StScopeRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.8rem;
`;

const StScopes = styled.div`
  display: inline-flex;
  gap: 3px;
  padding: 3px;
  background: #ffffffaa;
`;

const StScopeBtn = styled.button`
  padding: 0.35rem 0.8rem;
  border: 0;
  font-size: 0.82rem;
  font-weight: 800;
  color: ${DIM};
  background: transparent;
  cursor: pointer;

  &[aria-pressed="true"] {
    color: ${INK};
    background: ${LED};
    box-shadow: 2px 2px 0 ${INK};
  }

  &:focus-visible {
    outline: 2px solid ${ACCENT};
    outline-offset: 1px;
  }
`;

const StMine = styled.p`
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  line-height: 1.5;
  color: ${INK};

  b {
    font-weight: 900;
  }
`;

const StSceneHint = styled.p`
  font-size: 0.82rem;
  line-height: 1.5;
  color: ${DIM};
`;

const StBoard = styled.div`
  display: grid;
  gap: 0.7rem;
  padding: 0.8rem 0.9rem;
  /* 전광판도 낮 톤으로 — 흰 판 + 코트 보라 제목 (주인 요청 2026-10-27 "상단 배너도 톤앤매너 맞춰") */
  background: ${FLOOR};
  box-shadow: ${CARD_SHADOW};
`;

const StBoardTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.4rem 1rem;
`;

const StBoardTitle = styled.div`
  font-family: ${PIX};
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #7a5cf0;
`;

const StBoardMeta = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${DIM};
`;

const StClock = styled.div`
  font-family: ${PIX};
  font-size: 1rem;
  font-weight: 800;
  color: ${ACCENT};
  font-variant-numeric: tabular-nums;
`;

const StBlocks = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(0, 1fr));
  gap: 4px;
`;

const StBlock = styled.div<{ $state: "done" | "now" | "next" }>`
  padding: 0.35rem 0.1rem;
  text-align: center;
  font-family: ${PIX};
  font-size: 0.68rem;
  font-variant-numeric: tabular-nums;
  background: ${({ $state }) => ($state === "now" ? LED : $state === "done" ? "#e3f6ea" : "#eef3f6")};
  color: ${({ $state }) => ($state === "now" ? "#24343b" : $state === "done" ? "#2e9e5e" : DIM)};

  b {
    display: block;
    font-size: 0.78rem;
  }
`;

// 우리 팀만 볼 때는 한 면을 가운데에 크게(너무 커지지 않게 폭 제한)
const StCourts = styled.div<{ $one?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $one }) => ($one ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))")};
  gap: 0.8rem;
  width: 100%;
  max-width: ${({ $one }) => ($one ? "680px" : "none")};
  margin-inline: auto;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StCourt = styled.section`
  display: grid;
  align-content: start;
  gap: 0.5rem;
  min-width: 0;
  padding: 0.6rem;
  background: ${FLOOR};
  box-shadow: ${CARD_SHADOW};
`;

// 카드 안 입력 칸: 코트 그림 아래 점선 한 줄로 나눈다
const StCardEntry = styled.div`
  padding-top: 0.5rem;
  border-top: 2px dashed #d8e3e7;
`;

const StCourtHead = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
`;

const StCourtName = styled.span`
  font-family: ${PIX};
  font-size: 0.78rem;
  font-weight: 800;
  color: ${ACCENT};
`;

const StRound = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${DIM};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StState = styled.span<{ $tone: "live" | "wait" | "done" }>`
  padding: 0.1rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #121b20;
  background: ${({ $tone }) => ($tone === "live" ? "#ff6b57" : $tone === "done" ? "#7ad3a0" : "#cfd8db")};
`;

const StCanvas = styled.canvas`
  display: block;
  width: 100%;
  aspect-ratio: ${W} / ${H};
  image-rendering: pixelated;
`;

const StScore = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) 4.5rem minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
`;

const StSide = styled.div<{ $right?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $right }) => ($right ? "flex-end" : "flex-start")};
  gap: 0.4rem;
  min-width: 0;
`;

const StSwatch = styled.i`
  flex: none;
  width: 0.7rem;
  height: 0.7rem;
`;

const StTeam = styled.span`
  font-size: 0.86rem;
  font-weight: 800;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StGames = styled.div`
  text-align: center;
  font-family: ${PIX};
  font-size: 1rem;
  font-weight: 800;
  color: ${ACCENT};
  font-variant-numeric: tabular-nums;
`;

const StGame = styled.span<{ $dim: boolean }>`
  color: ${({ $dim }) => ($dim ? "#c3cacc" : ACCENT)};
`;

const StLower = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: 0.8rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StPanel = styled.div`
  display: grid;
  align-content: start;
  gap: 0.6rem;
  padding: 0.8rem;
  min-width: 0;
  background: ${FLOOR};
  box-shadow: ${CARD_SHADOW};
`;

const StPanelTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 800;
`;

const StBench = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StSeat = styled.div<{ $on: boolean }>`
  display: grid;
  justify-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.3rem;
  background: #eef8f1;
  opacity: ${({ $on }) => ($on ? 0.45 : 1)};
`;

const StCheerCanvas = styled.canvas`
  display: block;
  width: 100%;
  max-width: 520px;
  aspect-ratio: ${CW} / ${CH};
  image-rendering: pixelated;
`;

const StBenchCanvas = styled.canvas`
  width: 66px;
  height: 30px;
  image-rendering: pixelated;
`;

const StSeatName = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
`;

const StSeatState = styled.span`
  font-size: 0.72rem;
  font-weight: 600;
  color: ${DIM};
  text-align: center;
`;

const StLog = styled.ol`
  display: grid;
  gap: 0.45rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.82rem;
  line-height: 1.5;

  li {
    display: grid;
    grid-template-columns: 3rem minmax(0, 1fr);
    gap: 0.4rem;
  }

  time {
    font-family: ${PIX};
    font-size: 0.78rem;
    color: ${ACCENT};
    font-variant-numeric: tabular-nums;
  }
`;

const StEmpty = styled.p`
  font-size: 0.82rem;
  line-height: 1.5;
  color: ${DIM};
`;

const StMotionBtn = styled.button`
  justify-self: start;
  padding: 0.4rem 0.8rem;
  border: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: #121b20;
  background: ${LED};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${ACCENT};
    outline-offset: 2px;
  }
`;
