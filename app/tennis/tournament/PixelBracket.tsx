"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import styled from "styled-components";
import { drawFire, drawHeart, drawPlayer, type Sprite } from "./pixelSprites";
import type { ResolvedMatch, ScheduleBlock, TeamEntry } from "./types";
import { ONE_SHEET, ONE_SHEET_LINKS, roundHeads, type Layout, type Link } from "./BracketTree";

/**
 * 픽셀 대진표 — 픽셀 코트 탭 아래의 토너먼트 그림. (주인 요청 2026-10-27)
 * 승자조·패자조를 나누지 않고 한 장에 그린다 (주인 요청 2026-10-27 "안 나누고 그려 줄 수 없어?").
 * 배치(ONE_SHEET)는 토너먼트 그림 탭과 같다.
 *  · 열 = 라운드(1~6). 같은 시간에 하는 경기가 같은 세로줄에 선다
 *  · 위쪽 = 승자조, 아래쪽 = 패자조, 맨 오른쪽 = 그랜드 파이널, 맨 아래 = 순위결정전
 *  · 노란 선 = 이긴 팀이 올라가는 길, 분홍 점선 = 진 팀이 패자조로 내려가는 길
 * 팀 이름 아래에 명단 한 줄 — 토너먼트 그림과 같은 방식.
 */

// 팀 시드별 셔츠 색 — 픽셀 코트와 대진표가 같은 색을 쓴다
// 6팀은 보라 코트 위에서 묻혀 진한 남색으로 (2026-10-27)
export const SHIRT = ["#e8504a", "#f29b38", "#f2d64b", "#6cc96a", "#4cc3d9", "#2f4ab8", "#ef86c1", "#f4f1ea"];
export const shirtOf = (team: TeamEntry) => SHIRT[(team.seed - 1) % SHIRT.length];

// 명단 한 줄씩 넣으며 칸을 넓히고 높였다 (150×64 → 180×96). 한 장으로 합치며 열 사이를 넓혀
// 이긴 길(가운데)과 진 길(오른쪽 칸 바로 앞) 세로선이 겹치지 않게 했다 (2026-10-27)
const COL_W = 232;
const ROW_H = 108;
const NODE_W = 180;
const NODE_H = 96;
const PAD = 6;
const HEAD_H = 26; // 맨 위 시간대 줄

const DROP = "#ff8fb1";

const PIX = "ui-monospace, Menlo, Consolas, monospace";
// 낮 배경(밝은 바탕) 위 색 (2026-10-27)
const LED = "#ffcf4a"; // 라운드 줄 바탕
const GOLD = "#f0a020"; // 이긴 길 선 · 이긴 팀 글자
const INK = "#24343b";
const DIM = "#6b7c80";
const LINE_OFF = "#c2cdd0";

const STATE_EDGE: Record<ResolvedMatch["status"], string> = {
  playing: "#ff6b57",
  ready: LED,
  done: "#7ad3a0",
  waiting: "#cfd8db",
  hidden: "#e3e8ea",
};
// 칸 머리 띠 바탕 — 상태가 한눈에 보이게 옅은 색으로 (주인 요청 2026-10-28 "대진표도 픽셀로 더 귀엽게")
const STATE_BAND: Record<ResolvedMatch["status"], string> = {
  playing: "#ffe1db",
  ready: "#fff3c4",
  done: "#dcf5e6",
  waiting: "#eef3f4",
  hidden: "#f3f6f7",
};
const STATE_TEXT: Record<ResolvedMatch["status"], string> = {
  playing: "🎾 경기 중",
  ready: "▶ 시작 가능",
  done: "✔ 끝",
  waiting: "",
  hidden: "조건부",
};

