"use client";

import { useState, type ReactNode } from "react";
import MatchCard from "./MatchCard";
import NextUpBar from "./NextUpBar";
import { toClock } from "../format";
import type { MatchTiming } from "../timeline";
import { courtLetters, describeWait, elapsedOf, type Timeline } from "../timeline";
import { jumpToMatch } from "../jump";
import {
  StActions,
  StBall,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StCourtBoard,
  StCourtCard,
  StCourtHead,
  StCourtSlot,
  StCourtSlotLabel,
  StCourtSlotMain,
  StCourtTitle,
  StElapsedFill,
  StElapsedTrack,
  StGhostBtn,
  StMatchGrid,
  StLiveBadge,
  StLiveDot,
  StPrimaryBtn,
  StQueueList,
  StStateBadge,
  StRoundHead,
  StRoundTitle,
  StRoundTime,
} from "../page.styles";
import styled from "styled-components";
import type { Court, Match, Player, ScoreMap, TennisEvent } from "../types";

type Props = {
  event: TennisEvent;
  players: Map<string, Player>;
  scores: ScoreMap;
  timeline: Timeline;
  busy: boolean;
  canReorder: boolean; // 화면에서 만든 교류전만 순서 저장 가능
  onStart: (matchNo: number, court: Court) => Promise<void>;
  onSave: (matchNo: number, scoreA: number, scoreB: number) => Promise<void>;
  onClear: (matchNo: number) => Promise<void>;
  onReorder: (matches: Match[]) => Promise<void>;
  onRemove: (match: Match) => Promise<void>; // 당일 편성 경기 빼기 (점수 기록도 함께 지움)
};

