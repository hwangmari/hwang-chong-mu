"use client";

import styled, { keyframes } from "styled-components";

/* 여행 방 화면 전용 스타일 (2026-09-16).
   규칙 두 가지만 지킨다.
   1) 테두리는 한 단계에 하나 — 카드가 테두리를 갖고, 안쪽은 여백과 semantic.bg 띠로만 나눈다.
   2) 한 줄에 있는 것은 줄을 맞춘다 — 번호(32px)·분류 칩(96px) 칸의 폭을 고정해,
      이름이 긴 장소가 있어도 옆 줄의 이름 시작 위치가 흔들리지 않게 한다. */

export const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;

  @media ${({ theme }) => theme.media.mobile} {
    gap: 0.75rem;
  }
`;

/* 데스크톱에서만 오른쪽 지도 칸을 화면에 붙여 둔다(왼쪽 목록을 길게 내려도 지도가 따라온다). */
/* 방 화면 바깥 틀: 가계부처럼 폭을 넓게(최대 1280px) 쓴다. 목록과 지도가 나란히 서는 화면이라 1025 캡을 쓰지 않는다 (2026-09-16) */
export const StWideShell = styled.div`
  width: 100%;
  max-width: calc(1280px + 2rem);
  margin: 0 auto;
  padding: 2rem 1rem 2.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    padding: 1rem 1rem 2rem; /* 카드의 휴대폰 규칙(margin 0 -1rem)과 맞춰 좌우가 딱 맞게 */
  }
`;

/* 1024px 이상: 목록 1.5 : 지도 1 두 열. 그보다 좁으면 한 열(지도는 목록 아래) */
export const StColumns = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.25rem;
  align-items: start;

  @media ${({ theme }) => theme.media.desktop} {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 1.5rem;
  }
`;

export const StMainCol = styled.div`
  min-width: 0;
`;

export const StSideCol = styled.div`
  min-width: 0;
`;

export const StStickyPanel = styled.div`
  @media ${({ theme }) => theme.media.desktop} {
    position: sticky;
    top: 4.5rem;
  }
`;

export const StCard = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  /* 휴대폰: 바깥 여백(StContainer 1rem)과 카드 여백이 겹쳐 보이지 않게 화면 끝까지 */
  @media ${({ theme }) => theme.media.mobile} {
    margin: 0 -1rem;
    border-left: none;
    border-right: none;
    border-radius: 0;
    padding: 1rem;
  }
`;

export const StCardTitle = styled.h2`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  display: flex;
  align-items: center;
  gap: 0.375rem;
`;

export const StNotice = styled.p<{ $tone?: "info" | "error" }>`
  font-size: 0.82rem;
  line-height: 1.5;
  font-weight: 600;
  padding: 0.75rem 0.875rem;
  border-radius: 0.75rem;
  background: ${({ $tone, theme }) =>
    $tone === "error" ? theme.semantic.dangerBg : theme.semantic.primaryLight};
  color: ${({ $tone, theme }) =>
    $tone === "error" ? theme.semantic.danger : theme.semantic.primary};
`;

export const StHint = styled.p`
  font-size: 0.86rem;
  line-height: 1.6;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* ===== 머리말 (여행 이름 + 기간 + 공유) ===== */

export const StHeaderCard = styled(StCard)`
  gap: 0.625rem;
`;

export const StHeaderTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

export const StTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
`;

export const StTitleText = styled.h1`
  font-size: 1.375rem;
  font-weight: 900;
  line-height: 1.3;
  color: ${({ theme }) => theme.semantic.text};
  cursor: text;
  border-radius: 0.5rem;
  padding: 0.125rem 0.25rem;
  margin-left: -0.25rem;
  min-width: 0;
  /* 한글 제목이 글자 단위로 쪼개지지 않게 — 낱말에서만 줄이 바뀐다 */
  word-break: keep-all;
  overflow-wrap: anywhere;

  &:hover {
    background: ${({ theme }) => theme.semantic.bg};
  }
`;

/* 제목 고치기 칸 — 보이는 크기는 h1 과 똑같이 두어 글자가 튀지 않게 */
export const StTitleInput = styled.input`
  flex: 1;
  min-width: 0;
  font-size: 1.375rem;
  font-weight: 900;
  line-height: 1.3;
  color: ${({ theme }) => theme.semantic.text};
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.primary};
  border-radius: 0.5rem;
  padding: 0.125rem 0.25rem;

  &:focus {
    outline: none;
  }
