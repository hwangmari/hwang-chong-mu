"use client";

import { matchLabel } from "../data";
import { buildPlayerSchedule } from "../standings";
import {
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StChip,
  StChipRow,
  StEmpty,
  StResultBadge,
  StScheduleLine,
  StScheduleList,
  StScheduleMain,
  StScheduleRow,
  StScheduleScore,
  StScheduleTime,
  StTag,
} from "../page.styles";
import {
  GENDER_COLOR,
  MATCH_TYPE_COLOR,
  MATCH_TYPE_SHORT,
  type ScoreMap,
  type TennisEvent,
} from "../types";

type Props = {
  event: TennisEvent;
  scores: ScoreMap;
  selected: string | null;
  onSelect: (name: string) => void;
};

const OUTCOME_LABEL = { win: "승", loss: "패", draw: "무" } as const;

export default function PlayerSchedule({ event, scores, selected, onSelect }: Props) {
  const schedule = selected ? buildPlayerSchedule(event, scores, selected) : [];

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>👤 선수별 일정</StCardTitle>
      </StCardHead>
      <StCardHint>
        내 이름을 누르면 오늘 몇 시에, 어느 코트에서, 누구와 짝이 되어 누구랑 붙는지 한눈에 보여요.
      </StCardHint>
      <StChipRow>
        {event.players.map((player) => (
          <StChip
            key={player.name}
            type="button"
            $active={selected === player.name}
            $color={GENDER_COLOR[player.gender]}
            onClick={() => onSelect(player.name)}
          >
            {player.name}
          </StChip>
        ))}
      </StChipRow>

      {!selected ? (
        <StEmpty>위에서 선수를 골라 주세요.</StEmpty>
      ) : (
        <StScheduleList>
          {schedule.map((view) => {
            const mine = view.score
              ? view.side === "A"
                ? view.score.scoreA
                : view.score.scoreB
              : null;
            const theirs = view.score
              ? view.side === "A"
                ? view.score.scoreB
                : view.score.scoreA
              : null;
            return (
              <StScheduleRow key={view.match.no} $color={MATCH_TYPE_COLOR[view.match.type]}>
                <StScheduleTime>
                  <span>R{view.round.no} · {view.round.time.split(" — ")[0]}</span>
                  <span>
                    코트 {view.match.court} · {matchLabel(view.match.no)}
                  </span>
                </StScheduleTime>
                <StScheduleMain>
                  <StScheduleLine>
                    <StTag $color={MATCH_TYPE_COLOR[view.match.type]}>
                      {MATCH_TYPE_SHORT[view.match.type]}
                    </StTag>{" "}
                    <b>{selected}</b> · {view.partner} <em>({view.side}팀)</em>
                  </StScheduleLine>
                  <StScheduleLine>
                    <em>vs</em> {view.opponents[0]} · {view.opponents[1]}
                  </StScheduleLine>
                </StScheduleMain>
                <StScheduleScore>
                  {view.score && view.outcome ? (
                    <>
                      <span>
                        {mine} : {theirs}
                      </span>
                      <StResultBadge $tone={view.outcome}>
                        {OUTCOME_LABEL[view.outcome]}
                      </StResultBadge>
                    </>
                  ) : (
                    <StResultBadge $tone="todo">예정</StResultBadge>
                  )}
                </StScheduleScore>
              </StScheduleRow>
            );
          })}
        </StScheduleList>
      )}
    </StCard>
  );
}