// ───── 이긴 팀이 다음 칸으로 걸어가서 환호 (주인 요청 2026-10-28) ─────
// 결과가 난 경기의 이긴 팀 꼬마 둘이 노란 선을 따라 걸어가 다음 경기 칸 앞에 서서 만세를 한다.
// 다음 경기도 끝나면 거기서 또 이긴 팀이 걸어 나간다(진 팀은 그 자리에서 사라진다).
// 진 팀은 분홍 점선을 따라 패자조 칸으로 내려가 머리 위에 불꽃을 피운다 — 승부를 불태운다 (주인 요청 2026-10-28).
// 그랜드 파이널이 끝나면 우승팀이 그 칸 위에서 하트를 띄운다.
// 걷기는 대진표가 화면에 보일 때 한 번, 새 결과가 들어오면 그 팀만 다시. 그 뒤엔 제자리 환호.
type Pt = { x: number; y: number };
type Walker = { key: string; seed: number; path: Pt[]; mood: "cheer" | "fire" };
const SCALE = 2; // 꼬마 한 칸 = 화면 2px
const WALK_MS = 2400;

function along(path: Pt[], d: number): Pt {
  let left = Math.max(0, d);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1], b = path[i];
    const len = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
    if (left <= len) {
      const k = len === 0 ? 0 : left / len;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    left -= len;
  }
  return path[path.length - 1];
}
const lengthOf = (path: Pt[]) =>
  path.slice(1).reduce((sum, b, i) => sum + Math.abs(b.x - path[i].x) + Math.abs(b.y - path[i].y), 0);

