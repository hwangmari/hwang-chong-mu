"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styled, { createGlobalStyle } from "styled-components";
import type { ResolvedMatch, ScheduleBlock, TeamEntry, TournamentEvent } from "./types";
import { isFinished, type Court, type ScoreMap } from "../types";
import { courtLetters } from "../timeline";
import PixelBracket, { shirtOf } from "./PixelBracket";
import CheerSquad from "./CheerSquad";
import PixelPodium from "./PixelPodium";
import PixelTotoResult from "./PixelTotoResult";
import PixelDresserResult from "./PixelDresserResult";
import { placements } from "./resolve";
import { BLUSH, COURT_H, COURT_W, drawCourt, drawHeart, drawPlayer, px, type Sprite } from "./pixelSprites";
import { getSavedVoter } from "../voterKey";
import { usePixelToto } from "./usePixelToto";
import PixelVoterGate from "./PixelVoterGate";

type Props = {
  event: TournamentEvent;
  matches: ResolvedMatch[];
  scores: ScoreMap;
  blocks: ScheduleBlock[];
  /** 코트를 누르면 그 경기 아래에 여는 시작·점수 입력 칸. 점수 화면과 같은 카드를 위에서 넘겨준다 */
  renderMatch?: (match: ResolvedMatch) => ReactNode;
  /** 체험 페이지: 토토 결과를 저장 공간 대신 가짜 표로 */
  demo?: boolean;
  /** 토토가 마감됐는지 (진행 요원 마감 또는 대회 끝) — 전광판 토토 걸기를 막는다 */
  totoLocked?: boolean;
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


const W = COURT_W;
const H = COURT_H;

type CourtView =
  | { kind: "playing"; match: ResolvedMatch; startedAt: string }
  | { kind: "ready"; match: ResolvedMatch }
  | { kind: "done"; match: ResolvedMatch }
  | { kind: "empty" };

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


export default function PixelCourtPanel({
  event,
  matches,
  scores,
  blocks,
  renderMatch,
  demo = false,
  totoLocked = false,
}: Props) {
  // 움직임을 줄여 달라고 설정한 기기에서는 처음부터 멈춘 그림 (멈춤 버튼은 응원석 자리로 바뀌며 뺐다 — 2026-10-28).
  // 탭을 눌러야 그려지는 화면이라 서버 렌더와 어긋날 일이 없다
  const [moving] = useState(
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
  const [viewBlock, setViewBlock] = useState<number | null>(null);
  // 전광판 벤치를 눌러 우승팀 토토 걸기 (주인 요청 2026-10-28 "여기서 투표 모드로")
  const [totoMode, setTotoMode] = useState(false);
  const toto = usePixelToto(event, totoMode, demo);
  const canPick = toto.canVote && !totoLocked && !toto.busy;

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

  const ranks = useMemo(() => placements(matches), [matches]);

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
  // 라운드 칸을 누르면 그 라운드 경기들을 코트별로 다시 본다 — 끝난 경기는 점수 고치기까지 (주인 요청 2026-10-28)
  const roundCards: [Court, CourtView][] | null =
    viewBlock === null
      ? null
      : visible
          .filter((m) => m.template.block === viewBlock)
          .map((m): [Court, CourtView] => {
            const sc = scores[m.template.no];
            if (m.status === "playing" && sc?.startedAt) return [courtOf(m), { kind: "playing", match: m, startedAt: sc.startedAt }];
            if (m.status === "done") return [courtOf(m), { kind: "done", match: m }];
            return [courtOf(m), { kind: "ready", match: m }];
          })
          .sort((a, b) => a[0].localeCompare(b[0]));
  const mineOnly = roundCards === null && scope === "mine" && !!myView;
  const cards: [Court, CourtView][] =
    roundCards ?? (mineOnly && myMatch && myView ? [[courtOf(myMatch), myView]] : views);
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


  return (
    <StScene>
      <StDayPage />
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
            {/* 시계·움직임 버튼 자리에 응원석 꼬마들 (주인 요청 2026-10-28) */}
            <CheerSquad />
          </StBoardTop>
          <StBlocks $count={blocks.length}>
            {blocks.map((b) => (
              <StBlock
                key={b.no}
                type="button"
                $state={b.no === nowBlock && !blockDone(b.no) ? "now" : blockDone(b.no) ? "done" : "next"}
                aria-pressed={viewBlock === b.no}
                aria-label={`${b.no}라운드 ${b.title} 경기 보기`}
                title={b.title}
                onClick={() => setViewBlock((v) => (v === b.no ? null : b.no))}
              >
                <b>{b.no}</b>
                {b.time.split(" — ")[0]}
              </StBlock>
            ))}
          </StBlocks>
          {/* 팀 벤치를 전광판에 합쳤다 (주인 요청 2026-10-28). 응원석 꼬마들은 탭 위로 옮김(CheerSquad) */}
          <StTotoBar>
            <StTotoToggle type="button" aria-pressed={totoMode} $on={totoMode} onClick={() => setTotoMode((v) => !v)}>
              🎟️ {totoMode ? "토토 걸기 끝" : "우승팀 토토 걸기"}
            </StTotoToggle>
            {totoMode ? (
              <StTotoHint>
                {totoLocked
                  ? "토토가 마감됐어요. 표 수만 볼 수 있어요."
                  : !toto.canVote
                    ? "내 이름과 비번으로 들어오면 바로 걸 수 있어요."
                    : toto.mine
                      ? `${demo ? "체험 중 · " : `${toto.myName}님 · `}${toto.mine}팀에 걸었어요. 다른 벤치를 누르면 바뀌어요.`
                      : "우승할 것 같은 팀 벤치를 눌러 주세요!"}
                {toto.error ? ` ${toto.error}` : ""}
              </StTotoHint>
            ) : null}
            {/* 투표 탭과 같은 이름·비번 확인 (주인 요청 2026-10-28). 체험·마감 뒤에는 필요 없다 */}
            {totoMode && !demo && !totoLocked ? (
              <PixelVoterGate event={event} myName={toto.myName} onChange={toto.setVoter} />
            ) : null}
          </StTotoBar>
          <StBench>
            {event.teams.map((team) => {
              const next = onCourt.has(team.seed) ? null : nextFor(team);
              if (totoMode) {
                const mine = toto.mine === String(team.seed);
                return (
                  <StSeatBtn
                    key={team.seed}
                    type="button"
                    $mine={mine}
                    disabled={!canPick}
                    aria-pressed={mine}
                    aria-label={`${team.name}에 토토 걸기 · ${toto.votesOf(team.seed)}표`}
                    onClick={() => void toto.pick(team.seed)}
                  >
                    <BenchSeat team={team} sprites={spritesByTeam.get(team.seed) ?? []} />
                    <StSeatName>{team.name}</StSeatName>
                    <StSeatState>
                      {mine ? "🎟️ 내 픽 · " : ""}
                      {toto.votesOf(team.seed)}표 · {toto.oddsOf(team.seed)}
                    </StSeatState>
                  </StSeatBtn>
                );
              }
              return (
                <StSeat key={team.seed} $on={onCourt.has(team.seed)}>
                  <BenchSeat team={team} sprites={spritesByTeam.get(team.seed) ?? []} />
                  <StSeatName>{team.name}</StSeatName>
                  <StSeatState>
                    {onCourt.has(team.seed)
                      ? "경기 중"
                      : next
                        ? `다음 ${next.template.court}코트`
                        : "쉬는 중"}
                  </StSeatState>
                </StSeat>
              );
            })}
          </StBench>
        </StBoard>

        {viewBlock !== null ? (
          <StRoundBar>
            <span>
              📋 <b>{viewBlock}라운드</b> 경기 보는 중 · {blocks.find((b) => b.no === viewBlock)?.time}
              {roundCards && roundCards.length === 0 ? " · 아직 정해진 경기가 없어요" : ""}
            </span>
            <StRoundBack type="button" onClick={() => setViewBlock(null)}>
              지금 화면으로
            </StRoundBack>
          </StRoundBar>
        ) : null}
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


        <StPanel>
          <StPanelTitle>🏆 대진표</StPanelTitle>
          <PixelBracket matches={matches} blocks={blocks} sprites={spritesByTeam} moving={moving} />
        </StPanel>

        {/* 그랜드 파이널까지 끝나면 맨 아래에 시상식 (주인 요청 2026-10-28) */}
        {ranks[0].team ? (
          <StPanel>
            <StPanelTitle>🏅 시상식</StPanelTitle>
            <PixelPodium ranks={ranks} sprites={spritesByTeam} />
          </StPanel>
        ) : null}

        {/* 시상식 다음은 토토 결과 (주인 요청 2026-10-28) */}
        {ranks[0].team ? (
          <StPanel>
            <StPanelTitle>🎟️ 토토 결과</StPanelTitle>
            <PixelTotoResult event={event} winner={ranks[0].team} sprites={spritesByTeam} demo={demo} />
          </StPanel>
        ) : null}

        {/* 토토 다음은 베스트드레서 발표 (주인 요청 2026-10-28) */}
        {ranks[0].team ? (
          <StPanel>
            <StPanelTitle>👗 베스트드레서</StPanelTitle>
            <PixelDresserResult event={event} demo={demo} />
          </StPanel>
        ) : null}
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
// 낮의 테니스 클럽 바탕을 페이지 전체(body)에 깐다 — 제목·탭이 있는 윗부분까지 덮는다
// (주인 요청 2026-10-27 "배경도 낮으로", 2026-10-28 "픽셀 코트는 header 덮게").
// 이 탭이 열린 동안만 붙고, 다른 탭으로 가면 원래 바탕으로 돌아간다.
const StDayPage = createGlobalStyle`
  body {
    background-color: #e6f7ea;
    background-image:
      linear-gradient(#d2efdb 2px, transparent 2px),
      linear-gradient(90deg, #d2efdb 2px, transparent 2px),
      linear-gradient(#c9ecff, #e6f7ea 520px);
    background-size: 32px 32px, 32px 32px, 100% 100%;
    background-position: center top;
  }
`;

const StScene = styled.section`
  position: relative;
  display: grid;
  gap: 0.9rem;
  padding-block: 1rem 1.4rem;
  color: ${INK};
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


const StBlocks = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(0, 1fr));
  gap: 4px;
`;

const StBlock = styled.button<{ $state: "done" | "now" | "next" }>`
  padding: 0.35rem 0.1rem;
  border: 0;
  cursor: pointer;
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

  &[aria-pressed="true"] {
    box-shadow: inset 0 0 0 2px ${ACCENT};
  }

  &:focus-visible {
    outline: 2px solid ${ACCENT};
    outline-offset: 1px;
  }
`;

const StRoundBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.8rem;
  font-size: 0.84rem;
  color: ${INK};
  background: ${FLOOR};
  box-shadow: ${CARD_SHADOW}, inset 4px 0 0 ${ACCENT};

  b {
    font-weight: 900;
  }
`;

const StRoundBack = styled.button`
  padding: 0.3rem 0.7rem;
  border: 0;
  font-size: 0.78rem;
  font-weight: 800;
  color: #24343b;
  background: ${LED};
  box-shadow: 2px 2px 0 #24343b;
  cursor: pointer;
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


// 대진표 묶음: 흰 판·테두리·안쪽 여백 없이 잔디 대진표가 바로 바탕 위에 놓인다 (주인 요청 2026-10-28 "흰 박스 여백")
const StPanel = styled.div`
  display: grid;
  align-content: start;
  gap: 0.6rem;
  min-width: 0;
`;

const StPanelTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 800;
`;

// 전광판 안 벤치: 넓으면 8팀 한 줄, 휴대폰은 4팀씩 두 줄
const StBench = styled.div`
  display: grid;
  grid-template-columns: repeat(8, minmax(0, 1fr));
  gap: 0.35rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
`;



const StSeat = styled.div<{ $on: boolean }>`
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  padding: 0.35rem 0.2rem;
  background: #eef8f1;
  opacity: ${({ $on }) => ($on ? 0.45 : 1)};
`;


// 토토 걸기 줄: 켜고 끄는 단추 + 지금 상태 한 줄
const StTotoBar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.7rem;
`;

const StTotoToggle = styled.button<{ $on: boolean }>`
  padding: 0.35rem 0.75rem;
  border: 0;
  font-size: 0.8rem;
  font-weight: 800;
  color: ${INK};
  background: ${({ $on }) => ($on ? "#ffffff" : "#ffcf4a")};
  box-shadow: 3px 3px 0 ${INK};
  cursor: pointer;

  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 ${INK};
  }
`;

const StTotoHint = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${DIM};
`;

// 토토 걸기 중 벤치: 누를 수 있는 칸, 내가 건 팀은 노란 바탕
const StSeatBtn = styled.button<{ $mine: boolean }>`
  display: grid;
  justify-items: center;
  gap: 0.15rem;
  padding: 0.35rem 0.2rem;
  border: 0;
  font: inherit;
  color: inherit;
  background: ${({ $mine }) => ($mine ? "#ffcf4a" : "#eef8f1")};
  box-shadow: ${({ $mine }) => ($mine ? `3px 3px 0 ${INK}` : "none")};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ $mine }) => ($mine ? "#ffcf4a" : "#fff3c4")};
  }

  &:disabled {
    cursor: default;
  }
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