`;

export const StHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const StRangeChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.82rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  cursor: pointer;
  align-self: flex-start;

  &:hover {
    color: ${({ theme }) => theme.semantic.text};
  }
`;

/* 글자만 있는 보조 버튼 (바꾸기 / 빼기 / 메모 추가 …) */
export const StGhostBtn = styled.button<{ $tone?: "danger" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  height: 2rem;
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  background: none;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ $tone, theme }) =>
    $tone === "danger" ? theme.semantic.danger : theme.semantic.subText};
  cursor: pointer;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.semantic.bg};
    color: ${({ $tone, theme }) =>
      $tone === "danger" ? theme.semantic.danger : theme.semantic.text};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const StCopiedTag = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.success};
`;

/* ===== 날짜 탭 ===== */

export const StDayTabs = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const StDayTab = styled.button<{ $active: boolean }>`
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  padding: 0.625rem 0.875rem;
  margin-bottom: -1px;
  border: 0;
  background: none;
  text-align: left;
  color: ${({ $active, theme }) =>
    $active ? theme.semantic.text : theme.semantic.subText};
  cursor: pointer;
  transition: color 0.15s ease;

  /* 밑줄: 비활성은 0폭, 활성은 전체 폭 — 왼쪽에서 그어진다 */
  &::after {
    content: "";
    position: absolute;
    left: 0.75rem;
    right: 0.75rem;
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
`;

export const StDayTabTop = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
`;

export const StDayTabDate = styled.span`
  font-size: 0.86rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
`;

export const StDayCount = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.5rem;
  height: 1.25rem;
  padding: 0 0.375rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.semantic.primary};
  background: ${({ theme }) => theme.semantic.primaryLight};
`;

/* ===== 하루 카드 ===== */

export const StDayHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

/* 장소 한 줄. 번호(32px) · 분류(96px) 칸 폭을 고정해 이름이 언제나 같은 x 에서 시작한다. */
export const StRow = styled.div<{ $dragging?: boolean; $over?: boolean }>`
  display: grid;
  grid-template-columns: 2rem 6rem minmax(0, 1fr) auto;
  column-gap: 0.5rem;
  row-gap: 0.375rem;
  align-items: center;
  padding: 0.5rem;
  border-radius: 0.75rem;
  background: ${({ $over, theme }) =>
    $over ? theme.semantic.primaryLight : "transparent"};
  opacity: ${({ $dragging }) => ($dragging ? 0.45 : 1)};
  transition: background-color 0.15s ease;

  /* 줄 사이 구분선은 머리카락 한 줄만 — 줄마다 상자를 두르지 않는다 */
  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 2rem 4.5rem minmax(0, 1fr) auto;
    padding: 0.5rem 0.25rem;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

export const StNumBadge = styled.span`
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.8rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
`;

/* 분류 칩 — 테두리 없이 회색 면만 (선택 상태가 아니므로) */
export const StCategoryChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  height: 1.5rem;
  padding: 0 0.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const StNameBox = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
`;

export const StPlaceName = styled.span`
  font-size: 0.95rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StPlaceAddr = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.semantic.subText};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StRowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-shrink: 0;
`;

export const StDetailLink = styled.a`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.primary};
  padding: 0 0.375rem;
  white-space: nowrap;

  &:hover {
    text-decoration: underline;
  }

  @media ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

/* 끌어 옮기는 손잡이 — 손가락으로는 잡기 어려우므로 휴대폰에서는 숨기고 ▲▼ 만 쓴다 */
export const StDragHandle = styled.span`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray300};
  user-select: none;
  cursor: grab;
  padding: 0 0.25rem;

  @media ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

export const StReorderBtn = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background: none;
  font-size: 0.75rem;
  font-weight: 900;
  color: ${({ theme }) => theme.semantic.subText};
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.semantic.bg};
    color: ${({ theme }) => theme.semantic.text};
  }

  &:disabled {
    opacity: 0.25;
    cursor: not-allowed;
  }
`;

export const StIconBtn = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background: none;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.semantic.dangerBg};
  }
