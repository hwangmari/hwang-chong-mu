import styled, { css, type DefaultTheme } from "styled-components";
import {
  StFieldGrid,
  StFieldLabel,
  StSection,
  StSectionTitle,
  StSegmentButton,
  StSegmented,
} from "@/components/styled/layout.styled";
import type { GiftTone } from "./types";

/*
 * 페이지 뼈대(폭·제목·가이드)는 ServiceLayout 이 맡는다.
 * 여기에는 경조사비 장부에만 있는 조각(칩·막대·표·모달)만 둔다.
 *
 * === 테두리 규칙 ===
 * 테두리는 카드(StCard) 한 겹만. 카드 안에서는 배경 띠(semantic.bg)와
 * 가로 실선으로만 나눈다. 입력칸과 "고른 칩"만 예외로 테두리를 갖는다.
 *
 * === 글자 크기 사다리 (이 페이지 전체가 이 표를 따른다) ===
 * 카드 제목      1rem   / 800
 * 필드 라벨      0.78rem/ 700  subText
 * 입력 글자      0.95rem/ 600  (모바일은 1rem — 아이폰 확대 방지)
 * 칩            0.82rem/ 700
 * 목록 이름·금액  0.95rem/ 800
 * 메타 줄        0.78rem/ 700  subText
 * 메모·설명      0.8rem / 400  line-height 1.5
 * 요약 큰 숫자    1.1rem / 800  (캡션 0.78rem)
 * 표 머리        0.78rem subText / 표 칸 0.85rem
 * 금액은 어디서나 tabular-nums (자릿수가 흔들리지 않게)
 */

/* 금액 글자 — 자릿수 폭을 고정한다 */
const numeric = css`
  font-variant-numeric: tabular-nums;
`;

/* 읽는 문장 */
const running = css`
  font-size: 0.8rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.semantic.subText};
`;

/** 색 이름 → 글자 색. 회색은 테마의 보조 글자색을 그대로 쓴다. */
export function toneInk(theme: DefaultTheme, tone: GiftTone) {
  switch (tone) {
    case "rose":
      return theme.colors.rose600;
    case "teal":
      return theme.colors.teal600;
    case "blue":
      return theme.colors.blue600;
    case "indigo":
      return theme.colors.indigo600;
    case "amber":
      return theme.colors.amber600;
    case "orange":
      return theme.colors.orange600;
    case "green":
      return theme.colors.green600;
    default:
      return theme.semantic.subText;
  }
}

/** 색 이름 → 옅은 바탕색 (다크 모드에선 어두운 틴트로 뒤집힌다) */
export function toneBg(theme: DefaultTheme, tone: GiftTone) {
  switch (tone) {
    case "rose":
      return theme.colors.rose50;
    case "teal":
      return theme.colors.teal50;
    case "blue":
      return theme.colors.blue50;
    case "indigo":
      return theme.colors.indigo50;
    case "amber":
      return theme.colors.amber50;
    case "orange":
      return theme.colors.orange50;
    case "green":
      return theme.colors.green50;
    default:
      return theme.semantic.bg;
  }
}

/* 이 장부가 누구 것인지 알려주는 작은 알약 — 소개 문단 첫 줄 */
/* 페이지 탭(입력 | 전체 내역): 상자 대신 글자 + 밑줄. 활성 탭은 진한 글자 + 파란 밑줄이 옆으로 미끄러져 옴 */
export const StPageTabs = styled.div`
  display: flex;
  gap: 0.25rem;
  margin: 0.25rem 0 0.35rem;
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
`;

