"use client";

import { useMemo } from "react";
import { matchLabel } from "../data";
import { validateBracket } from "../generate";
import {
  StEditMatch,
  StEditMeta,
  StEditTeam,
  StRoundHead,
  StRoundTime,
  StRoundTitle,
  StSelect,
  StVs,
  StWarnList,
} from "../page.styles";
import {
  MATCH_TYPE_COLOR,
  MATCH_TYPE_SHORT,
  type Gender,
  type Match,
  type Player,
  type Round,
} from "../types";

type Props = {
  players: Player[];
  rounds: Round[];
  matches: Match[];
  onChange: (matches: Match[]) => void;
};

// 슬롯에 들어갈 수 있는 성별: 남복→남, 여복→여, 혼복→팀의 첫 자리 남·둘째 자리 여
function slotGender(type: Match["type"], index: 0 | 1): Gender {
  if (type === "men") return "M";
  if (type === "women") return "F";
  return index === 0 ? "M" : "F";
}

export default function BracketEditor({ players, rounds, matches, onChange }: Props) {
  const warnings = useMemo(
    () => validateBracket(players, matches, rounds.length),
    [players, matches, rounds.length],
  );

  function setPlayer(matchNo: number, side: "A" | "B", index: 0 | 1, name: string) {
    onChange(
      matches.map((m) => {
        if (m.no !== matchNo) return m;
        const team = [...(side === "A" ? m.teamA : m.teamB)] as [string, string];
        team[index] = name;
        return side === "A" ? { ...m, teamA: team } : { ...m, teamB: team };
      }),
    );
  }

  function renderSelect(m: Match, side: "A" | "B", index: 0 | 1) {
    const gender = slotGender(m.type, index);
    const value = side === "A" ? m.teamA[index] : m.teamB[index];
    const options = players.filter((p) => p.gender === gender);
    return (
      <StSelect
        aria-label={`${matchLabel(m.no)} ${side}팀 ${index + 1}번째 선수`}
        value={value}
        onChange={(e) => setPlayer(m.no, side, index, e.target.value)}
      >
        {options.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name} ({p.years}년)
          </option>
        ))}
        {options.some((p) => p.name === value) ? null : (
          <option value={value}>{value} (명단에 없음)</option>
        )}
      </StSelect>
    );
  }

  return (
    <>
      {warnings.length > 0 ? (
        <StWarnList>
          {warnings.map((w, i) => (
            <li key={`${w.level}-${i}`} className={w.level}>
              {w.message}
            </li>
          ))}
        </StWarnList>
      ) : null}

      {rounds.map((round) => (
        <div key={round.no} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <StRoundHead>
            <StRoundTitle>
              R{round.no} · {round.label}
            </StRoundTitle>
            <StRoundTime>{round.time}</StRoundTime>
          </StRoundHead>
          {matches
            .filter((m) => m.round === round.no)
            .map((m) => (
              <StEditMatch key={m.no} $color={MATCH_TYPE_COLOR[m.type]}>
                <StEditMeta>
                  {matchLabel(m.no)} · {m.court}코트 · {MATCH_TYPE_SHORT[m.type]}
                </StEditMeta>
                <StEditTeam>
                  {renderSelect(m, "A", 0)}
                  {renderSelect(m, "A", 1)}
                </StEditTeam>
                <StVs>vs</StVs>
                <StEditTeam>
                  {renderSelect(m, "B", 0)}
                  {renderSelect(m, "B", 1)}
                </StEditTeam>
              </StEditMatch>
            ))}
        </div>
      ))}
    </>
  );
}
