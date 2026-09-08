"use client";

import {
  StBracketCol,
  StBracketColBody,
  StBracketColTitle,
  StBracketColumns,
  StBracketLane,
  StBracketLaneTitle,
  StBracketScroll,
  StCardHint,
  StNode,
  StNodeHead,
  StNodeTeam,
} from "../page.styles";
import { STAGE_COLOR, type GeneralTeam, type ResolvedGeneralMatch } from "./types";

// 결선 대진 그림. 라운드가 왼쪽에서 오른쪽으로 한 열씩 놓이고, 오른쪽 끝이 결승이다.
// (연결선은 그리지 않는다 — 라운드 수가 대회마다 달라 열 배치만으로 읽히게 했다)
type Props = { matches: ResolvedGeneralMatch[] };

const STATE_TEXT: Record<ResolvedGeneralMatch["status"], string> = {
  done: "완료",
  playing: "경기 중",
  ready: "시작 가능",
  waiting: "대기",
};

function TeamLine({
  team,
  label,
  score,
  winner,
}: {
  team: GeneralTeam | null;
  label: string;
  score: number | null;
  winner: boolean;
}) {
  return (
    <StNodeTeam $winner={winner} $empty={team === null}>
      <span className="name">{team ? `#${team.seed} ${team.name}` : label}</span>
      <span className="score">{score !== null ? score : ""}</span>
    </StNodeTeam>
  );
}

function Node({ m }: { m: ResolvedGeneralMatch }) {
  return (
    <StNode $color={STAGE_COLOR.ko} $state={m.status}>
      <StNodeHead>
        <span>{m.match.no}번</span>
        <span>{STATE_TEXT[m.status]}</span>
      </StNodeHead>
      <TeamLine
        team={m.teamA}
        label={m.aLabel}
        score={m.scoreA}
        winner={m.status === "done" && m.winner?.id === m.teamA?.id}
      />
      <TeamLine
        team={m.teamB}
        label={m.bLabel}
        score={m.scoreB}
        winner={m.status === "done" && m.winner?.id === m.teamB?.id}
      />
    </StNode>
  );
}

export default function GeneralBracket({ matches }: Props) {
  const ko = matches.filter((m) => m.match.stage === "ko");
  if (ko.length === 0) {
    return <StCardHint>결선 대진은 조별 경기가 모두 끝나면 만들어요.</StCardHint>;
  }

  const thirdPlace = ko.filter((m) => m.match.label === "3-4위전");
  const main = ko.filter((m) => m.match.label !== "3-4위전");
  const roundNos = [...new Set(main.map((m) => m.match.round))].sort((a, b) => a - b);

  return (
    <StBracketScroll>
      <StBracketColumns $cols={Math.max(1, roundNos.length)}>
        {roundNos.map((round) => {
          const list = main.filter((m) => m.match.round === round);
          return (
            <StBracketCol key={round}>
              <StBracketColTitle>{list[0]?.match.label ?? `${round}라운드`}</StBracketColTitle>
              <StBracketColBody>
                {list.map((m) => (
                  <Node key={m.match.no} m={m} />
                ))}
              </StBracketColBody>
            </StBracketCol>
          );
        })}
      </StBracketColumns>
      {thirdPlace.length > 0 ? (
        <StBracketLane style={{ marginTop: "1.4rem", marginBottom: 0, borderBottom: "none" }}>
          <StBracketLaneTitle $color={STAGE_COLOR.ko}>
            3-4위전 <em>준결승에서 진 두 팀</em>
          </StBracketLaneTitle>
          <div style={{ display: "grid", gap: "0.6rem", maxWidth: "15.4rem" }}>
            {thirdPlace.map((m) => (
              <Node key={m.match.no} m={m} />
            ))}
          </div>
        </StBracketLane>
      ) : null}
    </StBracketScroll>
  );
}
