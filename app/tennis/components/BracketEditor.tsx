"use client";

import { useMemo, useState, type DragEvent } from "react";
import { suggestSwaps, validateBracket } from "../generate";
import type { RuleSettings } from "../rules";
import {
  StDragHandle,
  StEditMatch,
  StEditMeta,
  StEditTeam,
  StGhostBtn,
  StGroupHead,
  StReorderBtn,
  StSelect,
  StSuggestion,
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
  locked?: Set<number>; // 이미 시작·완료된 경기 번호(no) — 순서를 못 바꾼다
  onChange: (matches: Match[]) => void;
};

// 슬롯에 들어갈 수 있는 성별: 남복→남, 여복→여, 혼복→팀의 첫 자리 남·둘째 자리 여
function slotGender(type: Match["type"], index: 0 | 1): Gender {
  if (type === "men") return "M";
  if (type === "women") return "F";
  return index === 0 ? "M" : "F";
}

const EMPTY_LOCK = new Set<number>();

export default function BracketEditor({ players, matches, courts, rules, locked, onChange }: Props) {
  const lockedSet = locked ?? EMPTY_LOCK;
  const warnings = useMemo(
    () => validateBracket(players, matches, courts, rules),
    [players, matches, courts, rules],
  );
  const suggestions = useMemo(
    () => suggestSwaps(players, matches, courts, rules, lockedSet),
    [players, matches, courts, rules, lockedSet],
  );

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [overGroup, setOverGroup] = useState<number | null>(null);

  const step = Math.max(1, courts);
  const groups: { no: number; start: number; items: Match[] }[] = [];
  for (let i = 0; i < matches.length; i += step) {
    groups.push({ no: groups.length + 1, start: i, items: matches.slice(i, i + step) });
  }

  const isLocked = (m: Match | undefined) => (m ? lockedSet.has(m.no) : false);

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

  // from 위치의 경기를 to 위치로 옮긴다 (사이 경기들은 한 칸씩 밀린다)
  function moveTo(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || from >= matches.length || to >= matches.length) return;
    if (isLocked(matches[from]) || isLocked(matches[to])) return;
    const next = [...matches];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  function swap(a: number, b: number) {
    if (isLocked(matches[a]) || isLocked(matches[b])) return;
    const next = [...matches];
    [next[a], next[b]] = [next[b], next[a]];
    onChange(next);
  }

  function resetDrag() {
    setDragIndex(null);
    setOverIndex(null);
    setOverGroup(null);
  }

  function onDragStart(e: DragEvent, index: number) {
    if (isLocked(matches[index])) {
      e.preventDefault();
      return;
    }
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  }
  function onDropRow(e: DragEvent, index: number) {
    e.preventDefault();
    if (dragIndex !== null) moveTo(dragIndex, index);
    resetDrag();
  }
  function onDropGroup(e: DragEvent, groupStart: number) {
    e.preventDefault();
    if (dragIndex !== null) {
      // 묶음 헤더에 놓으면 그 묶음의 맨 앞으로 (아래로 옮길 땐 빠진 칸만큼 한 칸 당겨진다)
      const target = dragIndex < groupStart ? groupStart - 1 : groupStart;
      moveTo(dragIndex, Math.max(0, Math.min(target, matches.length - 1)));
    }
    resetDrag();
  }

  function renderSelect(m: Match, side: "A" | "B", index: 0 | 1, position: number) {
    const gender = slotGender(m.type, index);
    const value = side === "A" ? m.teamA[index] : m.teamB[index];
    const options = players.filter((p) => p.gender === gender);
    return (
      <StSelect
        aria-label={`${position}번째 경기 ${side}팀 ${index + 1}번째 선수`}
        value={value}
        disabled={isLocked(m)}
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

      {suggestions.map((sg) => (
        <StSuggestion key={`${sg.from}-${sg.to}`}>
          <span>💡 {sg.message}</span>
          <StGhostBtn type="button" onClick={() => swap(sg.from, sg.to)}>
            적용
          </StGhostBtn>
        </StSuggestion>
      ))}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {groups.map((group) => (
          <div key={group.no} style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <StGroupHead
              $over={overGroup === group.no}
              onDragOver={(e) => {
                e.preventDefault();
                setOverGroup(group.no);
              }}
              onDragLeave={() => setOverGroup(null)}
              onDrop={(e) => onDropGroup(e, group.start)}
            >
              <span>
                묶음 {group.no} · 동시에 뛰는 {group.items.length}경기
              </span>
              <span>끌어다 놓으면 이 묶음 맨 앞으로 · ▲▼로도 옮겨요</span>
            </StGroupHead>
            {group.items.map((m, k) => {
              const i = group.start + k;
              const lockedRow = isLocked(m);
              return (
                <StEditMatch
                  key={m.no}
                  $color={MATCH_TYPE_COLOR[m.type]}
                  $dragging={dragIndex === i}
                  $over={overIndex === i && dragIndex !== null && dragIndex !== i}
                  $locked={lockedRow}
                  draggable={!lockedRow}
                  onDragStart={(e) => onDragStart(e, i)}
                  onDragEnd={resetDrag}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOverIndex(i);
                  }}
                  onDragLeave={() => setOverIndex(null)}
                  onDrop={(e) => onDropRow(e, i)}
                >
                  <StDragHandle aria-hidden>{lockedRow ? "🔒" : "⠿"}</StDragHandle>
                  <StEditMeta>
                    {i + 1}번 · {MATCH_TYPE_SHORT[m.type]}
                    {lockedRow ? " · 진행됨" : ""}
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
                  <span style={{ display: "inline-flex", gap: "0.25rem" }}>
                    <StReorderBtn
                      type="button"
                      aria-label="위로"
                      disabled={lockedRow || i === 0 || isLocked(matches[i - 1])}
                      onClick={() => moveTo(i, i - 1)}
                    >
                      ▲
                    </StReorderBtn>
                    <StReorderBtn
                      type="button"
                      aria-label="아래로"
                      disabled={lockedRow || i === matches.length - 1 || isLocked(matches[i + 1])}
                      onClick={() => moveTo(i, i + 1)}
                    >
                      ▼
                    </StReorderBtn>
                  </span>
                </StEditMatch>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}