`;

/* 메모 줄 — 이름과 같은 x 에서 시작하도록 3번째 칸부터 */
export const StMemoArea = styled.div`
  grid-column: 3 / -1;
  display: flex;
  align-items: flex-start;
  gap: 0.375rem;
  min-width: 0;
`;

export const StMemoText = styled.span`
  font-size: 0.86rem;
  line-height: 1.5;
  color: ${({ theme }) => theme.semantic.subText};
  white-space: pre-wrap;
  word-break: break-word;
  min-width: 0;
  flex: 0 1 auto;
`;

export const StMemoInput = styled.textarea`
  width: 100%;
  min-height: 2.5rem;
  resize: none;
  overflow: hidden;
  padding: 0.5rem 0.625rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.625rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.86rem;
  line-height: 1.5;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

/* 두 장소 사이의 이동 시간 한 줄 */
export const StTransitLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  padding: 0.125rem 0;
`;

/* ===== 숙소 줄 ===== */

export const StStayBand = styled.div`
  display: grid;
  grid-template-columns: 2rem 6rem minmax(0, 1fr) auto;
  column-gap: 0.5rem;
  row-gap: 0.5rem;
  align-items: center;
  padding: 0.625rem 0.5rem;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.semantic.bg};

  /* 휴대폰에서는 이름이 뭉개지지 않게 두 줄로 — 1줄: 🏨·칩·이름, 2줄: 조작 버튼들 */
  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 2rem 4.5rem minmax(0, 1fr);
    padding: 0.625rem 0.375rem;
    row-gap: 0.25rem;
  }
`;

export const StStayIcon = styled.span`
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
`;

export const StStayQuiet = styled.span`
  font-size: 0.86rem;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StStayActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;

  /* 메모 줄과 같이 이름이 시작하는 칸(3번째)부터 한 줄 아래로 내려 놓는다 */
  @media ${({ theme }) => theme.media.mobile} {
    grid-column: 3 / -1;
    gap: 0.125rem;

    ${StGhostBtn} {
      height: 1.75rem;
      padding: 0 0.4375rem;
    }
  }
`;

export const StStayForm = styled.div`
  grid-column: 1 / -1;
`;

/* 동선에 포함 스위치 */
export const StSwitchLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  cursor: pointer;
  white-space: nowrap;

  input {
    width: 1rem;
    height: 1rem;
    accent-color: ${({ theme }) => theme.semantic.primary};
    cursor: pointer;
  }
`;

/* ===== 장소 추가 폼 ===== */

export const StAddForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
`;

export const StTextInput = styled.input`
  flex: 1 1 10rem;
  min-width: 0;
  height: 2.75rem;
  padding: 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.9rem;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray400};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

export const StSelect = styled.select`
  flex: 0 0 auto;
  height: 2.75rem;
  /* 오른쪽 화살표와 글자가 붙지 않도록 오른쪽 여백을 넉넉히 */
  padding: 0 2rem 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

export const StPrimaryBtn = styled.button`
  flex: 0 0 auto;
  height: 2.75rem;
  padding: 0 1.25rem;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.blue700};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray200};
    color: ${({ theme }) => theme.colors.gray500};
    cursor: not-allowed;
  }
`;

export const StDayTotal = styled.p`
  font-size: 0.86rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  font-variant-numeric: tabular-nums;
`;

/* ===== RoutePanel (이동 시간) =====
   하루 카드 안의 한 칸이다. 상자를 또 두르지 않고 머리카락 한 줄로만 나눈다.
   구간 이름 칸(56px)은 폭을 고정해 "1 → 2"와 "9 → 10"의 오른쪽 글자 시작 위치가 같게 한다. */

export const StRouteCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding-top: 0.75rem;
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
`;

export const StRouteHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

/* 이동 수단 고르기 — 서로 하나만 고르는 칸이라 테두리를 남겨 둔다(조작하는 것이므로) */
/* 오른쪽 조작 묶음 (수단 고르기 + 조회 버튼) */
export const StRouteControls = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const StModeSeg = styled.div`
  display: inline-flex;
  height: 2.25rem;
  padding: 0.125rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.625rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

export const StModeBtn = styled.button<{ $active: boolean }>`
  padding: 0 0.625rem;
  border-radius: 0.5rem;
  background: ${({ $active, theme }) => ($active ? theme.colors.white : "transparent")};
  color: ${({ $active, theme }) =>
    $active ? theme.semantic.text : theme.semantic.subText};
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    color: ${({ theme }) => theme.semantic.text};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

