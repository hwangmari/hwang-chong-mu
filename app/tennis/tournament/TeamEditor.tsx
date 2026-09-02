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
  StSeedTag,
  StTeamCard,
  StTeamGrid,
  StTeamName,
  StTeamPlayers,
  StTextarea,
} from "../page.styles";
import type { TeamEntry } from "./types";

type Props = {
  teams: TeamEntry[];
  roster: string[]; // 참가자 명단 (팀 배정 전 풀)
  locked: boolean; // 경기가 하나라도 시작됐으면 시드 순서는 못 바꾸고 이름만 고친다
  busy: boolean;
  startEditing?: boolean; // 열자마자 편집 상태로
  onSave: (teams: TeamEntry[], roster: string[]) => Promise<void>;
  onClose: () => void;
};

export default function TeamEditor({ teams, roster, locked, busy, startEditing = false, onSave, onClose }: Props) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState<TeamEntry[]>(teams);
  const [rosterText, setRosterText] = useState(roster.join("\n"));
  const [showRoster, setShowRoster] = useState(false);
  const [error, setError] = useState("");

  const current = editing ? draft : teams;
  const assigned = new Set(current.flatMap((t) => t.players.map((p) => p.name.trim())).filter(Boolean));
  const rosterNow = (editing ? rosterText.split(/\r?\n/) : roster).map((n) => n.trim()).filter(Boolean);
  const unassigned = rosterNow.filter((n) => !assigned.has(n));
  const notInRoster = [...assigned].filter((n) => !rosterNow.includes(n));

  function patchTeam(seed: number, name: string) {
    setDraft((prev) => prev.map((t) => (t.seed === seed ? { ...t, name } : t)));
  }
  function patchPlayer(seed: number, playerSeed: number, name: string) {
    setDraft((prev) =>
      prev.map((t) =>
        t.seed === seed
          ? { ...t, players: t.players.map((p) => (p.seed === playerSeed ? { ...p, name } : p)) }
          : t,
      ),
    );
  }

  async function save() {
    const cleaned = draft.map((t) => ({
      ...t,
      name: t.name.trim() || `${t.seed}팀`,
      players: t.players.map((p) => ({ ...p, name: p.name.trim() })),
    }));
    const names = cleaned.map((t) => t.name);
    if (new Set(names).size !== names.length) {
      setError("팀 이름이 겹쳐요.");
      return;
    }
    setError("");
    try {
      await onSave(cleaned, [...new Set(rosterNow)]);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    }
  }

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>👥 참가 팀 · {teams.length}팀 × 4명</StCardTitle>
        <StActions>
          {!editing ? (
            <StGhostBtn
              type="button"
              onClick={() => {
                setDraft(teams);
                setRosterText(roster.join("\n"));
                setEditing(true);
              }}
            >
              ✏️ 편집
            </StGhostBtn>
          ) : null}
          <StGhostBtn type="button" onClick={onClose}>
            닫기
          </StGhostBtn>
        </StActions>
      </StCardHead>
      <StCardHint>
        팀 이름은 마음대로 지어도 돼요 (예: 한화시스템 A, 강남 라켓단). 팀 번호(#1~#8)가 곧 대진표
        시드예요. 팀 안의 1~4번은 팀 내 시드로, 페어 A(2+4)·B(1+3)·C(1+2) 구성에 쓰여요.
        {locked ? " 경기가 시작돼서 시드 순서는 바꿀 수 없고 이름만 고칠 수 있어요." : ""}
      </StCardHint>

      <StCard as="div" style={{ padding: "0.8rem 0.9rem", gap: "0.5rem" }}>
        <StCardHead>
          <StCardTitle>
            📋 참가자 명단 · {rosterNow.length}명 (팀 배정 안 됨 {unassigned.length}명)
          </StCardTitle>
          <StGhostBtn type="button" onClick={() => setShowRoster((v) => !v)}>
            {showRoster ? "접기" : "펼치기"}
          </StGhostBtn>
        </StCardHead>
        {showRoster ? (
          editing ? (
            <>
              <StCardHint>한 줄에 한 명. 여기 있는 이름은 아래 팀 칸에서 자동완성으로 떠요.</StCardHint>
              <StTextarea rows={8} value={rosterText} onChange={(e) => setRosterText(e.target.value)} />
            </>
          ) : (
            <StCardHint>
              {rosterNow.length === 0
                ? "아직 명단이 없어요."
                : rosterNow.map((n) => (assigned.has(n) ? `${n}✓` : n)).join(" · ")}
              {rosterNow.length > 0 ? " (✓ = 팀 배정됨)" : ""}
            </StCardHint>
          )
        ) : (
          <StCardHint>
            {unassigned.length > 0 ? `배정 대기: ${unassigned.join(" · ")}` : "명단 전원이 팀에 들어갔어요."}
            {notInRoster.length > 0 ? ` · 명단에 없는 이름: ${notInRoster.join(", ")}` : ""}
          </StCardHint>
        )}
      </StCard>

      {editing ? (
        <datalist id="tennis-roster-names">
          {rosterNow.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      ) : null}

      <StTeamGrid>
        {(editing ? draft : teams).map((team) => (
          <StTeamCard key={team.seed}>
            {editing ? (
              <StInput
                type="text"
                value={team.name}
                maxLength={20}
                placeholder={`${team.seed}팀 이름 (예: 한화시스템 A)`}
                onChange={(e) => patchTeam(team.seed, e.target.value)}
              />
            ) : (
              <StTeamName>
                <StSeedTag>#{team.seed}</StSeedTag> {team.name}
              </StTeamName>
            )}
            <StTeamPlayers>
              {team.players.map((p) =>
                editing ? (
                  <StInput
                    key={p.seed}
                    type="text"
                    list="tennis-roster-names"
                    value={p.name}
                    maxLength={20}
                    placeholder={`팀 내 시드 ${p.seed}`}
                    onChange={(e) => patchPlayer(team.seed, p.seed, e.target.value)}
                  />
                ) : (
                  <span key={p.seed}>
                    <StSeedTag>{p.seed}</StSeedTag> {p.name || <em style={{ color: "#9aa3b2" }}>미정</em>}
                  </span>
                ),
              )}
            </StTeamPlayers>
          </StTeamCard>
        ))}
      </StTeamGrid>

      {error ? <StNotice $tone="error">{error}</StNotice> : null}
      {editing ? (
        <StActions>
          <StPrimaryBtn type="button" onClick={save} disabled={busy}>
            {busy ? "저장 중..." : "저장"}
          </StPrimaryBtn>
          <StGhostBtn type="button" onClick={() => setEditing(false)} disabled={busy}>
            취소
          </StGhostBtn>
        </StActions>
      ) : null}
    </StCard>
  );
}