export const StPageTab = styled.button<{ $active: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.7rem 0.9rem 0.8rem;
  margin-bottom: -1px;
  border: 0;
  background: none;
  font-size: 0.95rem;
  font-weight: ${({ $active }) => ($active ? 800 : 700)};
  color: ${({ $active, theme }) => ($active ? theme.semantic.text : theme.semantic.subText)};
  cursor: pointer;
  transition: color 0.15s ease;

  /* 밑줄: 비활성은 0폭, 활성은 전체 폭 — 왼쪽에서 그어짐 */
  &::after {
    content: "";
    position: absolute;
    left: 0.9rem;
    right: 0.9rem;
    bottom: -1px;
    height: 2px;
    border-radius: 2px;
    background: ${({ theme }) => theme.semantic.primary};
    transform: scaleX(${({ $active }) => ($active ? 1 : 0)});
    transform-origin: left center;
    transition: transform 0.22s cubic-bezier(0.2, 0.7, 0.2, 1);
  }

  &:hover {
    color: ${({ theme }) => theme.semantic.text};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.semantic.primary};
    outline-offset: -2px;
    border-radius: 0.5rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &::after {
      transition: none;
    }
  }

  @media (max-width: 480px) {
    flex: 1;
    justify-content: center;
  }
`;

export const StTabCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.4rem;
  height: 1.3rem;
  padding: 0 0.4rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.semantic.primary};
  background: ${({ theme }) => theme.semantic.primaryLight};
`;

export const StOwnerPill = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.35rem;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.semantic.bg};
  font-size: 0.74rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* === 로그인 유도 === */

export const StLoginCard = styled(StSection)`
  padding: 2rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.6rem;
`;

export const StLoginEmoji = styled.span`
  font-size: 2.6rem;
`;

export const StLoginTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StLoginDesc = styled.p`
  ${running};
  font-size: 0.85rem;
`;

/* === 카드 공통 === */

/* 이 페이지의 카드 한 장 = 공용 StSection. 안쪽 줄 간격만 더한다. */
export const StCard = styled(StSection)`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

/* 한 카드 안에서 실선으로만 나뉘는 하위 구획 (명단 담기 / 가계부에서 가져오기) */
export const StSubSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  & + & {
    margin-top: 0.9rem;
    padding-top: 0.9rem;
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

export const StCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

export const StCardTitle = styled(StSectionTitle)`
  margin-bottom: 0;