export default function MatchQueue({
  event,
  players,
  scores,
  timeline,
  busy,
  canReorder,
  onStart,
  onSave,
  onClear,
  onReorder,
  onRemove,
}: Props) {
  const courts = courtLetters(event.courts);
  const [reordering, setReordering] = useState(false);
  const [draft, setDraft] = useState<Match[]>([]);

  const list = reordering ? draft : event.matches;
  const teamText = (m: Match) => `${m.teamA.join("·")} vs ${m.teamB.join("·")}`;

  // 순서 바꾸기: 아직 시작하지 않은 경기끼리만
  function movable(m: Match) {
    const t = timeline.byMatch.get(m.no);
    return t ? t.status === "ready" || t.status === "waiting" : true;
  }
  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= draft.length) return;
    if (!movable(draft[index]) || !movable(draft[target])) return;
    const next = [...draft];
    [next[index], next[target]] = [next[target], next[index]];
    setDraft(next);
  }

  async function saveOrder() {
    await onReorder(draft);
    setReordering(false);
  }

  // ── 당일 편성: 빈 코트 칸에 선수를 넣어 경기를 만든다 ──
  type SlotKey = string; // `${round}-${court}`
  const [fillSlot, setFillSlot] = useState<SlotKey | null>(null);
  const [editingNo, setEditingNo] = useState<number | null>(null);
  const [pick, setPick] = useState<{ a: string[]; b: string[] }>({ a: [], b: [] });

  const roster = [...players.values()];
  const teams = [...new Set(roster.map((pl) => pl.team).filter(Boolean))] as string[];
  const sideA = teams[0] ?? "";
  const sideB = teams[1] ?? "";

  // 확정 경기 수(적은 사람 우선 추천) · 이미 짝이 된 조합(반복 피하기)
  const gameCount = new Map<string, number>();
  const playedCount = new Map<string, number>(); // 점수까지 저장된(끝난) 경기 수
  const pairSeen = new Set<string>();
  for (const m of event.matches) {
    const done = Boolean(scores[m.no]?.finishedAt);
    for (const n of [...m.teamA, ...m.teamB]) {
      gameCount.set(n, (gameCount.get(n) ?? 0) + 1);
      if (done) playedCount.set(n, (playedCount.get(n) ?? 0) + 1);
    }
    pairSeen.add([...m.teamA].sort().join("|"));
    pairSeen.add([...m.teamB].sort().join("|"));
  }
  // 같은 라운드에 이미 들어간 선수는 다른 코트에 넣을 수 없다
  // 같은 라운드에 이미 들어간 선수 (선수를 바꾸는 중인 경기 자신은 뺀다)
  const busyInRound = (round: number, exceptNo: number | null = null) =>
    new Set(
      event.matches.filter((m) => m.round === round && m.no !== exceptNo).flatMap((m) => [...m.teamA, ...m.teamB]),
    );

  // 종목은 양쪽 짝의 구성으로 정한다: 남남 vs 남남 = 남자 복식, 여여 vs 여여 = 여자 복식,
  // 남녀 vs 남녀 = 혼합 복식, 그 밖(남남 vs 여여 등) = 잡복 (리뷰 2026-09-15)
  function typeOf(a: string[], b: string[]): Match["type"] {
    const kindOf = (names: string[]) => {
      const g = names.map((n) => players.get(n)?.gender);
      if (g.every((x) => x === "M")) return "M";
      if (g.every((x) => x === "F")) return "F";
      return "X";
    };
    const ka = kindOf(a);
    const kb = kindOf(b);
    if (ka === "M" && kb === "M") return "men";
    if (ka === "F" && kb === "F") return "women";
    if (ka === "X" && kb === "X") return "mixed";
    return "open";
  }

  // 추천: 출전 적은 순 → 같은 팀 안에서 짝 반복 없이 → 양쪽 성별 구성이 같도록(남남/여여/혼합)
  function recommend(round: number, exceptNo: number | null = null) {
    const taken = busyInRound(round, exceptNo);
    // 소속이 없는 대회면 전체 명단에서 고르되, A쪽에 뽑힌 사람은 B쪽 후보에서 뺀다
    const free = (team: string, exclude: Set<string> = new Set()) =>
      roster
        .filter((pl) => (team ? pl.team === team : true) && !taken.has(pl.name) && !exclude.has(pl.name))
        .sort((x, y) => (gameCount.get(x.name) ?? 0) - (gameCount.get(y.name) ?? 0) || x.name.localeCompare(y.name));
    const pairFrom = (list: Player[], want: "M" | "F" | "mixed" | null) => {
      for (let x = 0; x < list.length; x += 1) {
        for (let y = x + 1; y < list.length; y += 1) {
          const a = list[x];
          const b = list[y];
          const kind = a.gender === b.gender ? a.gender : "mixed";
          if (want && kind !== want) continue;
          if (pairSeen.has([a.name, b.name].sort().join("|"))) continue;
          return [a, b] as const;
        }
      }
      return null;
    };
    const fa = free(sideA);
    // A팀에서 출전 적은 두 명을 먼저 정하고, 그 구성(남남/여여/혼합)에 맞춰 B팀 짝을 찾는다
    const pa = pairFrom(fa, null);
    if (!pa) return null;
    const fb = free(sideB, new Set([pa[0].name, pa[1].name]));
    const kind = pa[0].gender === pa[1].gender ? pa[0].gender : "mixed";
    const pb = pairFrom(fb, kind) ?? pairFrom(fb, null);
    if (!pb) return null;
    return { a: [pa[0].name, pa[1].name], b: [pb[0].name, pb[1].name] };
  }

  function openSlot(round: number, court: Court) {
    setEditingNo(null);
    setFillSlot(`${round}-${court}`);
    setPick(recommend(round) ?? { a: [], b: [] });
  }

  // 이미 넣은(아직 시작 안 한) 당일 편성 경기의 선수를 다시 고른다
  function openEdit(match: Match) {
    setEditingNo(match.no);
    setFillSlot(`${match.round ?? 0}-${match.court ?? "?"}`);
    setPick({ a: [...match.teamA], b: [...match.teamB] });
  }

  function closePicker() {
    setFillSlot(null);
    setEditingNo(null);
    setPick({ a: [], b: [] });
  }

  async function removeMatch(match: Match) {
    await onRemove(match); // 확인창·기록 삭제·대진 저장은 ExchangeView가 한다
    closePicker();
  }

  function toggle(side: "a" | "b", name: string) {
    setPick((prev) => {
      const cur = prev[side];
      // 이미 2명이면 먼저 고른 사람을 빼고 새 사람을 넣는다 (칩이 잠기지 않게, 2026-09-15)
      const next = cur.includes(name) ? cur.filter((n) => n !== name) : cur.length < 2 ? [...cur, name] : [cur[1], name];
      return { ...prev, [side]: next };
    });
  }

  async function saveSlot(round: number, court: Court, editing: Match | null = null) {
    if (pick.a.length !== 2 || pick.b.length !== 2) return;
    if (editing) {
      const changed: Match = { ...editing, type: typeOf(pick.a, pick.b), teamA: [pick.a[0], pick.a[1]], teamB: [pick.b[0], pick.b[1]] };
      await onReorder(event.matches.map((m) => (m.no === editing.no ? changed : m)));
      closePicker();
      return;
    }
    const nextNo = Math.max(0, ...event.matches.map((m) => m.no)) + 1;
    const match: Match = {
      no: nextNo,
      type: typeOf(pick.a, pick.b),
      teamA: [pick.a[0], pick.a[1]],
      teamB: [pick.b[0], pick.b[1]],
      round,
      court,
    };
    await onReorder([...event.matches, match]);
    closePicker();
  }

  // 다음 순서: 아직 시작 안 한 경기 중 앞에서 3개 (코트는 그때 비는 곳으로 가므로 코트별로 나누지 않는다)
  const upcoming = event.matches.filter((m) => {
    const t = timeline.byMatch.get(m.no);
    return t && (t.status === "ready" || t.status === "waiting");
  });
  // 지금 시작 가능한 경기(뒤 라운드여도)를 앞에 두고, 나머지는 대진 순서대로
  const nextThree = [...upcoming]
    .sort((x, y) => Number(timeline.byMatch.get(y.no)?.status === "ready") - Number(timeline.byMatch.get(x.no)?.status === "ready"))
    .slice(0, 3);
  const anyReady = upcoming.some((m) => timeline.byMatch.get(m.no)?.status === "ready");
  const nextReady = nextThree.find((m) => timeline.byMatch.get(m.no)?.status === "ready") ?? null;
  // 대기 이유 문구는 카드와 같은 함수(timeline.describeWait)로
  const waitReason = (m: Match, t: MatchTiming) => describeWait(timeline, t, [...m.teamA, ...m.teamB], courts.length);
  const allDone = timeline.courts.every((c) => !c.playing) && upcoming.length === 0;

  // 저장된 라운드 순서(no 오름차순)대로 경기를 묶는다. 라운드 번호가 없는 경기는 맨 뒤에.
  const roundGroups = [...event.rounds]
    .sort((a, b) => a.no - b.no)
    .map((round) => ({ round, matches: list.filter((m) => m.round === round.no) }));
  const unrounded = list.filter((m) => m.round == null || !event.rounds.some((r) => r.no === m.round));

  return (
    <>
      <StCard>
        <StCardHead>
          <StCardTitle>🏟️ 코트별 진행</StCardTitle>
          <StCardHint>
            예상 종료 {toClock(timeline.expectedEnd)}
          </StCardHint>
        </StCardHead>
        {allDone ? (
          <StCardHint>모든 경기가 끝났어요. 🎉</StCardHint>
        ) : (
          <StCourtBoard>
            {timeline.courts.map((c) => {
              const playingT = c.playing ? timeline.byMatch.get(c.playing.no) : undefined;
              return (
                <StCourtCard key={c.court} $live={Boolean(c.playing)}>
                  <StCourtHead>
                    <StCourtTitle>코트 {c.court}</StCourtTitle>
                    {c.playing ? (
                      <StLiveBadge>
                        <StLiveDot /> LIVE <StBall>🎾</StBall>
                      </StLiveBadge>
                    ) : (
                      <StStateBadge $state="waiting">비어 있음 · {toClock(c.freeAt)}</StStateBadge>
                    )}
                  </StCourtHead>
                  {c.playing && playingT ? (
                    <StCourtSlot as="button" type="button" $kind="now" onClick={() => jumpToMatch(c.playing!.no)} title="이 경기 카드로 이동">
                      <StCourtSlotLabel $kind="now">지금</StCourtSlotLabel>
                      <StCourtSlotMain>
                        <b>
                          {playingT.position}번 · {teamText(c.playing)}
                        </b>
                        <em>
                          {toClock(playingT.expectedStart)} 시작
                          {(() => {
                            const e = elapsedOf(timeline, playingT);
                            return e ? ` · ${e.minutes}분 경과` : ` · 예상 종료 ${toClock(playingT.expectedEnd)}`;
                          })()}
                        </em>
                        {(() => {
                          const e = elapsedOf(timeline, playingT);
                          return e ? (
                            <StElapsedTrack style={{ marginTop: "0.3rem" }}>
                              <StElapsedFill $ratio={e.ratio} />
                            </StElapsedTrack>
                          ) : null;
                        })()}
                      </StCourtSlotMain>
                    </StCourtSlot>
                  ) : null}
                  {!c.playing ? (
                    <StCardHint>
                      {anyReady
                        ? "비어 있어요. 아래 다음 순서 경기에서 이 코트를 골라 시작하세요."
                        : upcoming.length > 0
                          ? "비어 있어요. 다음 경기 선수들이 다른 코트 경기를 마치면 시작할 수 있어요."
                          : "남은 경기가 없어요."}
                    </StCardHint>
                  ) : null}
                </StCourtCard>
              );
            })}
          </StCourtBoard>
        )}

        {nextThree.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {nextThree.map((m, i) => {
              const t = timeline.byMatch.get(m.no);
              if (!t) return null;
              const kind = i === 0 ? "next" : "later";
              return (
                <StCourtSlot key={m.no} as="button" type="button" $kind={kind} onClick={() => jumpToMatch(m.no)} title="이 경기 카드로 이동">
                  <StCourtSlotLabel $kind={kind}>{i === 0 ? "다음" : i === 1 ? "그다음" : "그 뒤"}</StCourtSlotLabel>
                  <StCourtSlotMain>
                    <b>
                      {t.position}번 · {teamText(m)}
                    </b>
                    <em>
                      {t.status === "ready" ? "▶ 지금 시작 가능 · 빈 코트를 골라 시작" : waitReason(m, t)}
                    </em>
                  </StCourtSlotMain>
                </StCourtSlot>
              );
            })}
          </div>
        ) : null}
      </StCard>

      <StCard>
        <StCardHead>
          <StCardTitle>📋 경기 순서 · 점수 입력</StCardTitle>
          {/* 라운드가 있는 대진표는 카드가 라운드별로 묶여 있어 ▲▼ 순서와 어긋나므로 순서 바꾸기를 두지 않는다 (리뷰 2026-09-15) */}
          {canReorder && event.rounds.length === 0 ? (
            reordering ? (
              <StActions>
                <StPrimaryBtn type="button" onClick={saveOrder} disabled={busy}>
                  {busy ? "저장 중..." : "순서 저장"}
                </StPrimaryBtn>
                <StGhostBtn type="button" onClick={() => setReordering(false)} disabled={busy}>
                  취소
                </StGhostBtn>
              </StActions>
            ) : (
              <StGhostBtn
                type="button"
                onClick={() => {
                  setDraft(event.matches);
                  setReordering(true);
                }}
              >
                ↕ 순서 바꾸기
              </StGhostBtn>
            )
          ) : null}
        </StCardHead>
        {/* 스크롤해도 위에 붙어 있는 '다음 시작' 띠: 지금 시작 가능한 경기 번호를 바로 보고 카드로 이동 (2026-09-15) */}
        {!reordering && (nextReady || nextThree[0]) && (() => {
          const m = nextReady ?? nextThree[0];
          const t = timeline.byMatch.get(m.no);
          if (!t) return null;
          return (
            <NextUpBar
              ready={t.status === "ready"}
              position={t.position}
              names={teamText(m)}
              why={t.status === "ready" ? "지금 시작 가능" : waitReason(m, t)}
              courts={timeline.courts.map((c) => {
                const pt = c.playing ? timeline.byMatch.get(c.playing.no) : null;
                const e = pt ? elapsedOf(timeline, pt) : null;
                return {
                  court: c.court,
                  free: !c.playing,
                  label: c.playing && pt ? `${pt.position}번 ${e ? `${e.minutes}분 경과` : "진행 중"}` : "비어 있음",
                };
              })}
              onJump={() => jumpToMatch(m.no)}
            />
          );
        })()}
        <StCardHint>
          위에서부터 순서대로, 비는 코트에 들어가요. 코트와 선수가 비면 &ldquo;지금 시작 가능&rdquo;이
          되고, 시작 버튼을 눌러 코트를 정한 뒤 경기가 끝나면 게임 수(예: 6 : 4)를 저장하세요.
          {reordering ? " 아직 시작하지 않은 경기만 ▲▼로 옮길 수 있어요." : ""}
        </StCardHint>

        {reordering ? (
          /* 순서 바꾸기 중에는 라운드 경계를 넘겨 옮길 수 있게 한 줄 목록으로 */
          <StQueueList $single>
            {list.map((match, index) => {
              const timing = timeline.byMatch.get(match.no);
              if (!timing) return null;
              return (
                <MatchCard
                  key={match.no}
                  match={match}
                  players={players}
                  score={scores[match.no] ?? null}
                  timing={{ ...timing, position: index + 1 }}
                  timeline={timeline}
                  courts={courts}
                  busy={busy}
                  reorder={
                    movable(match)
                      ? {
                          canUp: index > 0 && movable(list[index - 1]),
                          canDown: index < list.length - 1 && movable(list[index + 1]),
                          onUp: () => move(index, -1),
                          onDown: () => move(index, 1),
                        }
                      : undefined
                  }
                  onStart={onStart}
                  onSave={onSave}
                  onClear={onClear}
                />
              );
            })}
          </StQueueList>
        ) : (
          /* 대진표(라운드) 순서대로 — 라운드마다 제목·시간을 달고, 경기가 없는 라운드(당일 편성)는 빈 칸으로 보여 준다 (2026-09-15) */
          <StRoundStack>
            {roundGroups.map((group) => (
              <div key={group.round.no} style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                <StRoundHead>
                  <StRoundTitle>
                    R{group.round.no} · {group.round.label}
                  </StRoundTitle>
                  <StRoundTime>{group.round.time}</StRoundTime>
                </StRoundHead>
                {/* 코트마다 한 칸: 그 코트에 경기가 있으면 카드, 없으면 빈 칸(편성하기). 경기를 넣어도 옆 코트 칸은 그대로 남는다 (2026-09-15) */}
                {/* 라운드 카드는 한 줄에 두 장(토너먼트와 동일). 한 장씩 내려오는 건 휴대폰 폭(767px 이하)에서만 (2026-09-15) */}
                <StMatchGrid>
                  {(() => {
                    const roundNo = group.round.no;
                    const taken = busyInRound(roundNo, editingNo);
                    const placed = new Set<Court>();
                    const cells: ReactNode[] = [];
                    const renderPicker = (court: Court, editing: Match | null) => (
                            <StPicker>
                              {(["a", "b"] as const).map((side) => {
                                const team = side === "a" ? sideA : sideB;
                                return (
                                  <div key={side} className="side">
                                    <span className="label">{team || (side === "a" ? "A팀" : "B팀")} · {pick[side].length}/2</span>
                                    <div className="chips">
                                      {roster
                                        .filter((pl) => (team ? pl.team === team : true))
                                        .map((pl) => {
                                          const on = pick[side].includes(pl.name);
                                          const otherSide = side === "a" ? "b" : "a";
                                          const onOther = pick[otherSide].includes(pl.name);
                                          const blocked = taken.has(pl.name) || onOther;
                                          return (
                                            <button
                                              key={pl.name}
                                              type="button"
                                              className={on ? "chip on" : blocked ? "chip off" : "chip"}
                                              disabled={blocked}
                                              title={onOther ? "반대쪽에 이미 골랐어요" : blocked ? "이 라운드에 이미 들어가 있어요" : undefined}
                                              onClick={() => toggle(side, pl.name)}
                                            >
                                              <span className="who">
                                                {pl.name}
                                                <i className={pl.gender === "F" ? "g f" : "g m"}>{pl.gender === "F" ? "여" : "남"}</i>
                                              </span>
                                              <small>
                                                {pl.years}년 · 뛴 {playedCount.get(pl.name) ?? 0}/{gameCount.get(pl.name) ?? 0}
                                              </small>
                                            </button>
                                          );
                                        })}
                                    </div>
                                  </div>
                                );
                              })}
                              <div className="actions">
                                <StGhostBtn type="button" onClick={() => setPick(recommend(roundNo, editingNo) ?? { a: [], b: [] })}>
                                  ✨ 추천으로 채우기
                                </StGhostBtn>
                                <StGhostBtn type="button" onClick={closePicker}>
                                  취소
                                </StGhostBtn>
                                {editing && (
                                  <StGhostBtn type="button" disabled={busy} onClick={() => void removeMatch(editing)}>
                                    이 경기 빼기
                                  </StGhostBtn>
                                )}
                                <StPrimaryBtn
                                  type="button"
                                  disabled={busy || pick.a.length !== 2 || pick.b.length !== 2}
                                  onClick={() => saveSlot(roundNo, court, editing)}
                                >
                                  {editing ? "이렇게 바꾸기" : "이 코트에 넣기"}
                                </StPrimaryBtn>
                              </div>
                              <span className="hint">추천은 확정 경기가 적은 선수부터, 이미 짝이 됐던 조합은 피해서 골라요. &ldquo;뛴 2/5&rdquo;는 끝난 경기 2 / 확정 경기 5예요.</span>
                            </StPicker>
                    );
                    for (const match of group.matches) {
                      const timing = timeline.byMatch.get(match.no);
                      if (!timing) continue;
                      if (match.court) placed.add(match.court);
                      const key = `${roundNo}-${match.court ?? "?"}`;
                      // 아직 시작·점수 기록이 없는 경기는 어느 라운드든 선수를 바꾸거나 뺄 수 있다 (리뷰 2026-09-15: '당일' 이름으로 가리던 조건 제거)
                      const editable = canReorder && !scores[match.no];
                      if (editingNo === match.no && fillSlot === key) {
                        cells.push(
                          <StEmptySlot key={`m-${match.no}`} $open>
                            <div className="head">
                              <span className="court">코트 {match.court ?? "-"} · {match.no}번 경기 선수 바꾸기</span>
                            </div>
                            {renderPicker(match.court ?? courts[0], match)}
                          </StEmptySlot>,
                        );
                        continue;
                      }
                      cells.push(
                        <div key={`m-${match.no}`}>
                          <MatchCard
                            match={match}
                            players={players}
                            score={scores[match.no] ?? null}
                            timing={timing}
                            timeline={timeline}
                            courts={courts}
                            busy={busy}
                            onStart={onStart}
                            onSave={onSave}
                            onClear={onClear}
                          />
                          {editable && (
                            <StEditRow>
                              <StGhostBtn type="button" disabled={busy} onClick={() => openEdit(match)}>
                                ✏️ 선수 바꾸기
                              </StGhostBtn>
                            </StEditRow>
                          )}
                        </div>,
                      );
                    }
                    for (const court of courts) {
                      if (placed.has(court)) continue;
                      const key = `${roundNo}-${court}`;
                      const open = fillSlot === key && editingNo === null;
                      cells.push(
                        <StEmptySlot key={court} $open={open}>
                          <div className="head">
                            <span className="court">코트 {court}</span>
                            {canReorder && !open && (
                              <StGhostBtn type="button" onClick={() => openSlot(roundNo, court)} disabled={busy}>
                                ✏️ 편성하기
                              </StGhostBtn>
                            )}
                          </div>
                          {!open && <span className="hint">당일 편성 · 아직 선수가 없어요</span>}
                          {open && renderPicker(court, null)}
                        </StEmptySlot>,
                      );
                    }
                    return cells;
                  })()}
                </StMatchGrid>
              </div>
            ))}
            {unrounded.length > 0 && (
              <StMatchGrid>
                {unrounded.map((match) => {
                  const timing = timeline.byMatch.get(match.no);
                  if (!timing) return null;
                  return (
                    <MatchCard
                      key={match.no}
                      match={match}
                      players={players}
                      score={scores[match.no] ?? null}
                      timing={timing}
                      timeline={timeline}
                      courts={courts}
                      busy={busy}
                      onStart={onStart}
                      onSave={onSave}
                      onClear={onClear}
                    />
                  );
                })}
              </StMatchGrid>
            )}
          </StRoundStack>
        )}
      </StCard>
    </>
  );
}