/* 조회 버튼 — 하루 카드 안쪽이라 장소 추가 버튼(2.75rem)보다 한 단계 작게 */
export const StRouteBtn = styled.button`
  height: 2.25rem;
  padding: 0 0.875rem;
  border-radius: 0.625rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.blue700};
  }

  &:disabled {
    background: ${({ theme }) => theme.colors.gray200};
    color: ${({ theme }) => theme.colors.gray500};
    cursor: not-allowed;
  }
`;

export const StLegList = styled.ul`
  display: flex;
  flex-direction: column;
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const StLegRow = styled.li`
  display: grid;
  grid-template-columns: 3.5rem minmax(0, 1fr) auto;
  column-gap: 0.5rem;
  align-items: center;
  padding: 0.375rem 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.semantic.border};
  }
`;

export const StLegLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.subText};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export const StLegMain = styled.span<{ $quiet?: boolean }>`
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ $quiet, theme }) =>
    $quiet ? theme.colors.gray400 : theme.semantic.text};
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StLegSummary = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 11rem;
`;

export const StRouteFoot = styled.p`
  font-size: 0.82rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  font-variant-numeric: tabular-nums;
`;

export const StRouteLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* ===== 오른쪽 동선 칸 ===== */

export const StMapCard = styled(StCard)`
  @media ${({ theme }) => theme.media.desktop} {
    min-height: 480px;
  }
`;

export const StMapBody = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const StMapItem = styled.li<{ $focused: boolean }>`
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  column-gap: 0.5rem;
  align-items: center;
  padding: 0.375rem 0.5rem;
  border-radius: 0.625rem;
  background: ${({ $focused, theme }) =>
    $focused ? theme.semantic.primaryLight : "transparent"};
  cursor: pointer;
  text-align: left;
  width: 100%;
`;

export const StMapItemText = styled.span`
  font-size: 0.86rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const StMapLegend = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding-top: 0.5rem;
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StLegendDot = styled.span<{ $tone: "stay" | "place" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;

  &::before {
    content: "";
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: ${({ $tone, theme }) =>
      $tone === "stay" ? theme.semantic.warning : theme.semantic.primary};
  }
`;

/* ===== 모달 (기간 고치기 / 내보내기) ===== */

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const popIn = keyframes`
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

export const StOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.4);
  animation: ${fadeIn} 0.18s ease-out;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StModal = styled.div<{ $wide?: boolean }>`
  width: 100%;
  max-width: ${({ $wide }) => ($wide ? "32rem" : "22rem")};
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.25rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 20px 40px -12px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  animation: ${popIn} 0.22s cubic-bezier(0.2, 0.7, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const StModalTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
`;

export const StModalFields = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
`;

export const StModalField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

export const StModalLabel = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: ${({ theme }) => theme.semantic.subText};
`;

export const StModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const StModalBtn = styled.button<{ $variant?: "primary" }>`
  flex: 1;
  height: 2.75rem;
  border-radius: 0.75rem;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
  background: ${({ $variant, theme }) =>
    $variant === "primary" ? theme.semantic.primary : theme.semantic.bg};
  color: ${({ $variant, theme }) =>
    $variant === "primary" ? theme.colors.white : theme.semantic.subText};

  &:hover:not(:disabled) {
    background: ${({ $variant, theme }) =>
      $variant === "primary" ? theme.colors.blue700 : theme.colors.gray200};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

export const StExportText = styled.textarea`
  width: 100%;
  min-height: 15rem;
  resize: vertical;
  padding: 0.75rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.semantic.bg};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.82rem;
  line-height: 1.6;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

/* ===== 스켈레톤 자리 ===== */

export const StSkeletonRow = styled.div`
  display: grid;
  grid-template-columns: 2rem 6rem minmax(0, 1fr);
  column-gap: 0.5rem;
  align-items: center;
  padding: 0.5rem;
`;

export const StSkeletonTabs = styled.div`
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.625rem;
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
`;
