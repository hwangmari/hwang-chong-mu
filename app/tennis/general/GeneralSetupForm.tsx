"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_RULES } from "../rules";
import { toClock, toMinutes } from "../format";
import {
  StActions,
  StCardHint,
  StChipRow,
  StFieldName,
  StInput,
  StLabel,
  StNotice,
  StPrimaryBtn,
  StRow,
  StRuleBadge,
  StTextarea,
} from "../page.styles";
import { StSegmentButton, StSegmented } from "@/components/styled/layout.styled";
import { formatDateKey } from "@/utils/date";
import { buildGeneralSchedule, groupCountOf, previewSchedule } from "./generate";
import { parseTeamsText, teamLineErrors, teamsOf } from "./parseTeams";
import {
  FORMAT_HINT,
  FORMAT_LABEL,
  MAX_TEAMS,
  MIN_TEAMS,
  type GeneralEvent,
  type GeneralFormat,
  type GeneralSettings,
  type GeneralTeam,
} from "./types";

type Props = {
  onCreate: (event: Omit<GeneralEvent, "id" | "builtIn">) => Promise<void>;
};

const TEAMS_PLACEHOLDER = `한 줄에 한 팀: 팀이름 / 선수1 · 선수2   (선수 이름은 나중에 채워도 돼요)
번개파 / 김민준 · 이서연
구름클럽 / 박도윤 · 최하은
바람팀`;

// 팀 순서를 섞는다 (섞은 순서가 곧 시드가 된다)
function shuffleTeams(teams: GeneralTeam[]): GeneralTeam[] {
  const arr = [...teams];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((t, i) => ({ ...t, id: `t${i + 1}`, seed: i + 1 }));
}