`;

export const StCardHint = styled.p`
  ${running};
  font-size: 0.78rem;

  b {
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
`;

export const StEmpty = styled.p`
  ${running};
  font-size: 0.85rem;
  padding: 0.4rem 0;

  b {
    color: ${({ theme }) => theme.semantic.primary};
    font-weight: 800;
  }
`;

export const StError = styled.p`
  color: ${({ theme }) => theme.semantic.danger};
  background: ${({ theme }) => theme.semantic.dangerBg};
  padding: 0.5rem 0.75rem;
  border-radius: 0.6rem;
  font-size: 0.82rem;
  line-height: 1.5;
  font-weight: 700;
`;

/* 표·미리보기 안에서 쓰는 짧은 경고 글자 */
export const StErrorText = styled.span`
  color: ${({ theme }) => theme.semantic.danger};
  font-weight: 700;
`;

/* === 폼 === */

/* 공용 필드 그리드는 560px 카드 기준이라 좁은 칸에서는 한 줄씩 쌓인다.
   이 페이지는 폼이 본문이라 기준만 440px 로 낮춰 쓴다. */
export const StRow = styled(StFieldGrid)`
  gap: 0.9rem 1rem;
  /* 한 줄에 놓인 필드는 아래가 같은 높이에서 끝난다 */
  align-items: stretch;

  @container (min-width: 440px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StLabel = styled.label`
  display: grid;
  gap: 0.45rem;
  align-content: start;
  min-width: 0;
`;

export const StFieldName = styled(StFieldLabel)``;

const control = css`
  width: 100%;
  min-width: 0;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.semantic.text};

  /* 아이폰은 16px 미만 입력칸을 누르면 화면을 확대한다 — 모바일만 16px 유지 */
  @media ${({ theme }) => theme.media.mobile} {
    font-size: 1rem;
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray400};
    font-weight: 500;
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

export const StInput = styled.input`
  ${control};
  ${numeric};
  min-height: 2.75rem;
  padding: 0 0.75rem;
`;

export const StTextarea = styled.textarea`
  ${control};
  padding: 0.6rem 0.75rem;
  font-family: inherit;
  font-weight: 500;
  line-height: 1.5;
  resize: vertical;
`;

export const StChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

/* 고른 칩만 테두리를 갖는다. 안 고른 칩은 회색 바탕뿐 (테두리 줄이기) */
export const StChip = styled.button<{ $active: boolean; $tone?: GiftTone }>`
  border: 1px solid
    ${({ $active, $tone, theme }) =>
      $active ? toneInk(theme, $tone ?? "gray") : "transparent"};
  background: ${({ $active, $tone, theme }) =>
    $active ? toneBg(theme, $tone ?? "gray") : theme.semantic.bg};
  color: ${({ $active, $tone, theme }) =>
    $active ? toneInk(theme, $tone ?? "gray") : theme.semantic.subText};
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  border-radius: 0.55rem;
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color 0.12s ease,
    color 0.12s ease,
    border-color 0.12s ease;

  &:hover:not(:disabled) {
    color: ${({ $active, $tone, theme }) =>
      $active ? toneInk(theme, $tone ?? "gray") : theme.semantic.text};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

// 냈어요 / 받았어요 2칸 토글 — 공용 세그먼트(테두리 하나짜리 트랙)를 그대로 쓴다
export const StSegmentRow = styled(StSegmented)``;

// 고른 쪽만 방향 색(💸 분홍 / 💰 초록)으로 물들인다
export const StSegmentBtn = styled(StSegmentButton)<{ $tone: GiftTone }>`
  min-height: 2.5rem;
  font-size: 0.88rem;
  color: ${({ $active, $tone, theme }) =>
    $active ? toneInk(theme, $tone) : theme.semantic.subText};

  &:hover:not(:disabled) {
    color: ${({ $active, $tone, theme }) =>
      $active ? toneInk(theme, $tone) : theme.semantic.text};
  }
`;

/* 방향 토글 + 관계 칩을 한 줄에 (모바일에선 줄바꿈) */
export const StFilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem 0.75rem;
  flex-wrap: wrap;

  ${StSegmentRow} {
    flex: 0 0 auto;
  }
`;

export const StActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.5rem;
`;

/* 금액처럼 색만 입히는 짧은 글자 */
export const StMoney = styled.span<{ $tone: GiftTone; $strong?: boolean }>`
  ${numeric};
  color: ${({ $tone, theme }) => toneInk(theme, $tone)};
  font-weight: ${({ $strong }) => ($strong ? 800 : 700)};
  white-space: nowrap;
`;

/* === 사람 찾기 === */

export const StNameChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.semantic.primary : "transparent"};
  background: ${({ $active, theme }) =>
    $active ? theme.semantic.primaryLight : theme.semantic.bg};
  color: ${({ $active, theme }) =>
    $active ? theme.semantic.primary : theme.semantic.subText};
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.semantic.text};
  }
`;

/* 카드 안이라 테두리 없이 배경 띠로만 구분한다 (테두리는 카드 한 겹만) */
export const StPersonBox = styled.div`
  background: ${({ theme }) => theme.semantic.bg};
  border-radius: 0.9rem;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const StPersonHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const StPersonName = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const StTag = styled.span<{ $tone: GiftTone }>`
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  background: ${({ $tone, theme }) => toneBg(theme, $tone)};
  color: ${({ $tone, theme }) => toneInk(theme, $tone)};
  white-space: nowrap;
`;

/* 연도 합계는 상자 세 개가 아니라 띠 한 줄 */
export const StTotalsBand = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem 0.75rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

export const StTotalCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

export const StTotalLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StTotalValue = styled.span<{ $tone?: GiftTone }>`
  ${numeric};
  font-size: 1.1rem;

  @media ${({ theme }) => theme.media.mobile} {
    font-size: 0.95rem;
  }

  font-weight: 800;
  line-height: 1.25;
  word-break: keep-all;
  color: ${({ $tone, theme }) =>
    $tone ? toneInk(theme, $tone) : theme.semantic.text};
`;

