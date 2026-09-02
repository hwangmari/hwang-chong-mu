"use client";

import { useMemo } from "react";
import { validateBracket } from "../generate";
import type { RuleSettings } from "../rules";
import {
  StEditMatch,
  StEditMeta,
  StEditTeam,
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
} from "../types";

type Props = {
  players: Player[];
  matches: Match[]; // 배열 순서 = 진행 순서
  courts: number;
  rules: RuleSettings;
  onChange: (matches: Match[]) => void;
};

// 슬롯에 들어갈 수 있는 성별: 남복→남, 여복→여, 혼복→팀의 첫 자리 남·둘째 자리 여
function slotGender(type: Match["type"], index: 0 | 1): Gender {
  if (type === "men") return "M";
  if (type === "women") return "F";
  return index === 0 ? "M" : "F";
}

export default function BracketEditor({ players, matches, courts, rules, onChange }: Props) {
  const warnings = useMemo(
    () => validateBracket(players, matches, courts, rules),
    [players, matches, courts, rules],
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

  function renderSelect(m: Match, side: "A" | "B", index: 0 | 1, position: number) {
    const gender = slotGender(m.type, index);
    const value = side === "A" ? m.teamA[index] : m.teamB[index];
    const options = players.filter((p) => p.gender === gender);
    return (
      <StSelect
        aria-label={`${position}번째 경기 ${side}팀 ${index + 1}번째 선수`}
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

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {matches.map((m, i) => (
          <StEditMatch key={m.no} $color={MATCH_TYPE_COLOR[m.type]}>
            <StEditMeta>
              {i + 1}번 · {MATCH_TYPE_SHORT[m.type]}
            </StEditMeta>
            <StEditTeam>
              {renderSelect(m, "A", 0, i + 1)}
              {renderSelect(m, "A", 1, i + 1)}
            </StEditTeam>
            <StVs>vs</StVs>
            <StEditTeam>
              {renderSelect(m, "B", 0, i + 1)}
              {renderSelect(m, "B", 1, i + 1)}
            </StEditTeam>
          </StEditMatch>
        ))}
      </div>
    </>
  );
}
