"use client";

import { useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";
import { DRESSER_WINNERS, fetchVoteSettings, fetchVoteTallies, type VoteTally } from "@/services/tennisVotes";
import { drawPlayer, px, type Sprite } from "./pixelSprites";
import { shirtOf } from "./PixelBracket";
import type { TournamentEvent } from "./types";

/**
 * 픽셀 베스트드레서 발표 — 토토 결과 다음 칸 (주인 요청 2026-10-28 "베스트드레서도 추가로").
 * "👗 베스트드레서 발표"를 누르면 한 번 공연하고 멈춘다.
 *  1) 득표 상위 후보가 한 명씩 런웨이를 걸어 내려와 포즈, 양옆 관객석 카메라 플래시
 *  2) 플래시가 한꺼번에 터진 뒤 수상자에게 조명 + 왕관 + 선글라스
 * 수상 규칙·공개 시점은 투표 탭과 같다 (최다 득표 DRESSER_WINNERS 명, 동점 함께 / 관리자가 마감해야 공개).
 * 누가 누구를 골랐는지는 여기서도 보여 주지 않는다 — 득표 수만. 체험 페이지는 명단으로 가짜 표.
 */

const W = 240;
const H = 120;
const PX_CSS = 2.4;
const MAX_FULL = 520;
const FRONT = 96; // 무대 앞줄 발 위치
const STEP_MS = 1500; // 후보 한 명이 걷고 포즈하는 시간
const MAX_NOMINEES = 5;

type Nominee = { name: string; votes: number; win: boolean; sprite: Sprite };

// 체험용 가짜 표: 실제처럼 1·2등이 갈리게 — 이름 순서를 섞어 9, 7, 5, 4, 3, 3, 2, 2, 1, 1표를 나눠 준다
// (처음엔 이름마다 0~8표를 막 줘서 5명이 8표 동점으로 다 수상해 버렸다 — 주인 지적 2026-10-28)
const DEMO_VOTES = [9, 7, 5, 4, 3, 3, 2, 2, 1, 1];
function demoTally(event: TournamentEvent): VoteTally {
  const hash = (name: string) => [...name].reduce((h, ch) => (h * 37 + ch.charCodeAt(0)) % 7919, 11);
  const counts = [...event.roster]
    .sort((a, b) => hash(a.name) - hash(b.name))
    .slice(0, DEMO_VOTES.length)
    .map((r, i) => ({ choice: r.name, votes: DEMO_VOTES[i] }));
  return { kind: "dresser", total: event.roster.length, counts, mine: [], names: {} };
}

const timeline = (n: number) => {
  const reveal = 400 + n * STEP_MS + 300;
  return { reveal, end: reveal + 3400 };
};
const slotX = (k: number, n: number) => Math.round(W / 2 - ((n - 1) * 22) / 2 + k * 22) - 4;

function draw(ctx: CanvasRenderingContext2D, t: number, full: number, list: Nominee[]) {
  const { reveal, end } = timeline(list.length);
  const frame = Math.floor(t / 240);
  // 무대: 어두운 보라 벽에 반짝이, 가운데 흰 런웨이
  px(ctx, 0, 0, full, H, "#2a1838");
  for (let k = 0; k < 40; k++) px(ctx, (k * 53) % full, (k * 29) % 60, 1, 1, k % 3 ? "#5a3f7a" : "#ffcf4a");
  px(ctx, 0, 16, full, 3, "#ff5c8a");
  const ox = Math.round((full - W) / 2);
  ctx.save();
  ctx.translate(ox, 0);
  px(ctx, 104, 19, 32, H - 19, "#f6f0ff");
  px(ctx, 103, 19, 1, H - 19, "#ff8fb1");
  px(ctx, 136, 19, 1, H - 19, "#ff8fb1");
  // 관객석 머리 + 카메라 플래시 (걷는 동안 깜빡, 발표 직전엔 한꺼번에)
  const burst = t >= reveal - 800 && t < reveal;
  for (let k = 0; k < 16; k++) {
    const side = k % 2 ? 1 : -1;
    const x = 120 + side * (30 + (k >> 1) * 11) - 3;
    const y = 104 + ((k >> 1) % 2) * 6;
    px(ctx, x, y, 6, 5, "#160c22");
    const flash = t < end && (burst ? (frame + k) % 2 === 0 : t < reveal && (frame * 7 + k * 5) % 11 === 0);
    if (flash) {
      px(ctx, x + 2, y - 4, 2, 2, "#ffffff");
      px(ctx, x + 1, y - 3, 4, 1, "#ffffffaa");
    }
  }
  // 수상자 조명
  if (t >= reveal) {
    ctx.fillStyle = "#fff6b333";
    list.forEach((nm, k) => {
      if (!nm.win) return;
      const cx = slotX(k, list.length) + 4;
      ctx.beginPath();
      ctx.moveTo(cx - 4, 0);
      ctx.lineTo(cx + 4, 0);
      ctx.lineTo(cx + 12, FRONT + 2);
      ctx.lineTo(cx - 12, FRONT + 2);
      ctx.closePath();
      ctx.fill();
    });
  }
  list.forEach((nm, k) => {
    const t0 = 400 + k * STEP_MS;
    if (t < t0) return;
    const local = t - t0;
    let x = 116;
    let y = FRONT - 12;
    let walking = true;
    let pose = false;
    if (local < 900) y = 22 + (FRONT - 12 - 22) * (local / 900); // 런웨이를 내려온다
    else if (local < 1200) pose = true; // 앞에서 만세 포즈
    else if (local < 1500) x = 116 + (slotX(k, list.length) - 116) * ((local - 1200) / 300); // 옆 자리로
    else {
      x = slotX(k, list.length);
      walking = false;
    }
    const won = nm.win && t >= reveal;
    const hop = won && t < end ? (frame + k) % 2 : 0;
    const cheer = pose || won || (t >= reveal && t < end && (frame + k) % 3 === 0);
    drawPlayer(ctx, x, y - hop, nm.sprite, walking ? Math.floor(t / 120) : frame, 1, cheer);
    if (won) {
      px(ctx, x + 2, y - hop + 3, 4, 1, "#111111"); // 선글라스
      px(ctx, x + 2, y - hop - 3, 4, 2, "#ffd34a"); // 왕관
      px(ctx, x + 2, y - hop - 4, 1, 1, "#ffd34a");
      px(ctx, x + 5, y - hop - 4, 1, 1, "#ffd34a");
      if (t < end && (frame + k) % 3 === 0) px(ctx, x + 9, y - hop - 2, 1, 1, "#ffffff");
    }
  });
  ctx.restore();
}

export default function PixelDresserResult({ event, demo = false }: { event: TournamentEvent; demo?: boolean }) {
  const [tally, setTally] = useState<VoteTally | null>(() => (demo ? demoTally(event) : null));
  const [open, setOpen] = useState<boolean | null>(() => (demo ? true : null));
  const [run, setRun] = useState(0);
  const [done, setDone] = useState(false);
  const [moving] = useState(
    () => typeof window === "undefined" || !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [full, setFull] = useState(W);
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (demo) return;
    Promise.all([fetchVoteTallies(event.id, ""), fetchVoteSettings(event.id)])
      .then(([all, settings]) => {
        setTally(all.dresser);
        setOpen(settings.closed.dresser);
      })
      .catch(() => setOpen(false));
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

  // 수상 기준 = DRESSER_WINNERS 번째 득표, 동점이면 함께 (DresserResult 와 같은 규칙)
  const counts = tally?.counts ?? [];
  const cut = counts[DRESSER_WINNERS - 1]?.votes ?? 0;
  const female = new Set(event.roster.filter((r) => r.gender === "F").map((r) => r.name));
  const teamOf = (name: string) => event.teams.find((tm) => tm.players.some((p) => p.name === name));
  const winners = cut > 0 ? counts.filter((c) => c.votes >= cut) : [];
  const list: Nominee[] = counts.slice(0, Math.max(winners.length, MAX_NOMINEES)).map((c) => {
    const team = teamOf(c.choice);
    return {
      name: c.choice,
      votes: c.votes,
      win: cut > 0 && c.votes >= cut,
      sprite: { shirt: team ? shirtOf(team) : "#ff8fb1", female: female.has(c.choice) },
    };
  });
  const sig = list.map((n) => `${n.name}:${n.votes}`).join("|");

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx || run === 0) return;
    const { end } = timeline(list.length);
    if (!moving) {
      draw(ctx, end, full, list);
      return;
    }
    let raf = 0;
    let begin: number | null = null;
    const loop = (now: number) => {
      begin ??= now;
      const t = now - begin;
      draw(ctx, Math.min(t, end), full, list);
      if (t >= timeline(list.length).reveal + 600) setDone(true);
      if (t < end) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // list 는 매 렌더 새로 만들어지므로 sig 로 대신한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, full, sig, moving]);

  const start = () => {
    setDone(!moving);
    setRun((n) => n + 1);
  };

  if (open === null) return <StNote>베스트드레서 결과를 불러오는 중…</StNote>;
  if (!open) return <StNote>관리자가 베스트드레서 투표를 마감하면 여기서 발표해요.</StNote>;
  if (list.length === 0) return <StNote>베스트드레서 표가 하나도 없어요.</StNote>;

  if (run === 0) {
    return (
      <StIntro>
        <p>
          후보 {list.length}명이 런웨이에 섰어요. 오늘의 베스트드레서는?{demo ? " (체험용 가짜 표)" : ""}
        </p>
        <StBtn type="button" onClick={start}>
          👗 베스트드레서 발표
        </StBtn>
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
        aria-label={`베스트드레서 발표: 후보들이 런웨이를 걷고 ${winners.map((w) => w.choice).join(", ")}에게 왕관이 씌워져요`}
      />
      {done ? (
        <>
          <StWinners>
            {list
              .filter((n) => n.win)
              .map((n, i) => (
                <StWinner key={n.name} style={{ animationDelay: `${i * 140}ms` }}>
                  <span>👑 베스트드레서</span>
                  <b>{n.name}</b>
                  <em>{n.votes}표</em>
                </StWinner>
              ))}
          </StWinners>
          <StOthers>
            후보{" "}
            {list
              .filter((n) => !n.win)
              .map((n) => `${n.name} ${n.votes}표`)
              .join(" · ")}
          </StOthers>
          <StBtn type="button" $small onClick={start}>
            🎬 다시 보기
          </StBtn>
        </>
      ) : null}
    </StWrap>
  );
}

const pop = keyframes`
  from { opacity: 0; transform: translateY(8px) scale(0.8); }
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
  color: #fbeaff;
  background: #2a1838;
  box-shadow: 4px 4px 0 #2f7a4f22;
`;

const StBtn = styled.button<{ $small?: boolean }>`
  justify-self: center;
  padding: ${({ $small }) => ($small ? "0.45rem 0.8rem" : "0.7rem 1.3rem")};
  border: 0;
  font-size: ${({ $small }) => ($small ? "0.82rem" : "1rem")};
  font-weight: 800;
  color: #24343b;
  background: #ff8fb1;
  box-shadow: 3px 3px 0 #24343b;
  cursor: pointer;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 #24343b;
  }
`;

const StWinners = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem;
`;

const StWinner = styled.div`
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  min-width: 8.5rem;
  padding: 0.6rem 1rem;
  background: #fff3c4;
  animation: ${pop} 0.4s ease-out both;

  span {
    font-size: 0.72rem;
    font-weight: 700;
    color: #e8761c;
  }

  b {
    font-size: 1.05rem;
    font-weight: 900;
  }

  em {
    font-style: normal;
    font-size: 0.78rem;
    color: #6b7c80;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const StOthers = styled.p`
  font-size: 0.82rem;
  text-align: center;
  color: #6b7c80;
`;

const StNote = styled.p`
  font-size: 0.86rem;
  text-align: center;
  color: #6b7c80;
`;