export const StBadge = styled.span<{ $tone: "good" | "bad" | "neutral" }>`
  ${numeric};
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 0.45rem;
  white-space: nowrap;
  background: ${({ $tone, theme }) =>
    $tone === "good"
      ? theme.semantic.successBg
      : $tone === "bad"
        ? theme.semantic.dangerBg
        : theme.semantic.bg};
  color: ${({ $tone, theme }) =>
    $tone === "good"
      ? theme.semantic.success
      : $tone === "bad"
        ? theme.semantic.danger
        : theme.semantic.subText};
`;

// "지난번 결혼식에 50,000원 냈어요" 즉답 문구
export const StAnswer = styled.p`
  background: ${({ theme }) => theme.semantic.primaryLight};
  color: ${({ theme }) => theme.semantic.text};
  border-radius: 0.75rem;
  padding: 0.7rem 0.85rem;
  font-size: 0.85rem;
  line-height: 1.5;

  b {
    ${numeric};
    color: ${({ theme }) => theme.semantic.primary};
    font-weight: 800;
  }
`;

export const StTimeline = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
`;

export const StTimelineRow = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.semantic.subText};
  flex-wrap: wrap;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }

  time {
    ${numeric};
    font-weight: 700;
  }
`;

export const StAmount = styled.span<{ $tone: GiftTone }>`
  ${numeric};
  margin-left: auto;
  font-size: 0.85rem;
  font-weight: 800;
  color: ${({ $tone, theme }) => toneInk(theme, $tone)};
  white-space: nowrap;
`;

/* 카드 머리에 붙는 보조 버튼 — 테두리 없이 옅은 파란 바탕만 */
export const StGhostBtn = styled.button`
  border: none;
  background: ${({ theme }) => theme.semantic.primaryLight};
  color: ${({ theme }) => theme.semantic.primary};
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  border-radius: 0.6rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.blue100};
  }

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

/* === 요약 (연도·막대) === */

export const StYearSwitch = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
`;

export const StYearBtn = styled.button`
  border: none;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.subText};
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.semantic.text};
  }

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

export const StYearLabel = styled.span`
  ${numeric};
  min-width: 3.4rem;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StBarList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

export const StBarRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

export const StBarHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.semantic.text};

  b {
    font-weight: 700;
  }

  small {
    ${numeric};
    font-size: 0.78rem;
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.subText};
    margin-left: 0.3rem;
  }
`;

export const StBarMeta = styled.span`
  ${numeric};
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  color: ${({ theme }) => theme.semantic.subText};
`;

// 두 방향을 한 트랙에 나눠 그림(왼쪽 냈어요, 오른쪽 받았어요)
export const StBarTrack = styled.div`
  display: flex;
  height: 0.5rem;
  border-radius: 999px;
  overflow: hidden;
  background: ${({ theme }) => theme.semantic.bg};
`;

export const StBarFill = styled.div<{ $pct: number; $tone: GiftTone }>`
  width: ${({ $pct }) => `${$pct}%`};
  background: ${({ $tone, theme }) => toneInk(theme, $tone)};
  transition: width 0.25s;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/* === 전체 내역 === */

/* 장부 줄은 카드 속 카드가 아니라 실선으로 나눈 한 줄씩 */
export const StRecordList = styled.div`
  display: flex;
  flex-direction: column;
`;

/* 기록 한 건 = 줄 하나 + (열었을 때) 그 아래 답례 금액 폼.
   실선은 이 바깥 상자가 그린다 — 폼이 열려도 줄 구분이 흐트러지지 않게. */
export const StRecordItem = styled.div`
  display: flex;
  flex-direction: column;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

export const StRecordRow = styled.div`
  display: grid;
  grid-template-columns: 5.6rem minmax(0, 1fr) auto 4.6rem;
  grid-template-areas: "date main amount actions";
  align-items: start;
  column-gap: 0.75rem;
  padding: 0.7rem 0;

  @media (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr) auto;
    grid-template-areas:
      "date actions"
      "main amount";
    row-gap: 0.2rem;
  }
