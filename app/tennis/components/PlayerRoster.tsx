"use client";

import { useState } from "react";
import {
  StActions,
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StGhostBtn,
  StInput,
  StNotice,
  StPrimaryBtn,
  StRosterRow,
  StSelect,
  StTag,
} from "../page.styles";
import { GENDER_COLOR, GENDER_LABEL, type Gender, type Match, type Player } from "../types";

type Props = {
  players: Player[];
  matches: Match[];
  editable: boolean; // 화면에서 만든 교류전만 true
  busy: boolean;
  onSave: (players: Player[], matches: Match[]) => Promise<void>;
  onClose: () => void;
};

type Row = { key: number; original: string | null; name: string; gender: Gender; years: string };

function toRows(players: Player[]): Row[] {
  return players.map((p, i) => ({
    key: i,
    original: p.name,
    name: p.name,
    gender: p.gender,
    years: String(p.years),
  }));
}

export default function PlayerRoster({ players, matches, editable, busy, onSave, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [rows, setRows] = useState<Row[]>(() => toRows(players));
  const [error, setError] = useState("");

  const appearances = new Map<string, number>();
  for (const m of matches) for (const n of [...m.teamA, ...m.teamB]) appearances.set(n, (appearances.get(n) ?? 0) + 1);

  function startEdit() {
    setRows(toRows(players));
    setError("");
    setEditing(true);
  }

  function patch(key: number, part: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...part } : r)));
  }

  function addRow() {
    setRows((prev) => [
      ...prev,
      { key: Date.now(), original: null, name: "", gender: "M", years: "0" },
    ]);
  }

  function removeRow(row: Row) {
    if (row.original && (appearances.get(row.original) ?? 0) > 0) {
      setError(`${row.original} 님은 경기에 들어 있어 뺄 수 없어요. 먼저 "대진표 수정"에서 다른 선수로 바꿔 주세요.`);
      return;
    }
    setRows((prev) => prev.filter((r) => r.key !== row.key));
  }

  async function save() {
    setError("");
    const cleaned = rows.map((r) => ({ ...r, name: r.name.trim() }));
    if (cleaned.some((r) => !r.name)) {
      setError("이름이 빈 줄이 있어요.");
      return;
    }
    const names = cleaned.map((r) => r.name);
    if (new Set(names).size !== names.length) {
      setError("같은 이름이 두 번 있어요.");
      return;
    }
    const nextPlayers: Player[] = cleaned.map((r) => ({
      name: r.name,
      gender: r.gender,
      years: Math.max(0, Math.min(60, Number(r.years) || 0)),
    }));
    // 이름을 바꾼 경우 대진표의 이름도 같이 바꾼다
    const rename = new Map<string, string>();
    for (const r of cleaned) if (r.original && r.original !== r.name) rename.set(r.original, r.name);
    const nextMatches: Match[] = matches.map((m) => ({
      ...m,
      teamA: [rename.get(m.teamA[0]) ?? m.teamA[0], rename.get(m.teamA[1]) ?? m.teamA[1]],
      teamB: [rename.get(m.teamB[0]) ?? m.teamB[0], rename.get(m.teamB[1]) ?? m.teamB[1]],
    }));
    // 성별을 바꿨는데 그 선수가 경기에 들어 있으면 성별 규칙이 깨질 수 있다 → 안내만 하고 저장은 허용
    try {
      await onSave(nextPlayers, nextMatches);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    }
  }

  const men = players.filter((p) => p.gender === "M").length;

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>
          👥 선수단 · {players.length}명 (남 {men} · 여 {players.length - men})
        </StCardTitle>
        <StActions>
          {editable && !editing ? (
            <StGhostBtn type="button" onClick={startEdit}>
              ✏️ 편집
            </StGhostBtn>
          ) : null}
          <StGhostBtn type="button" onClick={onClose}>
            닫기
          </StGhostBtn>
        </StActions>
      </StCardHead>

      {!editable ? (
        <StCardHint>이 교류전은 코드에 들어 있는 대진표라 명단을 화면에서 고칠 수 없어요.</StCardHint>
      ) : editing ? (
        <StCardHint>
          이름을 바꾸면 대진표의 이름도 같이 바뀌어요. 새로 넣은 선수는 아직 경기가 없으니
          &ldquo;대진표 수정&rdquo;에서 넣어 주세요. 경기에 들어 있는 선수는 뺄 수 없어요.
        </StCardHint>
      ) : (
        <StCardHint>편집을 누르면 이름·성별·구력을 고치거나 선수를 넣고 뺄 수 있어요.</StCardHint>
      )}

      {editing ? (
        <>
          {rows.map((row) => (
            <StRosterRow key={row.key}>
              <StInput
                type="text"
                placeholder="이름"
                value={row.name}
                maxLength={20}
                onChange={(e) => patch(row.key, { name: e.target.value })}
              />
              <StSelect value={row.gender} onChange={(e) => patch(row.key, { gender: e.target.value as Gender })}>
                <option value="M">남</option>
                <option value="F">여</option>
              </StSelect>
              <StInput
                type="number"
                min={0}
                max={60}
                step={0.5}
                placeholder="구력"
                value={row.years}
                onChange={(e) => patch(row.key, { years: e.target.value })}
              />
              <StGhostBtn type="button" onClick={() => removeRow(row)} disabled={busy}>
                빼기
              </StGhostBtn>
            </StRosterRow>
          ))}
          <StActions>
            <StGhostBtn type="button" onClick={addRow} disabled={busy}>
              ＋ 선수 추가
            </StGhostBtn>
            <StPrimaryBtn type="button" onClick={save} disabled={busy}>
              {busy ? "저장 중..." : "저장"}
            </StPrimaryBtn>
            <StGhostBtn type="button" onClick={() => setEditing(false)} disabled={busy}>
              취소
            </StGhostBtn>
          </StActions>
        </>
      ) : (
        players.map((p) => (
          <StRosterRow key={p.name} $view>
            <span>
              <b>{p.name}</b>{" "}
              <StTag $color={GENDER_COLOR[p.gender]}>{GENDER_LABEL[p.gender]}</StTag>
            </span>
            <span>{p.years}년</span>
            <span>{appearances.get(p.name) ?? 0}경기</span>
          </StRosterRow>
        ))
      )}

      {error ? <StNotice $tone="error">{error}</StNotice> : null}
    </StCard>
  );
}