function WalkLayer({
  width,
  height,
  walkers,
  champion,
  sprites,
  moving,
}: {
  width: number;
  height: number;
  walkers: Walker[];
  champion: { seed: number; at: Pt } | null;
  sprites: Map<number, Sprite[]>;
  moving: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const started = useRef(new Map<string, number>());
  const sig = walkers.map((w) => w.key).join("|") + (champion ? `|champ${champion.seed}` : "");

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let visible = false;
    let raf = 0;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const frame = Math.floor(t / 300);
      for (const w of walkers) {
        const team = (sprites.get(w.seed) ?? []).slice(0, 2);
        const total = lengthOf(w.path);
        const t0 = started.current.get(w.key);
        const p = !moving ? 1 : t0 === undefined ? 0 : Math.min(1, (t - t0) / WALK_MS);
        const arrived = p >= 1;
        team.forEach((sp, i) => {
          const pt = along(w.path, total * p - i * 20);
          const x = pt.x / SCALE - 4;
          const y = pt.y / SCALE - 11;
          const step = arrived ? frame : Math.floor(t / 140);
          if (w.mood === "fire") {
            // 진 팀: 라켓을 쥐고 제자리에서 다리를 구르며 머리 위 불꽃
            drawPlayer(ctx, x, y, sp, step, 1, false);
            if (arrived) drawFire(ctx, x + 2, y - 7, frame + i);
            return;
          }
          const lift = arrived && moving && (frame + i) % 2 ? 1 : 0;
          drawPlayer(ctx, x, y - lift, sp, step, 1, arrived);
          if (arrived && moving && (frame + i) % 4 === 0) drawHeart(ctx, x + 2, y - 7);
        });
      }
      if (champion) {
        const team = sprites.get(champion.seed) ?? [];
        team.forEach((sp, i) => {
          const x = champion.at.x / SCALE - team.length * 5 + i * 10;
          const y = champion.at.y / SCALE - 13;
          const lift = moving && (frame + i) % 2 ? 1 : 0;
          drawPlayer(ctx, x, y - lift, sp, frame, 1, true);
          if (moving && (frame + i) % 3 === 0) drawHeart(ctx, x + 2, y - 7 - lift);
        });
      }
    };

    // 처음 보는 걷기만 시작 시각을 적는다 — 20초마다 새로 읽어도 이미 걸은 팀은 다시 걷지 않는다
    const kick = (t: number) => {
      for (const w of walkers) if (!started.current.has(w.key)) started.current.set(w.key, t);
    };
    const loop = (t: number) => {
      if (visible) kick(t);
      draw(t);
      raf = requestAnimationFrame(loop);
    };

    if (!moving) {
      draw(0);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0.25 },
    );
    // 대진표는 휴대폰 화면보다 훨씬 넓어 그림 자체로는 25%가 안 보인다 → 옆으로 미는 틀(StScroll) 기준으로 본다
    io.observe(canvas.parentElement?.parentElement ?? canvas);
    raf = requestAnimationFrame(loop);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // sig 가 걷는 팀·우승팀을 대신한다 (배열은 매 렌더 새로 만들어진다)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, sprites, moving]);

  return (
    <StWalk
      ref={ref}
      width={Math.ceil(width / SCALE)}
      height={Math.ceil(height / SCALE)}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

function Tree({
  title,
  hint,
  layout,
  links,
  by,
  colHeads,
  sprites,
  moving,
}: {
  title: string;
  hint: string;
  layout: Layout[];
  links: Link[];
  by: Map<number, ResolvedMatch>;
  colHeads: string[];
  sprites: Map<number, Sprite[]>;
  moving: boolean;
}) {
  const cols = Math.max(...layout.map((l) => l.col)) + 1;

  // 라운드 넘기기 (주인 요청 2026-10-28 "스크롤 말고 스와이프처럼 라운드 넘길 수 있게")
  // 밀면 라운드 머리(StColHead)에 딱 멈추고, ◀ ▶ 로도 한 라운드씩 넘긴다. 화면에 다 들어오면 버튼은 숨긴다
  const scrollRef = useRef<HTMLDivElement>(null);
  const [col, setCol] = useState(0);
  const [canSlide, setCanSlide] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setCanSlide(el.scrollWidth - el.clientWidth > 4);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  // 왼쪽 끝에서 처음으로 온전히 보이는 라운드 (끝까지 밀면 마지막 열은 왼쪽 끝에 못 붙어서 올림으로 센다)
  const colAt = (left: number) => Math.min(colHeads.length - 1, Math.max(0, Math.ceil((left - 20) / COL_W)));
  // 한 번 밀 때 한 라운드만: 밀기가 멈추면 시작한 라운드에서 밀린 방향으로 딱 한 칸 옆에 세운다.
  // (CSS 멈춤만으로는 휴대폰에서 세게 밀면 두세 라운드씩 건너뛰었다 — 2026-10-28 확인)
  const gesture = useRef<{ from: number | null; timer: number; settled: number }>({ from: null, timer: 0, settled: 0 });
  useEffect(() => () => window.clearTimeout(gesture.current.timer), []);
  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCol(colAt(el.scrollLeft));
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4);
    const g = gesture.current;
    if (g.from === null) g.from = g.settled;
    window.clearTimeout(g.timer);
    g.timer = window.setTimeout(() => {
      const start = g.from ?? 0;
      g.from = null;
      const moved = el.scrollLeft - start;
      if (Math.abs(moved) > 4) {
        const max = el.scrollWidth - el.clientWidth;
        const target = Math.min(max, Math.max(0, (colAt(start) + Math.sign(moved)) * COL_W));
        if (Math.abs(el.scrollLeft - target) > 2) {
          g.settled = target;
          el.scrollTo({ left: target, behavior: "smooth" });
          return;
        }
      }
      g.settled = el.scrollLeft;
    }, 140);
  };
  // PC 마우스로 잡아끌기 — 끄는 동안만 멈춤(snap)을 꺼서 손에 붙어 움직이고, 놓으면 위 한 칸 규칙으로 선다
  const drag = useRef<{ x: number; left: number } | null>(null);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { x: e.clientX, left: el.scrollLeft };
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
    el.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !drag.current) return;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
  };
  const onPointerUp = () => {
    const el = scrollRef.current;
    if (!el || !drag.current) return;
    drag.current = null;
    el.style.scrollSnapType = "";
    el.style.scrollBehavior = "";
    onScroll();
  };
  const goCol = (next: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const c = Math.max(0, Math.min(colHeads.length - 1, next));
    el.scrollTo({ left: c * COL_W, behavior: "smooth" });
  };
  const rows = Math.max(...layout.map((l) => l.row)) + 1;
  const width = PAD * 2 + (cols - 1) * COL_W + NODE_W;
  const height = HEAD_H + PAD * 2 + (rows - 1) * ROW_H + NODE_H;
  const at = new Map(
    layout.map((l) => [l.no, { x: PAD + l.col * COL_W, y: HEAD_H + PAD + l.row * ROW_H }]),
  );

  // 이긴 팀이 지금 서 있는 곳: 끝난 경기 → 아직 안 끝난 다음 경기 칸 앞
  const walkers: Walker[] = [];
  for (const lk of links) {
    const fm = by.get(lk.from);
    const tm = by.get(lk.to);
    const from = at.get(lk.from);
    const to = at.get(lk.to);
    const mover = lk.kind === "winner" ? fm?.winner : fm?.loser;
    if (!fm || !tm || !from || !to || fm.status !== "done" || !mover) continue;
    if (tm.status === "done" || tm.status === "hidden") continue;
    const x1 = from.x + NODE_W;
    const y1 = Math.round(from.y + NODE_H / 2);
    const x2 = to.x;
    // 다음 칸에서 그 팀이 들어갈 줄(위 A팀 / 아래 B팀) 앞에 선다 — 같은 칸으로 가는 두 팀이 겹치지 않게
    const goesA = tm.teamA?.seed === mover.seed;
    const y2 = Math.round(to.y + (goesA ? NODE_H * 0.36 : NODE_H * 0.78));
    // 이긴 길은 선처럼 열 사이 가운데에서 꺾는다. 진 길은 앞 칸을 나서자마자 내려가서
    // 받는 칸 앞에 둘이 나란히 서게 한다(선처럼 칸 바로 앞에서 꺾으면 둘이 세로로 겹쳐 섰다)
    const bend = lk.kind === "winner" ? Math.round(x1 + (x2 - x1) / 2) : x1 + 6;
    walkers.push({
      key: `${lk.from}>${lk.to}:${mover.seed}`,
      seed: mover.seed,
      mood: lk.kind === "winner" ? "cheer" : "fire",
      path: [{ x: x1 - 24, y: y1 }, { x: bend, y: y1 }, { x: bend, y: y2 }, { x: x2 - 8, y: y2 }],
    });
  }
  // 승자조(위)와 패자조(아래) 사이 빈 줄에 울타리를 친다 — 위 칸 바닥과 아래 칸 꼭대기의 가운데
  const winBottom = Math.max(...layout.filter((l) => l.row < 4).map((l) => l.row));
  const loseTop = Math.min(...layout.filter((l) => l.row >= 4).map((l) => l.row));
  const fenceY = Number.isFinite(loseTop)
    ? Math.round(HEAD_H + PAD + (winBottom * ROW_H + NODE_H + loseTop * ROW_H) / 2)
    : 0;

  const final = by.get(16);
  const finalAt = at.get(16);
  const champion =
    final && finalAt && final.status === "done" && final.winner
      ? { seed: final.winner.seed, at: { x: finalAt.x + NODE_W / 2, y: finalAt.y - 2 } }
      : null;

  return (
    <StTree>
      <StTreeTitle>
        {title} <span>{hint}</span>
      </StTreeTitle>
      {canSlide ? (
        <StSlide>
          <StArrow type="button" aria-label="이전 라운드" disabled={col === 0} onClick={() => goCol(col - 1)}>
            ◀
          </StArrow>
          <StSlideLabel aria-live="polite">{colHeads[col]}</StSlideLabel>
          <StArrow
            type="button"
            aria-label="다음 라운드"
            disabled={atEnd}
            onClick={() => goCol(col + 1)}
          >
            ▶
          </StArrow>
        </StSlide>
      ) : null}
      <StScroll
        ref={scrollRef}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        $grab={canSlide}
      >
        <StBoard style={{ width, height, backgroundPositionX: PAD - (COL_W - NODE_W) / 2 }}>
          <svg width={width} height={height} shapeRendering="crispEdges" aria-hidden="true">
            {links.map((lk) => {
              const from = at.get(lk.from);
              const to = at.get(lk.to);
              const fm = by.get(lk.from);
              const tm = by.get(lk.to);
              if (!from || !to || !fm || !tm || tm.status === "hidden") return null;
              const x1 = from.x + NODE_W;
              const y1 = Math.round(from.y + NODE_H / 2);
              const x2 = to.x;
              const y2 = Math.round(to.y + NODE_H / 2);
              const decided = fm.status === "done";
              if (lk.kind === "loser") {
                // 진 팀 길: 받는 칸 바로 앞에서 꺾어 내려간다 — 이긴 길 세로선(열 사이 가운데)과 겹치지 않게
                const drop = x2 - 12;
                return (
                  <path
                    key={`${lk.from}-${lk.to}-l`}
                    d={`M ${x1} ${y1 + 8} H ${drop} V ${y2 - 8} H ${x2}`}
                    fill="none"
                    stroke={DROP}
                    strokeWidth={decided ? 2 : 1}
                    strokeDasharray="3 3"
                    opacity={decided ? 1 : 0.55}
                  />
                );
              }
              const mid = Math.round(x1 + (x2 - x1) / 2);
              return (
                <path
                  key={`${lk.from}-${lk.to}`}
                  d={`M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`}
                  fill="none"
                  stroke={decided ? GOLD : LINE_OFF}
                  strokeWidth={decided ? 4 : 2}
                  strokeDasharray={decided ? undefined : "4 4"}
                />
              );
            })}
          </svg>
          <WalkLayer
            width={width}
            height={height}
            walkers={walkers}
            champion={champion}
            sprites={sprites}
            moving={moving}
          />
          {fenceY ? (
            <StFence style={{ top: fenceY }}>
              <span>▲ 승자조</span>
              <span>▼ 패자조</span>
            </StFence>
          ) : null}
          {colHeads.map((h, i) => (
            <StColHead key={h} style={{ left: PAD + i * COL_W, width: NODE_W }}>
              {h}
            </StColHead>
          ))}
          {layout.map((l) => {
            const m = by.get(l.no);
            if (!m) return null;
            const p = at.get(l.no)!;
            const done = m.status === "done";
            const row = (team: TeamEntry | null, label: string, score: number | null) => {
              const won = done && !!team && m.winner?.seed === team.seed;
              // 팀 안 시드 순서. 아직 팀이 안 정해진 칸도 같은 높이로 비워 둔다
              const names = team
                ? [...team.players].sort((a, b) => a.seed - b.seed).map((p) => p.name).filter((n) => n.trim())
                : [];
              return (
                <div>
                  <StRow $won={won} $lost={done && !won} $empty={!team}>
                    <StShirt style={{ background: team ? shirtOf(team) : "transparent" }} />
                    <StName>
                      {team ? team.name : label}
                      {won ? <StCrown aria-label="승리"> 👑</StCrown> : null}
                    </StName>
                    <StPts>{score ?? ""}</StPts>
                  </StRow>
                  <StRoster title={names.join(" · ") || undefined}>
                    {names.length ? names.join("·") : " "}
                  </StRoster>
                </div>
              );
            };
            return (
              <StNode
                key={l.no}
                style={{ left: p.x, top: p.y }}
                $edge={m.template.stage === "grand-final" ? GOLD : STATE_EDGE[m.status]}
                $dim={m.status === "hidden"}
              >
                <StHead style={{ background: STATE_BAND[m.status] }}>
                  <span>
                    {m.template.stage === "grand-final" ? "🏆 " : ""}
                    {m.template.no} · {m.template.label}
                  </span>
                  <span>{STATE_TEXT[m.status] || `${m.template.block}타임`}</span>
                </StHead>
                {row(m.teamA, m.aLabel, m.scoreA)}
                {row(m.teamB, m.bLabel, m.scoreB)}
              </StNode>
            );
          })}
        </StBoard>
      </StScroll>
    </StTree>
  );
}