`;

export const StRecordMain = styled.div`
  grid-area: main;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

/* 날짜 · 종류 · 관계 — 작은 글씨 한 줄 */
export const StRecordMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* 이름 ···· 금액 */
export const StRecordTop = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem 0.5rem;
`;

export const StRecordDate = styled.time`
  ${numeric};
  grid-area: date;
  padding-top: 0.15rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  white-space: nowrap;
`;

export const StRecordName = styled.span`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StRecordAmount = styled.span<{ $tone: GiftTone }>`
  ${numeric};
  grid-area: amount;
  justify-self: end;
  min-width: 7rem;
  padding-top: 0.05rem;
  text-align: right;
  font-size: 0.95rem;
  font-weight: 800;
  white-space: nowrap;
  color: ${({ $tone, theme }) => toneInk(theme, $tone)};
`;

export const StRecordMemo = styled.p`
  ${running};
  white-space: pre-wrap;
`;

export const StRecordActions = styled.div`
  grid-area: actions;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 0.1rem;
  flex-shrink: 0;
`;

/* 목록 오른쪽 글자 버튼 — 테두리 없음 */
const textButton = css`
  border: none;
  background: transparent;
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.4rem;
  border-radius: 0.4rem;
  cursor: pointer;
  white-space: nowrap;
`;

export const StEditBtn = styled.button`
  ${textButton};
  color: ${({ theme }) => theme.semantic.subText};

  &:hover {
    color: ${({ theme }) => theme.semantic.text};
    background: ${({ theme }) => theme.semantic.bg};
  }
`;

export const StDelBtn = styled.button`
  ${textButton};
  color: ${({ theme }) => theme.semantic.danger};

  &:hover {
    background: ${({ theme }) => theme.semantic.dangerBg};
  }
`;

/* === 가계부에서 가져오기 === */

export const StImportList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StImportRow = styled.div<{ $muted?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.7rem 0;
  opacity: ${({ $muted }) => ($muted ? 0.55 : 1)};

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

export const StImportMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};

  time {
    ${numeric};
  }
`;

export const StImportHint = styled.p`
  ${running};
  word-break: break-all;
`;

export const StImportFields = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

export const StSmallInput = styled.input`
  ${control};
  min-height: 2.4rem;
  border-radius: 0.6rem;
  padding: 0 0.65rem;
  font-size: 0.9rem;
`;

export const StPrimarySmallBtn = styled.button`
  min-height: 2.4rem;
  border: none;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0 0.9rem;
  border-radius: 0.6rem;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.45;
    cursor: default;
  }
`;

/* === 전체 내역: 표 보기 === */

export const StTableWrap = styled.div`
  overflow-x: auto;
`;

/* 체크한 여러 명의 관계를 한 번에 바꾸는 줄 */
export const StBulkBar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  margin-bottom: 0.9rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
`;

export const StBulkTitle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StBulkRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: stretch;
  }
