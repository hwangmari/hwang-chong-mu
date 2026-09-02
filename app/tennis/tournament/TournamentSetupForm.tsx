"use client";

import { useState } from "react";
import { placeholderTeams } from "./data";
import type { TournamentEvent } from "./types";
import { DEFAULT_RULES } from "../rules";
import {
  StActions,
  StCardHint,
  StFieldName,
  StInput,
  StLabel,
  StNotice,
  StPrimaryBtn,
  StRow,
  StRuleBadge,
  StChipRow,
  StTextarea,
} from "../page.styles";
import { formatDateKey } from "@/utils/date";

type Props = {
  onCreate: (event: Omit<TournamentEvent, "id" | "builtIn">) => Promise<void>;
};

const ROSTER_PLACEHOLDER = `한 줄에 한 명씩 이름만 (쉼표로 이어 써도 돼요)
유태현
조현서
최윤희`;

// 팀 토너먼트(8팀 더블 엘리미네이션) 만들기. 팀 배정은 만든 뒤 화면에서 한다
export default function TournamentSetupForm({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(formatDateKey(new Date()));
  const [startTime, setStartTime] = useState("13:00");
  const [timeTbd, setTimeTbd] = useState(false);
  const [minutesPerMatch, setMinutesPerMatch] = useState(30);
  const [rosterText, setRosterText] = useState("");
  const [beforeNote, setBeforeNote] = useState("");
  const [afterNote, setAfterNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const roster = [...new Set(rosterText.split(/[\r\n,]+/).map((n) => n.trim()).filter(Boolean))];

  async function create() {
    if (!title.trim()) {
      setError("대회 이름을 넣어 주세요.");
      return;
    }
    if (!date) {
      setError("날짜를 넣어 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onCreate({
        kind: "tournament",
        title: title.trim(),
        date,
        startTime,
        timeTbd,
        place: place.trim(),
        minutesPerMatch,
        gamesToWin: 6,
        courts: 4,
        teams: placeholderTeams(),
        roster,
        beforeNote: beforeNote.trim(),
        afterNote: afterNote.trim(),
        rules: DEFAULT_RULES,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "만들지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StCardHint>
        8팀 × 4명 더블 엘리미네이션이에요. 지금은 이름·날짜·장소·참가자 명단만 넣고, 팀 배정은 만든 뒤
        &ldquo;참가 팀 입력하기&rdquo;에서 해요.
      </StCardHint>
      <StChipRow>
        <StRuleBadge $tone="fixed">🔒 8팀 더블 엘리미네이션</StRuleBadge>
        <StRuleBadge $tone="fixed">🔒 순위결정전 (1~8위)</StRuleBadge>
        <StRuleBadge $tone="on">✓ 6게임 선취</StRuleBadge>
        <StRuleBadge $tone="on">✓ 5:5 → 7점 타이브레이크</StRuleBadge>
        <StRuleBadge $tone="on">✓ 4게임마다 페어 교체 A→B→C</StRuleBadge>
        <StRuleBadge $tone="on">✓ 코트 4면 · 빈 코트에서 진행</StRuleBadge>
      </StChipRow>

      <StRow>
        <StLabel>
          <StFieldName>대회 이름</StFieldName>
          <StInput type="text" placeholder="예) 63OPEN 테니스 대회" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} />
        </StLabel>
        <StLabel>
          <StFieldName>장소</StFieldName>
          <StInput type="text" placeholder="예) 아식스테니스장" value={place} maxLength={60} onChange={(e) => setPlace(e.target.value)} />
        </StLabel>
      </StRow>

      <StRow>
        <StLabel>
          <StFieldName>날짜</StFieldName>
          <StInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </StLabel>
        <StLabel>
          <StFieldName>첫 경기 시작 {timeTbd ? "(미정 · 일정표 계산용)" : ""}</StFieldName>
          <StInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </StLabel>
        <StLabel>
          <StFieldName>경기당 시간(분)</StFieldName>
          <StInput
            type="number"
            min={10}
            max={120}
            value={minutesPerMatch}
            onChange={(e) => setMinutesPerMatch(Math.max(10, Math.min(120, Number(e.target.value) || 30)))}
          />
        </StLabel>
      </StRow>
      <StLabel as="div" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input id="tournament-time-tbd" type="checkbox" checked={timeTbd} onChange={(e) => setTimeTbd(e.target.checked)} />
        <label htmlFor="tournament-time-tbd" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
          시간은 아직 미정이에요 (화면에 &ldquo;시간 미정&rdquo;으로 표시)
        </label>
      </StLabel>

      <StRow>
        <StLabel>
          <StFieldName>경기 전 일정 (선택)</StFieldName>
          <StInput type="text" placeholder="예) 12:00~13:00 개회식 · 몸풀기" value={beforeNote} maxLength={80} onChange={(e) => setBeforeNote(e.target.value)} />
        </StLabel>
        <StLabel>
          <StFieldName>경기 후 일정 (선택)</StFieldName>
          <StInput type="text" placeholder="예) 시상식 · 폐회식" value={afterNote} maxLength={80} onChange={(e) => setAfterNote(e.target.value)} />
        </StLabel>
      </StRow>

      <StLabel>
        <StFieldName>참가자 명단 — {roster.length}명 (8팀 × 4명 = 32명이 정원)</StFieldName>
        <StTextarea placeholder={ROSTER_PLACEHOLDER} value={rosterText} onChange={(e) => setRosterText(e.target.value)} />
      </StLabel>

      {error ? <StNotice $tone="error">{error}</StNotice> : null}
      <StActions>
        <StPrimaryBtn type="button" onClick={create} disabled={busy}>
          {busy ? "만드는 중..." : "🏆 토너먼트 만들기"}
        </StPrimaryBtn>
      </StActions>
    </>
  );
}