export default function PixelBracket({
  matches,
  blocks,
  sprites,
  moving,
}: {
  matches: ResolvedMatch[];
  blocks: ScheduleBlock[];
  /** 팀 시드 → 꼬마 선수들 (픽셀 코트와 같은 그림) */
  sprites: Map<number, Sprite[]>;
  moving: boolean;
}) {
  const by = new Map(matches.map((m) => [m.template.no, m]));
  const heads = roundHeads(blocks);
  return (
    <StWrap>
      <Tree
        title="한 장 대진표"
        hint="위 승자조 · 아래 패자조 · 노란 선 이긴 길 · 분홍 점선 진 팀이 내려가는 길"
        layout={ONE_SHEET}
        links={ONE_SHEET_LINKS}
        by={by}
        colHeads={heads}
        sprites={sprites}
        moving={moving}
      />
    </StWrap>
  );
}

const StWrap = styled.div`
  display: grid;
  gap: 1rem;
`;

const StTree = styled.div`
  display: grid;
  gap: 0.4rem;
  min-width: 0;
`;

const StTreeTitle = styled.div`
  font-family: ${PIX};
  font-size: 0.82rem;
  font-weight: 800;
  color: #e8761c;

  span {
    font-family: inherit;
    font-size: 0.72rem;
    font-weight: 600;
    color: ${DIM};
  }
`;