`;

/* 세로줄 없이 가로 실선만. 금액은 오른쪽 정렬 + 자릿수 고정.
   열 너비는 내용이 아니라 <colgroup> 이 정한다(table-layout: fixed).
   그래야 묶음마다 따로 그린 표들의 열이 서로 어긋나지 않는다.
   좁은 화면에서는 $minWidth 만큼 유지하고 StTableWrap 안에서 옆으로 스크롤한다. */
export const StTable = styled.table<{ $minWidth?: string }>`
  width: 100%;
  min-width: ${({ $minWidth }) => $minWidth ?? "38rem"};
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.semantic.text};

  th.check,
  td.check {
    padding-right: 0;
  }

  th,
  td {
    padding: 0.5rem 0.55rem;
    border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: middle;
  }

  th {
    font-size: 0.78rem;
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.subText};
  }

  td.amount,
  th.amount {
    ${numeric};
    text-align: right;
  }

  td.amount {
    font-weight: 800;
  }

  td.given {
    color: ${({ theme }) => theme.colors.rose600};
  }

  td.received {
    color: ${({ theme }) => theme.colors.teal600};
  }

  td.memo {
    white-space: normal;
    overflow-wrap: anywhere;
    text-overflow: clip;
    line-height: 1.5;
    color: ${({ theme }) => theme.semantic.subText};
  }

  /* 버튼이 들어가는 칸 — 머리글도 같은 쪽으로 붙여야 줄이 맞는다 */
  th.actions,
  td.actions {
    text-align: right;
  }

  td.actions {
    overflow: visible;
  }

  /* 답례 금액 폼이 통째로 들어가는 칸 — 표의 한 줄 규칙(한 줄·잘라내기)에서 뺀다 */
  td.form {
    white-space: normal;
    overflow: visible;
    padding: 0 0 0.6rem;
  }

  tfoot td {
    ${numeric};
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
    border-bottom: none;
  }
`;

export const StGroupHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.4rem;
`;

export const StGroupTitle = styled.h3`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

export const StGroupMeta = styled.span`
  ${numeric};
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StRowActionBtn = styled.button<{ $tone?: GiftTone }>`
  ${textButton};
  color: ${({ $tone, theme }) =>
    $tone ? toneInk(theme, $tone) : theme.semantic.subText};

  &:hover {
    color: ${({ $tone, theme }) =>
      $tone ? toneInk(theme, $tone) : theme.semantic.text};
    background: ${({ theme }) => theme.semantic.bg};
  }
`;

export const StGhostDangerBtn = styled.button`
  min-height: 2.4rem;
  border: none;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0 0.8rem;
  border-radius: 0.6rem;
  cursor: pointer;
  white-space: nowrap;

  &:hover {
    color: ${({ theme }) => theme.semantic.danger};
    background: ${({ theme }) => theme.semantic.dangerBg};
  }
`;

/* === 답례("냈음") 표시와 금액 적기 === */

/* 받은 기록 줄에 붙는 "냈음" 표시. 금액이 있으면 눌러서 고칠 수 있다.
   카드 안이라 테두리 없이 옅은 바탕만 쓴다. */
export const StReturnedChip = styled.button<{ $tone: GiftTone; $flat?: boolean }>`
  ${numeric};
  border: none;
  background: ${({ $tone, theme }) => toneBg(theme, $tone)};
  color: ${({ $tone, theme }) => toneInk(theme, $tone)};
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  white-space: nowrap;
  cursor: ${({ $flat }) => ($flat ? "default" : "pointer")};
`;

/* "냈음" 칩 + 금액 적기 / 냈음 취소 글자 버튼을 담는 한 줄 */
export const StReturnLine = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  flex-wrap: wrap;
  margin-top: 0.15rem;
`;

/* 줄 아래에 펼쳐지는 금액 입력 띠. 카드 테두리 안이라 배경으로만 구분한다. */
export const StReturnBand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0 0 0.7rem;
  padding: 0.7rem 0.8rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

export const StReturnTitle = styled.div`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};

  span {
    margin-left: 0.35rem;
    font-weight: 500;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;

export const StReturnRow = styled.div`
  display: flex;
  gap: 0.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
  }
`;

export const StReturnField = styled.label`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const StReturnActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.4rem;
`;

/* === 수정 모달 (QuickActionModal과 같은 고정 오버레이 방식) === */

export const StModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.4);
`;

export const StModalBox = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 130;
  width: min(36rem, calc(100vw - 1.5rem));
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  border-radius: 1.25rem;
  box-shadow: 0 18px 40px -12px rgba(23, 43, 77, 0.45);

  /* 안쪽 카드 테두리·아래 여백은 모달 상자에 맡긴다 */
  > div {
    border: none;
    margin-bottom: 0;
  }
`;