/* 라운드 묶음을 세로로 쌓는다 */
const StRoundStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
`;

/* 당일 편성처럼 아직 선수가 없는 코트 칸. 편성 중이면 실선 */
const StEmptySlot = styled.div<{ $open?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 5.5rem;
  padding: 0.9rem 1rem;
  border: 1px ${({ $open }) => ($open ? "solid" : "dashed")} ${({ $open, theme }) => ($open ? theme.semantic.primary : theme.colors.gray300)};
  border-radius: 0.9rem;
  color: ${({ theme }) => theme.colors.gray500};

  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .court {
    font-size: 0.8rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray600};
  }

  .hint {
    font-size: 0.8rem;
    line-height: 1.5;
    word-break: keep-all;
  }
`;

/* 슬롯 안 선수 고르기: 팀별 칩 두 줄 + 버튼 */

const StEditRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.4rem;
`;

const StPicker = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;

  .side {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .label {
    font-size: 0.75rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray600};
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }

  .chip {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.1rem;
    padding: 0.35rem 0.65rem;
    border-radius: 0.7rem;
    border: 1px solid transparent;
    background: ${({ theme }) => theme.semantic.bg};
    color: ${({ theme }) => theme.semantic.text};
    font-size: 0.8rem;
    font-weight: 700;
    line-height: 1.2;
    cursor: pointer;
    text-align: left;

    .who {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }

    .g {
      font-style: normal;
      font-size: 0.62rem;
      font-weight: 800;
      padding: 0.05rem 0.3rem;
      border-radius: 999px;
    }

    .g.m {
      color: ${({ theme }) => theme.colors.blue600};
      background: ${({ theme }) => theme.colors.blue50};
    }

    .g.f {
      color: ${({ theme }) => theme.colors.rose600};
      background: ${({ theme }) => theme.colors.rose50};
    }

    small {
      font-size: 0.66rem;
      font-weight: 700;
      color: ${({ theme }) => theme.colors.gray500};
      font-variant-numeric: tabular-nums;
    }
  }

  .chip.on {
    background: ${({ theme }) => theme.semantic.primary};
    color: ${({ theme }) => theme.colors.white};

    small {
      color: rgba(255, 255, 255, 0.85);
    }

    .g {
      color: ${({ theme }) => theme.colors.white};
      background: rgba(255, 255, 255, 0.22);
    }
  }

  .chip.off,
  .chip:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
  }
`;
