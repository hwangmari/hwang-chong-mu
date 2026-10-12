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
  StRosterCell,
  StRosterCellEmpty,
  StRosterCellGender,
  StRosterTable,
  StSeedTag,
  StTableWrap,
  StTeamCard,
  StTeamGrid,
  StTeamName,
  StTeamPlayers,
  StTeamSubName,
  StTextarea,
} from "../page.styles";
import type { RosterPlayer, TeamEntry } from "./types";
import {
  groupRoster,
  parseRosterText,
  rosterEntryLabel,
  rosterSummary,
  rosterToText,
} from "./roster";
import { GENDER_COLOR, GENDER_LABEL } from "../types";

type Props = {
  teams: TeamEntry[];
  roster: RosterPlayer[]; // 참가자 명단 (팀 배정 전 풀)
  locked: boolean; // 경기가 하나라도 시작됐으면 시드 순서는 못 바꾸고 이름만 고친다
  busy: boolean;
  startEditing?: boolean; // 열자마자 편집 상태로
  onSave: (teams: TeamEntry[], roster: RosterPlayer[]) => Promise<void>;
  onClose: () => void;
};

export default function TeamEditor({
  teams,
  roster,
  locked,
  busy,
  startEditing = false,
  onSave,
  onClose,
}: Props) {
  const [editing, setEditing] = useState(startEditing);
  const [draft, setDraft] = useState<TeamEntry[]>(teams);
  const [rosterText, setRosterText] = useState(rosterToText(roster));
  const [showRoster, setShowRoster] = useState(false);
  const [error, setError] = useState("");

  const current = editing ? draft : teams;
  const assigned = new Set(
    current.flatMap((t) => t.players.map((p) => p.name.trim())).filter(Boolean),
  );
  const rosterNow = editing ? parseRosterText(rosterText) : roster;
  const rosterNames = new Set(rosterNow.map((p) => p.name));
  // 팀마다 인원이 다를 수 있다 (63OPEN 7·8팀은 3명) — 고정 "×4명" 대신 실제 배정 수를 센다
  const assignedCount = teams.reduce(
    (sum, t) => sum + t.players.filter((x) => x.name.trim()).length,
    0,
  );
  const unassigned = rosterNow.filter((p) => !assigned.has(p.name));
  const notInRoster = [...assigned].filter((n) => !rosterNames.has(n));

  function patchTeamSub(seed: number, subName: string) {
    setDraft((prev) =>
      prev.map((t) => (t.seed === seed ? { ...t, subName } : t)),
    );
  }
  function patchPlayer(seed: number, playerSeed: number, name: string) {
    setDraft((prev) =>
      prev.map((t) =>
        t.seed === seed
          ? {
              ...t,
              players: t.players.map((p) =>
                p.seed === playerSeed ? { ...p, name } : p,
              ),
            }
          : t,
      ),
    );
  }

  async function save() {
    // 팀 이름은 "1팀~8팀"으로 고정. 구분은 서브 이름으로 한다
    const cleaned = draft.map((t) => {
      const subName = (t.subName ?? "").trim();
      return {
        ...t,
        name: `${t.seed}팀`,
        ...(subName ? { subName } : { subName: undefined }),
        players: t.players.map((p) => ({ ...p, name: p.name.trim() })),
      };
    });
    setError("");
    try {
      await onSave(cleaned, rosterNow);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    }
  }

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>
          👥 참가 팀 · {teams.length}팀 {assignedCount}명
        </StCardTitle>
        <StActions>
          {!editing ? (
            <StGhostBtn
              type="button"
              onClick={() => {
                setDraft(teams);
                setRosterText(rosterToText(roster));
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
        팀 이름(1팀~8팀)은 고정이고, 옆에 서브 이름(선택)을 붙일 수 있어요. 팀
        안의 1~4번은 팀 내 시드로, 페어 A(2+4)·B(1+3)·C(1+2)에 쓰여요.
        {locked
          ? " 경기가 시작돼서 시드 순서는 바꿀 수 없고 이름만 고칠 수 있어요."
          : ""}
      </StCardHint>

      <StCard as="div" style={{ padding: "0.8rem 0.9rem", gap: "0.5rem" }}>
        <StCardHead>
          <StCardTitle>
            📋 참가자 명단 · {rosterNow.length}명 (
            {rosterSummary(rosterNow) || "성별 미입력"} · 팀 배정 안 됨{" "}
            {unassigned.length}명)
          </StCardTitle>
          {!editing ? (
            <StGhostBtn type="button" onClick={() => setShowRoster((v) => !v)}>
              {showRoster ? "배정 대기만 보기" : "전체 명단 보기"}
            </StGhostBtn>
          ) : null}
        </StCardHead>
        {editing ? (
          // 편집 중엔 토글 없이 입력칸을 바로 보여준다 (아래 목록은 입력한 대로 실시간 정리)
          <>
            <StCardHint>
              한 줄에 한 명: <b>이름 성별 구력</b> (예: 김민준 남 3, 이서연 여
              1.5). 성별·구력은 나중에 채워도 되고, 여기 있는 이름은 아래 팀
              칸에서 자동완성으로 떠요.
            </StCardHint>
            <StTextarea
              rows={12}
              value={rosterText}
              onChange={(e) => setRosterText(e.target.value)}
            />
            <RosterList
              players={rosterNow}
              assigned={assigned}
              emptyText="아직 명단이 없어요."
            />
          </>
        ) : showRoster ? (
          <RosterList
            players={rosterNow}
            assigned={assigned}
            emptyText="아직 명단이 없어요."
          />
        ) : (
          <>
            {unassigned.length > 0 ? (
              <RosterList
                players={unassigned}
                assigned={assigned}
                title="배정 대기"
                emptyText=""
              />
            ) : (
              <StCardHint>명단 전원이 팀에 들어갔어요.</StCardHint>
            )}
            {notInRoster.length > 0 ? (
              <StCardHint>
                명단에 없는 이름: {notInRoster.join(", ")}
              </StCardHint>
            ) : null}
          </>
        )}
      </StCard>

      {editing ? (
        <datalist id="tennis-roster-names">
          {rosterNow.map((p) => (
            <option key={p.name} value={p.name} />
          ))}
        </datalist>
      ) : null}

      {/* 볼 때는 표로 — 맨 윗줄이 1팀~8팀, 아래로 팀 내 1~4번이 내려온다 (주인 요청 2026-10-06).
          편집할 때는 칸마다 입력창이 필요해 아래 카드 모양을 그대로 쓴다. */}
      {!editing ? (
        <StTableWrap>
          <StRosterTable>
            <colgroup>
              <col className="slot" />
              {teams.map((team) => (
                <col key={team.seed} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th className="slot" />
                {teams.map((team) => (
                  <th key={team.seed}>
                    <StRosterCell>
                      <StSeedTag>#{team.seed}</StSeedTag> {team.name}
                    </StRosterCell>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((seed) => (
                <tr key={seed}>
                  <td className="slot">{seed}번</td>
                  {teams.map((team) => {
                    const player = team.players.find((p) => p.seed === seed);
                    if (!player?.name) {
                      return (
                        <td key={team.seed}>
                          <StRosterCellEmpty>
                            {team.players.length === 3 ? "3번이 겸함" : "미정"}
                          </StRosterCellEmpty>
                        </td>
                      );
                    }
                    const gender = roster.find(
                      (r) => r.name === player.name,
                    )?.gender;
                    return (
                      <td key={team.seed}>
                        <StRosterCell>
                          {player.name}
                          {gender ? (
                            <StRosterCellGender $color={GENDER_COLOR[gender]}>
                              {GENDER_LABEL[gender]}
                            </StRosterCellGender>
                          ) : null}
                        </StRosterCell>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </StRosterTable>
        </StTableWrap>
      ) : (
        <StTeamGrid>
          {(editing ? draft : teams).map((team) => (
            <StTeamCard key={team.seed}>
              {editing ? (
                <>
                  <StTeamName>
                    <StSeedTag>#{team.seed}</StSeedTag> {team.seed}팀
                  </StTeamName>
                  <StInput
                    type="text"
                    value={team.subName ?? ""}
                    maxLength={20}
                    placeholder="서브 이름 (선택)"
                    onChange={(e) => patchTeamSub(team.seed, e.target.value)}
                  />
                </>
              ) : (
                <StTeamName>
                  <StSeedTag>#{team.seed}</StSeedTag> {team.name}
                  {team.subName ? (
                    <StTeamSubName>{team.subName}</StTeamSubName>
                  ) : null}
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
                      onChange={(e) =>
                        patchPlayer(team.seed, p.seed, e.target.value)
                      }
                    />
                  ) : (
                    <span key={p.seed}>
                      <StSeedTag>{p.seed}</StSeedTag>{" "}
                      {p.name || <em style={{ color: "#9aa3b2" }}>미정</em>}
                    </span>
                  ),
                )}
              </StTeamPlayers>
            </StTeamCard>
          ))}
        </StTeamGrid>
      )}

      {error ? <StNotice $tone="error">{error}</StNotice> : null}
      {editing ? (
        <StActions>
          <StPrimaryBtn type="button" onClick={save} disabled={busy}>
            {busy ? "저장 중..." : "저장"}
          </StPrimaryBtn>
          <StGhostBtn
            type="button"
            onClick={() => setEditing(false)}
            disabled={busy}
          >
            취소
          </StGhostBtn>
        </StActions>
      ) : null}
    </StCard>
  );
}

// 명단을 남 → 여 → 성별 미입력 순으로 묶고, 묶음 안에서는 구력 많은 순 → 가나다순. ✓ = 팀 배정됨
function RosterList({
  players,
  assigned,
  title,
  emptyText,
}: {
  players: RosterPlayer[];
  assigned: Set<string>;
  title?: string;
  emptyText: string;
}) {
  if (players.length === 0)
    return emptyText ? <StCardHint>{emptyText}</StCardHint> : null;
  const groups = groupRoster(players);
  const anyAssigned = players.some((p) => assigned.has(p.name));
  return (
    <StCardHint as="div">
      {title ? (
        <div>{title} · 구력 많은 순 → 가나다순</div>
      ) : (
        <div>
          구력 많은 순 → 가나다순{anyAssigned ? " (✓ = 팀 배정됨)" : ""}
        </div>
      )}
      {groups.map((g) => (
        <div key={g.key}>
          <b>
            {g.label} {g.players.length}명
          </b>
          {" — "}
          {g.players
            .map(
              (p) => `${rosterEntryLabel(p)}${assigned.has(p.name) ? "✓" : ""}`,
            )
            .join(" · ")}
        </div>
      ))}
    </StCardHint>
  );
}
