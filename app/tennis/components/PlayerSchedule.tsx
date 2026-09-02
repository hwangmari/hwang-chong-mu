"use client";

import { buildPlayerSchedule } from "../standings";
import { toClock } from "../format";
import { playedMinutes, type Timeline } from "../timeline";
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
  timeline: Timeline;
  selected: string | null;
  onSelect: (name: string) => void;
};

const OUTCOME_LABEL = { win: "승", loss: "패", draw: "무" } as const;

export default function PlayerSchedule({ event, scores, timeline, selected, onSelect }: Props) {
  const schedule = selected ? buildPlayerSchedule(event, scores, selected) : [];

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>👤 선수별 일정</StCardTitle>
      </StCardHead>
      <StCardHint>
        내 이름을 누르면 몇 번째 경기인지, 어느 코트에서 몇 시쯤, 누구와 짝이 되어 누구랑 붙는지 한눈에 보여요.
        시간은 실제 진행에 맞춰 계속 바뀌는 예상 시각이에요.
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
            const t = timeline.byMatch.get(view.match.no);
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
            const mins = view.score ? playedMinutes(view.score) : null;
            const when = !t
              ? ""
              : t.status === "done"
                ? `완료 ${toClock(t.expectedEnd)}${mins !== null ? ` · ${mins}분` : ""}`
                : t.status === "playing"
                  ? "진행 중"
                  : t.status === "ready"
                    ? "지금 시작 가능"
                    : `예상 ${toClock(t.expectedStart)}`;
            return (
              <StScheduleRow key={view.match.no} $color={MATCH_TYPE_COLOR[view.match.type]}>
                <StScheduleTime>
                  <span>{view.position}번째 경기</span>
                  <span>
                    {when}
                    {t ? ` · 코트 ${t.court}` : ""}
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
                    <StResultBadge $tone="todo">{t?.status === "playing" ? "진행 중" : "예정"}</StResultBadge>
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
