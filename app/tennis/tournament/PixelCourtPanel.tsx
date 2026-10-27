"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styled from "styled-components";
import type { ResolvedMatch, ScheduleBlock, TeamEntry, TournamentEvent } from "./types";
import { isFinished, type Court, type ScoreMap } from "../types";
import { courtLetters } from "../timeline";
import PixelBracket, { shirtOf } from "./PixelBracket";

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


const SKIN = "#f2c7a0";
const HAIR_M = "#3a2a22";
const HAIR_F = "#5a3524";
const SHORTS = "#2b3340";
const W = 160;
const H = 88;

type Sprite = { shirt: string; female: boolean };
type CourtView =
  | { kind: "playing"; match: ResolvedMatch; startedAt: string }
  | { kind: "ready"; match: ResolvedMatch }
  | { kind: "done"; match: ResolvedMatch }
  | { kind: "empty" };

function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// 8×12 선수. 여성은 머리가 어깨까지 내려온다
function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: Sprite,
  frame: number,
  facing: 1 | -1,
  cheer: boolean,
) {
  const bob = frame % 2;
  const hair = s.female ? HAIR_F : HAIR_M;
  px(ctx, x + 1, y + 11, 6, 1, "#0004");
  px(ctx, x + 2, y, 4, 2, hair);
  px(ctx, x + 2, y + 2, 4, 2, SKIN);
  if (s.female) {
    px(ctx, x + 1, y + 1, 1, 4, hair);
    px(ctx, x + 6, y + 1, 1, 4, hair);
  }
  px(ctx, facing > 0 ? x + 5 : x + 2, y + 2, 1, 1, "#222");
  px(ctx, x + 1, y + 4, 6, 4, s.shirt);
  px(ctx, x + 2, y + 8, 4, 1, SHORTS);
  px(ctx, x + 2, y + 9, 1, 2 - bob, SKIN);
  px(ctx, x + 5, y + 9, 1, 1 + bob, SKIN);
  if (cheer) {
    px(ctx, x, y + 1 - bob, 1, 3, SKIN);
    px(ctx, x + 7, y + 1 - bob, 1, 3, SKIN);
  } else {
    px(ctx, facing > 0 ? x + 7 : x - 2, y + 5, 2, 3, "#1b1b1b");
    px(ctx, facing > 0 ? x + 7 : x, y + 7, 1, 2, "#7a5a3a");
  }
}

function drawCourt(ctx: CanvasRenderingContext2D) {
  px(ctx, 0, 0, W, H, "#3c8a62");
  for (let i = 0; i < W; i += 8) px(ctx, i, 0, 4, H, "#3f9066");
  const cx = 16, cy = 12, cw = W - 32, ch = H - 24;
  const L = "#f3ead6";
  px(ctx, cx, cy, cw, ch, "#3f74c2");
  px(ctx, cx, cy, cw, 1, L);
  px(ctx, cx, cy + ch - 1, cw, 1, L);
  px(ctx, cx, cy, 1, ch, L);
  px(ctx, cx + cw - 1, cy, 1, ch, L);
  px(ctx, cx, cy + 6, cw, 1, L);
  px(ctx, cx, cy + ch - 7, cw, 1, L);
  const sx = Math.round(cw * 0.23);
  px(ctx, cx + sx, cy + 6, 1, ch - 12, L);
  px(ctx, cx + cw - sx - 1, cy + 6, 1, ch - 12, L);
  px(ctx, cx + sx, cy + ch / 2, cw - sx * 2, 1, L);
  px(ctx, W / 2 - 1, cy - 4, 2, ch + 8, "#e9e4d8");
  px(ctx, W / 2 - 1, cy - 5, 2, 2, "#1b1b1b");
  px(ctx, W / 2 - 1, cy + ch + 3, 2, 2, "#1b1b1b");
}