// 일반 대회(2인 복식 팀) 만들기. 팀 목록과 진행 방식을 넣으면 대진을 그 자리에서 짠다
export default function GeneralSetupForm({ onCreate }: Props) {
  const [title, setTitle] = useState("");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState(formatDateKey(new Date()));
  const [startTime, setStartTime] = useState("13:00");
  const [timeTbd, setTimeTbd] = useState(false);
  const [minutesPerMatch, setMinutesPerMatch] = useState(30);
  const [courts, setCourts] = useState(2);
  const [format, setFormat] = useState<GeneralFormat>("groups");
  const [thirdPlace, setThirdPlace] = useState(true);
  const [shuffled, setShuffled] = useState(false);
  const [groupBy, setGroupBy] = useState<"size" | "count">("size");
  const [groupSize, setGroupSize] = useState(4);
  const [groupCount, setGroupCount] = useState(2);
  const [advancePerGroup, setAdvancePerGroup] = useState<1 | 2>(2);
  const [teamsText, setTeamsText] = useState("");
  const [beforeNote, setBeforeNote] = useState("");
  const [afterNote, setAfterNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const lines = useMemo(() => parseTeamsText(teamsText), [teamsText]);
  const teams = useMemo(() => teamsOf(lines), [lines]);
  const lineErrors = teamLineErrors(lines);

  const settings: GeneralSettings = useMemo(
    () => ({
      format,
      gamesToWin: 6,
      useTiebreak: true,
      thirdPlace: format === "league" ? false : thirdPlace,
      shuffled,
      groupBy,
      groupSize,
      groupCount,
      advancePerGroup,
      timeTbd,
      beforeNote: beforeNote.trim(),
    }),
    [format, thirdPlace, shuffled, groupBy, groupSize, groupCount, advancePerGroup, timeTbd, beforeNote],
  );

  const min = MIN_TEAMS[format];
  const max = MAX_TEAMS[format];
  const countOk = teams.length >= min && teams.length <= max;
  const preview = useMemo(
    () => (countOk ? previewSchedule(teams.length, settings, courts) : null),
    [countOk, teams.length, settings, courts],
  );
  const endTime = preview ? toClock(toMinutes(startTime) + preview.blocks * minutesPerMatch) : "";

  // 입력을 고치면 이전 오류 문구는 바로 지운다 (고친 뒤에도 "2팀이에요"가 남아 보이던 문제)
  useEffect(() => {
    setError("");
  }, [title, date, courts, format, teams.length, settings, lineErrors.length]);

  function validate(): string {
    if (!title.trim()) return "대회 이름을 넣어 주세요.";
    if (!date) return "날짜를 넣어 주세요.";
    if (courts < 1 || courts > 4) return "코트는 1~4면까지 고를 수 있어요.";
    if (lineErrors.length > 0) return lineErrors[0];
    if (format === "groups" && teams.length < min)
      return `조별 리그는 ${min}팀부터 할 수 있어요. 지금은 ${teams.length}팀이에요. 팀을 더 넣거나 진행 방식을 바꿔 주세요.`;
    if (teams.length < min) return `팀을 ${min}팀 이상 넣어 주세요. 지금은 ${teams.length}팀이에요.`;
    if (format === "league" && teams.length > max)
      return `풀리그는 ${max}팀까지예요. 지금은 ${teams.length}팀이라 경기가 너무 많아져요. 조별 리그로 바꾸면 다 넣을 수 있어요.`;
    if (teams.length > max) return `${FORMAT_LABEL[format]}는 ${max}팀까지 넣을 수 있어요. 지금은 ${teams.length}팀이에요.`;
    if (format === "groups") {
      const count = groupCountOf(teams.length, settings);
      const smallest = Math.floor(teams.length / count);
      if (smallest < advancePerGroup + 1)
        return `한 조에서 ${advancePerGroup}팀이 올라가려면 한 조가 ${advancePerGroup + 1}팀 이상이어야 해요. 조 인원을 늘리거나 진출 팀을 1팀으로 바꿔 주세요.`;
    }
    return "";
  }

  async function create() {
    const message = validate();
    setError(message);
    if (message) return;
    setBusy(true);
    try {
      const entries = shuffled ? shuffleTeams(teams) : teams;
      const { matches, groups } = buildGeneralSchedule(entries, settings, courts);
      await onCreate({
        kind: "general",
        title: title.trim(),
        date,
        startTime,
        place: place.trim(),
        courts,
        minutesPerMatch,
        afterNote: afterNote.trim(),
        teams: entries,
        matches,
        groups,
        knockoutBuilt: false,
        settings,
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
        두 명이 한 팀이 되어 팀끼리 붙어요. 팀 목록과 진행 방식만 고르면 대진과 시간표를 그 자리에서 짜 드려요.
      </StCardHint>
      <StChipRow>
        <StRuleBadge $tone="fixed">🔒 2인 복식 팀</StRuleBadge>
        <StRuleBadge $tone="on">✓ 6게임 선취</StRuleBadge>
        <StRuleBadge $tone="on">✓ 5:5 → 7점 타이브레이크</StRuleBadge>
        <StRuleBadge $tone="on">✓ 코트 {courts}면</StRuleBadge>
      </StChipRow>

      <StRow>
        <StLabel>
          <StFieldName>대회 이름</StFieldName>
          <StInput
            type="text"
            placeholder="예) 가을 클럽 대회"
            value={title}
            maxLength={60}
            onChange={(e) => setTitle(e.target.value)}
          />
        </StLabel>
        <StLabel>
          <StFieldName>장소</StFieldName>
          <StInput
            type="text"
            placeholder="예) 시민공원 테니스장"
            value={place}
            maxLength={60}
            onChange={(e) => setPlace(e.target.value)}
          />
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
        <StLabel>
          <StFieldName>코트 수 (1~4면)</StFieldName>
          <StInput
            type="number"
            min={1}
            max={4}
            value={courts}
            onChange={(e) => setCourts(Math.max(1, Math.min(4, Number(e.target.value) || 2)))}
          />
        </StLabel>
      </StRow>

      <StLabel as="div" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input id="general-time-tbd" type="checkbox" checked={timeTbd} onChange={(e) => setTimeTbd(e.target.checked)} />
        <label htmlFor="general-time-tbd" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
          시간은 아직 미정이에요 (화면에 &ldquo;시간 미정&rdquo;으로 표시)
        </label>
      </StLabel>

      <StLabel as="div">
        <StFieldName>진행 방식</StFieldName>
        <StSegmented role="group" aria-label="진행 방식">
          {(["groups", "league", "knockout"] as GeneralFormat[]).map((f) => (
            <StSegmentButton key={f} type="button" $active={format === f} onClick={() => setFormat(f)}>
              {FORMAT_LABEL[f]}
            </StSegmentButton>
          ))}
        </StSegmented>
        <StCardHint>{FORMAT_HINT[format]}</StCardHint>
      </StLabel>

      {format === "groups" ? (
        <>
          <StRow>
            <StLabel as="div">
              <StFieldName>조 나누기</StFieldName>
              <StSegmented role="group" aria-label="조 나누기">
                <StSegmentButton type="button" $active={groupBy === "size"} onClick={() => setGroupBy("size")}>
                  한 조 인원
                </StSegmentButton>
                <StSegmentButton type="button" $active={groupBy === "count"} onClick={() => setGroupBy("count")}>
                  조 개수
                </StSegmentButton>
              </StSegmented>
            </StLabel>
            <StLabel>
              <StFieldName>{groupBy === "size" ? "한 조 인원 (3~5팀)" : "조 개수 (2~8조)"}</StFieldName>
              {groupBy === "size" ? (
                <StInput
                  type="number"
                  min={3}
                  max={5}
                  value={groupSize}
                  onChange={(e) => setGroupSize(Math.max(3, Math.min(5, Number(e.target.value) || 4)))}
                />
              ) : (
                <StInput
                  type="number"
                  min={2}
                  max={8}
                  value={groupCount}
                  onChange={(e) => setGroupCount(Math.max(2, Math.min(8, Number(e.target.value) || 2)))}
                />
              )}
            </StLabel>
            <StLabel as="div">
              <StFieldName>조별 진출 팀</StFieldName>
              <StSegmented role="group" aria-label="조별 진출 팀">
                <StSegmentButton type="button" $active={advancePerGroup === 1} onClick={() => setAdvancePerGroup(1)}>
                  1팀
                </StSegmentButton>
                <StSegmentButton type="button" $active={advancePerGroup === 2} onClick={() => setAdvancePerGroup(2)}>
                  2팀
                </StSegmentButton>
              </StSegmented>
            </StLabel>
          </StRow>
          <StLabel as="div" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
            <input
              id="general-third-place"
              type="checkbox"
              checked={thirdPlace}
              onChange={(e) => setThirdPlace(e.target.checked)}
            />
            <label htmlFor="general-third-place" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
              3·4위전도 해요
            </label>
          </StLabel>
        </>
      ) : null}

      {format === "knockout" ? (
        <StLabel as="div" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
          <input
            id="general-third-place-ko"
            type="checkbox"
            checked={thirdPlace}
            onChange={(e) => setThirdPlace(e.target.checked)}
          />
          <label htmlFor="general-third-place-ko" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
            3·4위전도 해요
          </label>
        </StLabel>
      ) : null}

      {/* 섞기는 세 방식 모두에 영향을 준다 (토너먼트는 대진 자리, 조별은 조 배정, 풀리그는 경기 순서) */}
      <StLabel as="div" style={{ flexDirection: "row", alignItems: "center", gap: "0.5rem" }}>
        <input
          id="general-shuffle"
          type="checkbox"
          checked={shuffled}
          onChange={(e) => setShuffled(e.target.checked)}
        />
        <label htmlFor="general-shuffle" style={{ fontSize: "0.85rem", fontWeight: 700 }}>
          팀 순서를 섞어서 대진을 짤게요 (안 섞으면 적은 순서가 시드예요)
        </label>
      </StLabel>

      <StRow>
        <StLabel>
          <StFieldName>경기 전 일정 (선택)</StFieldName>
          <StInput
            type="text"
            placeholder="예) 12:30 모여서 몸풀기"
            value={beforeNote}
            maxLength={80}
            onChange={(e) => setBeforeNote(e.target.value)}
          />
        </StLabel>
        <StLabel>
          <StFieldName>경기 후 일정 (선택)</StFieldName>
          <StInput
            type="text"
            placeholder="예) 시상식 · 뒤풀이"
            value={afterNote}
            maxLength={80}
            onChange={(e) => setAfterNote(e.target.value)}
          />
        </StLabel>
      </StRow>

      <StLabel>
        <StFieldName>
          참가 팀 — {teams.length}팀 ({FORMAT_LABEL[format]}는 {min}~{max}팀)
        </StFieldName>
        <StTextarea
          placeholder={TEAMS_PLACEHOLDER}
          value={teamsText}
          onChange={(e) => setTeamsText(e.target.value)}
        />
      </StLabel>

      <StCardHint>
        {preview ? (
          <>
            {teams.length}팀
            {preview.groupCount > 0 ? ` · ${preview.groupCount}조(${preview.groupSizes.join("·")}팀)` : ""} ·{" "}
            {format === "groups"
              ? `조별 ${preview.groupMatches}경기 + 결선 ${preview.koMatches}경기 = ${preview.total}경기`
              : `${preview.total}경기`}{" "}
            · {preview.blocks}타임 · {timeTbd ? "시간 미정" : `${startTime} 시작 → ${endTime} 예상 종료`}
            {format === "groups" && preview.groupCount % 2 === 1
              ? " · 조가 홀수라 마지막 조 진출 팀은 첫 결선을 건너뛰어요"
              : ""}
          </>
        ) : (
          `팀을 ${min}팀 이상 ${max}팀까지 넣으면 경기 수와 끝나는 시각을 미리 보여드려요.`
        )}
      </StCardHint>
      {lineErrors.length > 0 ? <StCardHint>⚠️ {lineErrors[0]}</StCardHint> : null}

      {error ? <StNotice $tone="error">{error}</StNotice> : null}
      <StActions>
        <StPrimaryBtn type="button" onClick={create} disabled={busy}>
          {busy ? "만드는 중..." : "🏟️ 일반 대회 만들기"}
        </StPrimaryBtn>
      </StActions>
    </>
  );
}
