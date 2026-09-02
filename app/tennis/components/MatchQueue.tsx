"use client";

import { useState } from "react";
import MatchCard from "./MatchCard";
import { toClock } from "../format";
import { courtLetters, elapsedOf, type Timeline } from "../timeline";
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
  StLiveBadge,
  StLiveDot,
  StPrimaryBtn,
  StQueueList,
  StStateBadge,
} from "../page.styles";
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

  // 다음 순서: 아직 시작 안 한 경기 중 앞에서 3개 (코트는 그때 비는 곳으로 가므로 코트별로 나누지 않는다)
  const upcoming = event.matches.filter((m) => {
    const t = timeline.byMatch.get(m.no);
    return t && (t.status === "ready" || t.status === "waiting");
  });
  const nextThree = upcoming.slice(0, 3);
  const anyReady = upcoming.some((m) => timeline.byMatch.get(m.no)?.status === "ready");
  const allDone = timeline.courts.every((c) => !c.playing) && upcoming.length === 0;

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
                    <StCourtSlot $kind="now">
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
                <StCourtSlot key={m.no} $kind={kind}>
                  <StCourtSlotLabel $kind={kind}>{i === 0 ? "다음" : i === 1 ? "그다음" : "그 뒤"}</StCourtSlotLabel>
                  <StCourtSlotMain>
                    <b>
                      {t.position}번 · {teamText(m)}
                    </b>
                    <em>
                      {t.status === "ready"
                        ? "▶ 지금 시작 가능 · 빈 코트를 골라 시작"
                        : `예상 ${toClock(t.expectedStart)}${t.waitingPlayers.length > 0 ? ` · ${t.waitingPlayers.join(", ")} 경기 끝나면` : ""}`}
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
          {canReorder ? (
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
        <StCardHint>
          위에서부터 순서대로, 비는 코트에 들어가요. 코트와 선수가 비면 &ldquo;지금 시작 가능&rdquo;이
          되고, 시작 버튼을 눌러 코트를 정한 뒤 경기가 끝나면 게임 수(예: 6 : 4)를 저장하세요.
          {reordering ? " 아직 시작하지 않은 경기만 ▲▼로 옮길 수 있어요." : ""}
        </StCardHint>

        <StQueueList>
          {list.map((match, index) => {
            const timing = timeline.byMatch.get(match.no);
            if (!timing) return null;
            return (
              <MatchCard
                key={match.no}
                match={match}
                players={players}
                score={scores[match.no] ?? null}
                timing={reordering ? { ...timing, position: index + 1 } : timing}
                timeline={timeline}
                courts={courts}
                busy={busy}
                reorder={
                  reordering && movable(match)
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
      </StCard>
    </>
  );
}
