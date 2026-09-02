"use client";

import MatchCard from "./MatchCard";
import {
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StMatchGrid,
  StRoundHead,
  StRoundTime,
  StRoundTitle,
} from "../page.styles";
import type { Player, ScoreMap, TennisEvent } from "../types";

type Props = {
  event: TennisEvent;
  players: Map<string, Player>;
  scores: ScoreMap;
  busy: boolean;
  onSave: (matchNo: number, scoreA: number, scoreB: number) => Promise<void>;
  onClear: (matchNo: number) => Promise<void>;
};

export default function RoundList({
  event,
  players,
  scores,
  busy,
  onSave,
  onClear,
}: Props) {
  return (
    <StCard>
      <StCardHead>
        <StCardTitle>🎾 대진표 · 점수 입력</StCardTitle>
      </StCardHead>
      <StCardHint>
        경기가 끝나면 A팀 : B팀 게임 수를 넣고 저장하세요. 예) 6 : 4. 저장하면 순위표에
        바로 반영되고, 같은 링크를 연 다른 사람 화면에도 곧 나타나요.
      </StCardHint>

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