// 라운드 머리: 양 끝이 V 자로 파인 노란 리본
const StColHead = styled.div`
  position: absolute;
  top: 0;
  height: ${HEAD_H - 6}px;
  display: grid;
  place-items: center;
  font-family: ${PIX};
  font-size: 0.68rem;
  font-weight: 800;
  color: #121b20;
  background: ${LED};
  scroll-snap-align: start;
  scroll-snap-stop: always;
  scroll-margin-left: ${PAD}px;
  clip-path: polygon(0 0, 100% 0, calc(100% - 7px) 50%, 100% 100%, 0 100%, 7px 50%);
`;

// 승자조 / 패자조 사이 하얀 픽셀 울타리
const StFence = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  height: 10px;
  transform: translateY(-50%);
  background:
    linear-gradient(#ffffff, #ffffff) 0 2px / 100% 2px no-repeat,
    linear-gradient(#ffffff, #ffffff) 0 6px / 100% 2px no-repeat,
    repeating-linear-gradient(90deg, #ffffff 0 4px, transparent 4px 16px);
  filter: drop-shadow(0 2px 0 #9fd3b0);

  span {
    position: absolute;
    top: 50%;
    padding: 1px 6px;
    font-family: ${PIX};
    font-size: 0.62rem;
    font-weight: 800;
    color: #ffffff;
    transform: translateY(-120%);
  }

  span:first-child {
    left: ${PAD}px;
    background: ${GOLD};
  }

  span:last-child {
    left: ${PAD}px;
    background: ${DROP};
    transform: translateY(20%);
  }
`;

const StWalk = styled.canvas`
  position: absolute;
  inset: 0;
  pointer-events: none;
  image-rendering: pixelated;
`;

// 밀면 스르륵 미끄러지다 라운드 단위로 딱 멈춘다 — 세게 밀어도 한 번에 한 라운드만 (주인 요청 2026-10-28)
// 스크롤 막대는 숨기고 스와이퍼처럼만 쓴다 (주인 요청 2026-10-28 "가로 스크롤 빼고 스와이퍼만")
const StScroll = styled.div<{ $grab: boolean }>`
  overflow-x: auto;
  scrollbar-width: none;
  cursor: ${({ $grab }) => ($grab ? "grab" : "auto")};
  user-select: none;
  &::-webkit-scrollbar {
    display: none;
  }
  &:active {
    cursor: ${({ $grab }) => ($grab ? "grabbing" : "auto")};
  }
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-x: contain;
`;

const StSlide = styled.div`
  display: grid;
  grid-template-columns: 2.4rem 1fr 2.4rem;
  align-items: center;
  gap: 0.4rem;
`;

const StSlideLabel = styled.div`
  text-align: center;
  font-family: ${PIX};
  font-size: 0.8rem;
  font-weight: 800;
  color: ${INK};
`;

const StArrow = styled.button`
  height: 2rem;
  border: 0;
  font-size: 0.8rem;
  color: ${INK};
  background: ${LED};
  box-shadow: 2px 2px 0 ${INK};
  cursor: pointer;

  &:active:not(:disabled) {
    transform: translate(2px, 2px);
    box-shadow: none;
  }

  &:disabled {
    color: #9aa6a9;
    background: #eef3f4;
    box-shadow: 2px 2px 0 #c2cdd0;
    cursor: default;
  }
`;

// 바탕은 라운드마다 번갈아 깎은 잔디 줄무늬 — 한 줄 = 한 라운드
const StBoard = styled.div`
  position: relative;
  background: repeating-linear-gradient(90deg, #e9f8e4 0 ${COL_W}px, #dcf2d4 ${COL_W}px ${COL_W * 2}px);

  svg {
    position: absolute;
    inset: 0;
  }
`;

// 칸 테두리는 모서리가 한 칸씩 깎인 픽셀 상자 (그림자 4개로 테두리, 하나로 아래 그림자)
const StNode = styled.div<{ $dim: boolean; $edge: string }>`
  position: absolute;
  width: ${NODE_W}px;
  height: ${NODE_H}px;
  display: grid;
  grid-template-rows: auto 1fr 1fr;
  padding: 0 6px 3px;
  background: #ffffff;
  box-shadow:
    0 -3px 0 0 ${({ $edge }) => $edge},
    0 3px 0 0 ${({ $edge }) => $edge},
    -3px 0 0 0 ${({ $edge }) => $edge},
    3px 0 0 0 ${({ $edge }) => $edge},
    0 7px 0 0 #2f7a4f2e;
  opacity: ${({ $dim }) => ($dim ? 0.55 : 1)};
`;

const StHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-inline: -6px;
  padding: 2px 6px;
  font-family: ${PIX};
  font-size: 0.6rem;
  color: ${DIM};
  white-space: nowrap;
  overflow: hidden;
`;

const StRow = styled.div<{ $won: boolean; $lost: boolean; $empty: boolean }>`
  display: grid;
  grid-template-columns: 10px minmax(0, 1fr) 1.4rem;
  align-items: center;
  gap: 5px;
  font-size: 0.74rem;
  font-weight: ${({ $won }) => ($won ? 900 : 700)};
  color: ${({ $won, $lost, $empty }) => ($won ? GOLD : $lost || $empty ? "#9aa6a9" : INK)};
`;

// 팀 색 꼬마 티셔츠
const StShirt = styled.i`
  width: 10px;
  height: 9px;
  clip-path: polygon(30% 0, 70% 0, 100% 22%, 100% 48%, 80% 48%, 80% 100%, 20% 100%, 20% 48%, 0 48%, 0 22%);
`;

const StCrown = styled.span`
  font-size: 0.7rem;
`;

const StName = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StRoster = styled.div`
  padding-left: 15px;
  font-size: 0.6rem;
  font-weight: 500;
  color: ${DIM};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StPts = styled.span`
  font-family: ${PIX};
  text-align: right;
  font-variant-numeric: tabular-nums;
`;
