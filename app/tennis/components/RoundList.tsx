"use client";

import MatchCard from "./MatchCard";
import { matchLabel } from "../data";
import { toClock } from "../format";
import type { Timeline } from "../timeline";
import {
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StCourtBox,
  StCourtLine,
  StCourtName,
  StCourtStrip,
  StMatchGrid,
  StRoundHead,
  StRoundTime,
  StRoundTitle,
} from "../page.styles";
import type { Match, Player, ScoreMap, TennisEvent } from "../types";

type Props = {
  event: TennisEvent;
  players: Map<string, Player>;
  scores: ScoreMap;
  timeline: Timeline;
  busy: boolean;
  onSave: (matchNo: number, scoreA: number, scoreB: number) => Promise<void>;
  onClear: (matchNo: number) => Promise<void>;
};

export default function RoundList({
  event,
  players,
  scores,
  timeline,
  busy,
  onSave,
  onClear,
}: Props) {
  const allDone = timeline.courts.every((c) => c.current === null);
  const teamText = (m: Match) => `${m.teamA.join("·")} vs ${m.teamB.join("·")}`;

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>🎾 대진표 · 점수 입력</StCardTitle>
      </StCardHead>
      <StCardHint>
        경기가 끝나면 A팀 : B팀 게임 수를 넣고 저장하세요. 예) 6 : 4. 저장하면 순위표에
        바로 반영되고, 같은 링크를 연 다른 사람 화면에도 곧 나타나요. 점수를 저장한 시각을
        경기 끝난 시각으로 보고, 먼저 끝난 코트가 있으면 남은 경기의 예상 시각을 다시 계산해요.
      </StCardHint>

      {allDone ? null : (
        <StCourtStrip>
          {timeline.courts.map((c) => {
            const cur = c.current ? timeline.byMatch.get(c.current.no) : undefined;
            const nxt = c.next ? timeline.byMatch.get(c.next.no) : undefined;
            return (
              <StCourtBox key={c.court}>
                <StCourtName>코트 {c.court}</StCourtName>
                {c.current && cur ? (
                  <StCourtLine>
                    {cur.status === "playing" ? "🎾 진행 중 " : "⏳ 다음 "}
                    {matchLabel(c.current.no)} <em>{teamText(c.current)}</em>
                    <em>
                      {" "}
                      · {cur.status === "playing" ? `${toClock(cur.expectedStart)} 시작` : `예상 ${toClock(cur.expectedStart)}`}
                      {cur.waitingFor === "players" && cur.waitingPlayers.length > 0
                        ? ` (${cur.waitingPlayers.join(", ")} 기다림)`
                        : ""}
                    </em>
                  </StCourtLine>
                ) : (
                  <StCourtLine>남은 경기 없음</StCourtLine>
                )}
                {c.next && nxt ? (
                  <StCourtLine>
                    <em>
                      그다음 {matchLabel(c.next.no)} {teamText(c.next)} · 예상 {toClock(nxt.expectedStart)}
                    </em>
                  </StCourtLine>
                ) : null}
              </StCourtBox>
            );
          })}
        </StCourtStrip>
      )}

      {event.rounds.map((round) => {
        const matches = event.matches.filter((m) => m.round === round.no);
        return (
          <div key={round.no}>
            <StRoundHead>
              <StRoundTitle>
                R{round.no} · {round.label}
              </StRoundTitle>
              <StRoundTime>{round.time}</StRoundTime>
            </StRoundHead>
            <StMatchGrid style={{ marginTop: "0.6rem" }}>
              {matches.map((match) => (
                <MatchCard
                  key={match.no}
                  match={match}
                  players={players}
                  score={scores[match.no] ?? null}
                  timing={timeline.byMatch.get(match.no)}
                  busy={busy}
                  onSave={onSave}
                  onClear={onClear}
                />
              ))}
            </StMatchGrid>
          </div>
        );
      })}
    </StCard>
  );
}
