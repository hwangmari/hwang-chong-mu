"use client";

import {
  StBracketCol,
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
import { STAGE_COLOR, type ResolvedMatch, type TeamEntry } from "./types";

type Props = { matches: ResolvedMatch[] };

// 승자조 / 패자조 / 순위결정전 세 줄로, 왼쪽에서 오른쪽으로 갈수록 결승에 가까워진다
const LANES: { title: string; hint: string; color: string; columns: { title: string; nos: number[] }[] }[] = [
  {
    title: "승자조",
    hint: "이기면 오른쪽으로, 지면 패자조로 내려가요",
    color: "#1d4ed8",
    columns: [
      { title: "1라운드", nos: [1, 2, 3, 4] },
      { title: "승자조 4강", nos: [5, 6] },
      { title: "승자조 결승", nos: [9] },
      { title: "그랜드 파이널", nos: [16, 18] },
    ],
  },
  {
    title: "패자조",
    hint: "여기서 지면 두 번째 패배 → 순위결정전",
    color: "#be123c",
    columns: [
      { title: "패자조 1R", nos: [7, 8] },
      { title: "패자조 2R", nos: [10, 11] },
      { title: "패자조 준결승", nos: [13] },
      { title: "패자조 결승", nos: [15] },
    ],
  },
  {
    title: "순위결정전",
    hint: "1~8위를 모두 정해요",
    color: "#64748b",
    columns: [
      { title: "7-8위전", nos: [12] },
      { title: "5-6위전", nos: [14] },
      { title: "3-4위전", nos: [17] },
      { title: "", nos: [] },
    ],
  },
];

function teamLine(team: TeamEntry | null, label: string, score: number | null, winner: boolean) {
  return (
    <StNodeTeam $winner={winner} $empty={!team}>
      <span className="name">{team ? `#${team.seed} ${team.name}` : label}</span>
      <span className="score">{score !== null ? score : ""}</span>
    </StNodeTeam>
  );
}

export default function BracketDiagram({ matches }: Props) {
  const by = new Map(matches.map((m) => [m.template.no, m]));
  return (
    <StBracketScroll>
      {LANES.map((lane) => (
        <StBracketLane key={lane.title}>
          <StBracketLaneTitle $color={lane.color}>
            {lane.title} <em>· {lane.hint}</em>
          </StBracketLaneTitle>
          <StBracketColumns $cols={lane.columns.length}>
            {lane.columns.map((col, ci) => (
              <StBracketCol key={`${lane.title}-${ci}`}>
                {col.title ? <StBracketColTitle>{col.title}</StBracketColTitle> : null}
                {col.nos.map((no) => {
                  const m = by.get(no);
                  if (!m) return null;
                  // 리셋 재경기는 열리기 전까지 흐리게 보여준다
                  const state = m.status;
                  const winnerA = m.status === "done" && m.winner?.seed === m.teamA?.seed && m.teamA !== null;
                  const winnerB = m.status === "done" && m.winner?.seed === m.teamB?.seed && m.teamB !== null;
                  return (
                    <StNode key={no} $color={STAGE_COLOR[m.template.stage]} $state={state}>
                      <StNodeHead>
                        <span>
                          {no}번 · {m.template.label}
                        </span>
                        <span>
                          {state === "done"
                            ? "완료"
                            : state === "playing"
                              ? "진행 중"
                              : state === "ready"
                                ? "시작 가능"
                                : state === "hidden"
                                  ? "조건부"
                                  : `코트 ${m.template.court}`}
                        </span>
                      </StNodeHead>
                      {teamLine(m.teamA, m.aLabel, m.scoreA, winnerA)}
                      {teamLine(m.teamB, m.bLabel, m.scoreB, winnerB)}
                    </StNode>
                  );
                })}
              </StBracketCol>
            ))}
          </StBracketColumns>
        </StBracketLane>
      ))}
      <StCardHint>
        진한 글씨가 이긴 팀이에요. 리셋 재경기는 패자조 출신이 그랜드 파이널을 이겼을 때만 열려서 그전엔 흐리게 보여요.
        화면이 좁으면 옆으로 밀어서 보세요.
      </StCardHint>
    </StBracketScroll>
  );
}