function paint(
  ctx: CanvasRenderingContext2D,
  view: CourtView,
  sprites: { a: Sprite[]; b: Sprite[] },
  t: number,
  moving: boolean,
) {
  drawCourt(ctx);
  if (view.kind === "empty") return;
  const frame = moving ? Math.floor(t / 260) : 0;
  const playing = view.kind === "playing";
  const sway = (k: number) => (moving && playing ? Math.round(Math.sin(t / 700 + k) * 4) : 0);

  if (view.kind === "ready") {
    // 코트 밖 아래쪽 라인에 나란히 서서 기다린다
    sprites.a.forEach((s, i) => drawPlayer(ctx, 22 + i * 10, H - 14, s, 0, 1, false));
    sprites.b.forEach((s, i) => drawPlayer(ctx, W - 30 - i * 10, H - 14, s, 0, -1, false));
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
    drawPlayer(ctx, x, y - (cheer && frame % 2 ? 2 : 0), s, frame, facing, cheer);
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
    const animate = moving && (view.kind === "playing" || view.kind === "done");
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
  const [openCourt, setOpenCourt] = useState<Court | null>(null);

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
          점수 화면과 같은 기록을 보여 줘요. 코트를 누르면 그 경기를 시작하거나 점수를 넣을 수 있어요.
        </StSceneHint>
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

        <StCourts>
          {views.map(([court, view], idx) => {
            const m = view.kind === "empty" ? null : view.match;
            const sprites = {
              a: m?.teamA ? (spritesByTeam.get(m.teamA.seed) ?? []).slice(0, 2) : [],
              b: m?.teamB ? (spritesByTeam.get(m.teamB.seed) ?? []).slice(0, 2) : [],
            };
            const sc = m ? scores[m.template.no] : undefined;
            const done = view.kind === "done";
            const aLost = done && m?.winner?.seed !== m?.teamA?.seed;
            const open = openCourt === court && !!m;
            return (
              <StCourt
                key={court}
                type="button"
                style={{ order: idx * 2 }}
                disabled={!m || !renderMatch}
                aria-pressed={open}
                aria-label={`${court}코트 ${m ? m.template.label : "비어 있음"} — 눌러서 시작·점수 입력`}
                onClick={() => setOpenCourt(open ? null : court)}
              >
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
              </StCourt>
            );
          })}
          {(() => {
            const idx = views.findIndex(([c]) => c === openCourt);
            const view = idx >= 0 ? views[idx][1] : null;
            if (!renderMatch || !view || view.kind === "empty") return null;
            return (
              <StEntry
                $desk={(idx | 1) * 2 + 1}
                $mobile={idx * 2 + 1}
              >
                <StEntryHead>
                  <span>
                    {openCourt}코트 · {view.match.template.label}
                  </span>
                  <StEntryClose type="button" onClick={() => setOpenCourt(null)}>
                    닫기
                  </StEntryClose>
                </StEntryHead>
                {renderMatch(view.match)}
              </StEntry>
            );
          })()}
        </StCourts>

        <StLower>
          <StPanel>
            <StPanelTitle>벤치</StPanelTitle>
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
          <PixelBracket matches={matches} />
        </StPanel>
    </StScene>
  );
}

// ───── 스타일: 코트 그림 영역은 테마와 상관없이 늘 밤의 실내 테니스장 색 ─────
const PIX = "ui-monospace, Menlo, Consolas, monospace";
const INK = "#f3ead6";
const DIM = "#a9b8b9";
const LED = "#ffcf4a";
const FLOOR = "#34505c";

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
    background-color: #22313a;
    background-image:
      linear-gradient(#2b3d48 2px, transparent 2px),
      linear-gradient(90deg, #2b3d48 2px, transparent 2px);
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

const StSceneHint = styled.p`
  font-size: 0.82rem;
  line-height: 1.5;
  color: ${DIM};
`;

const StBoard = styled.div`
  display: grid;
  gap: 0.7rem;
  padding: 0.8rem 0.9rem;
  background: #121b20;
  box-shadow: 0 0 0 3px ${FLOOR};
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
  color: ${LED};
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
  color: ${LED};
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
  background: ${({ $state }) => ($state === "now" ? LED : "#1b262c")};
  color: ${({ $state }) => ($state === "now" ? "#121b20" : $state === "done" ? "#7ad3a0" : DIM)};

  b {
    display: block;
    font-size: 0.78rem;
  }
`;

const StCourts = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.8rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StCourt = styled.button`
  display: grid;
  gap: 0.5rem;
  width: 100%;
  padding: 0.6rem;
  border: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  background: ${FLOOR};
  cursor: pointer;

  &:disabled {
    cursor: default;
  }

  &[aria-pressed="true"],
  &:focus-visible {
    outline: 3px solid ${LED};
    outline-offset: 2px;
  }
`;

// 입력 칸: 두 열이면 누른 코트가 있는 줄 바로 아래, 한 열(휴대폰)이면 누른 코트 바로 아래
const StEntry = styled.div<{ $desk: number; $mobile: number }>`
  order: ${({ $desk }) => $desk};
  grid-column: 1 / -1;
  display: grid;
  gap: 0.6rem;
  padding: 0.8rem;
  border-radius: 0.6rem;
  color: ${({ theme }) => theme.semantic.text};
  background: ${({ theme }) => theme.semantic.bg};

  @media ${({ theme }) => theme.media.mobile} {
    order: ${({ $mobile }) => $mobile};
  }
`;

const StEntryHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.9rem;
  font-weight: 800;
`;

const StEntryClose = styled.button`
  padding: 0.3rem 0.7rem;
  border: 0;
  border-radius: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  background: transparent;
  cursor: pointer;
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
  color: ${LED};
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
  background: ${({ $tone }) => ($tone === "live" ? "#ff6b57" : $tone === "done" ? "#7ad3a0" : DIM)};
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
  color: ${LED};
  font-variant-numeric: tabular-nums;
`;

const StGame = styled.span<{ $dim: boolean }>`
  color: ${({ $dim }) => ($dim ? "#6b6440" : LED)};
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
  background: #2a4049;
  opacity: ${({ $on }) => ($on ? 0.45 : 1)};
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
    color: ${LED};
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
  background: ${INK};
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid ${LED};
    outline-offset: 2px;
  }
`;
