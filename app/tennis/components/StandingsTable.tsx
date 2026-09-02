"use client";

import { useState } from "react";
import {
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StChip,
  StChipRow,
  StNameCell,
  StTable,
  StTableWrap,
  StTag,
} from "../page.styles";
import {
  GENDER_COLOR,
  GENDER_LABEL,
  POINTS,
  type Gender,
  type PlayerStanding,
} from "../types";

type Props = {
  standings: PlayerStanding[];
  finished: number;
  total: number;
  onPickPlayer: (name: string) => void;
};

type GenderFilter = "all" | Gender;

export default function StandingsTable({
  standings,
  finished,
  total,
  onPickPlayer,
}: Props) {
  const [gender, setGender] = useState<GenderFilter>("all");

  const rows =
    gender === "all"
      ? standings
      : standings.filter((row) => row.player.gender === gender);

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>🏆 승점 순위</StCardTitle>
        <StChipRow>
          <StChip type="button" $active={gender === "all"} $color="#3b6fd6" onClick={() => setGender("all")}>
            전체
          </StChip>
          <StChip type="button" $active={gender === "M"} $color={GENDER_COLOR.M} onClick={() => setGender("M")}>
            남자
          </StChip>
          <StChip type="button" $active={gender === "F"} $color={GENDER_COLOR.F} onClick={() => setGender("F")}>
            여자
          </StChip>
        </StChipRow>
      </StCardHead>
      <StCardHint>
        승 {POINTS.win}점 · 무 {POINTS.draw}점 · 패 {POINTS.loss}점. 승점이 같으면 득실(딴 게임 −
        내준 게임) → 딴 게임 순. 지금까지 {finished}/{total}경기 반영. 이름을 누르면 그 선수
        일정으로 가요.
      </StCardHint>
      <StTableWrap>
        <StTable>
          <thead>
            <tr>
              <th>순위</th>
              <th className="name">선수</th>
              <th>경기</th>
              <th>승</th>
              <th>무</th>
              <th>패</th>
              <th>득실</th>
              <th>승점</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.player.name} className={row.rank <= 3 && row.played > 0 ? "top" : ""}>
                <td className="rank">{row.played > 0 ? row.rank : "-"}</td>
                <td className="name">
                  <StNameCell type="button" onClick={() => onPickPlayer(row.player.name)}>
                    {row.player.name}
                    <StTag $color={GENDER_COLOR[row.player.gender]}>
                      {GENDER_LABEL[row.player.gender]}
                    </StTag>
                  </StNameCell>
                </td>
                <td className="muted">
                  {row.played}/{row.scheduled}
                </td>
                <td>{row.wins}</td>
                <td className="muted">{row.draws}</td>
                <td className="muted">{row.losses}</td>
                <td>{row.diff > 0 ? `+${row.diff}` : row.diff}</td>
                <td className="points">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </StTable>
      </StTableWrap>
    </StCard>
  );
}
