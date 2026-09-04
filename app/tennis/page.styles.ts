import styled, { css, keyframes } from "styled-components";

/* === 진행 중 경기 연출 === */
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.45); }
  70% { box-shadow: 0 0 0 12px rgba(20, 184, 166, 0); }
  100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
`;

const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
`;

const shimmer = keyframes`
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
`;

const flash = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.0); }
  20% { box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.45); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
`;

export const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 1rem 1rem 2.5rem;
`;

export const StHeader = styled.header`
  padding: 0.5rem 0.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
`;

export const StTitle = styled.h1`
  font-size: 1.35rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StSubtitle = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.5;
`;

/* 상단 숫자 요약 (라운드·경기·선수) */
export const StStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.5rem;
`;

export const StStatBox = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
`;

export const StStatValue = styled.span`
  font-size: 1.3rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StStatLabel = styled.span`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StCard = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1.1rem;
  padding: 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

export const StCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
`;

export const StCardTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StCardHint = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  line-height: 1.45;
`;

export const StNotice = styled.p<{ $tone: "info" | "warn" | "error" }>`
  font-size: 0.8rem;
  line-height: 1.5;
  padding: 0.7rem 0.9rem;
  border-radius: 0.8rem;
  font-weight: 600;
  background: ${({ $tone, theme }) =>
    $tone === "error"
      ? theme.colors.rose50
      : $tone === "warn"
        ? "#fff7ed"
        : theme.colors.blue50};
  color: ${({ $tone, theme }) =>
    $tone === "error"
      ? theme.colors.rose600
      : $tone === "warn"
        ? "#c2410c"
        : theme.colors.blue600};
`;

/* 탭 (대진표 / 순위 / 선수별) */
export const StTabRow = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

export const StTab = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) => ($active ? theme.colors.blue500 : theme.colors.gray200)};
  background: ${({ $active, theme }) => ($active ? theme.colors.blue600 : theme.colors.white)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.gray700)};
  font-size: 0.85rem;
  font-weight: 800;
  padding: 0.5rem 0.95rem;
  border-radius: 999px;
  cursor: pointer;
`;

export const StChipRow = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
`;

export const StChip = styled.button<{ $active: boolean; $color: string }>`
  border: 1px solid ${({ $active, $color, theme }) => ($active ? $color : theme.colors.gray200)};
  background: ${({ $active, $color, theme }) => ($active ? $color : theme.colors.white)};
  color: ${({ $active, theme }) => ($active ? theme.colors.white : theme.colors.gray700)};
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  cursor: pointer;

  /* 배지(누를 수 없는 칩)는 흐리지 않게, 못 켜는 규칙 칩만 흐리게 */
  &:disabled {
    cursor: default;
    opacity: ${({ $active }) => ($active ? 1 : 0.45)};
  }
`;

export const StTag = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}14`};
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
`;

/* 라운드 묶음 */
export const StRoundHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray100};
`;

export const StRoundTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StRoundTime = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
`;

export const StMatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

/* 경기 카드 — 상태별로 확실히 다르게: 완료(회색·흐림) / 진행 중(초록) / 시작 가능(파랑) / 대기(흰색) */
export type MatchCardState = "done" | "playing" | "ready" | "waiting";

export const StMatch = styled.article<{ $color: string; $state: MatchCardState }>`
  border: 1px solid
    ${({ $state, theme }) =>
      $state === "playing"
        ? theme.colors.teal500
        : $state === "ready"
          ? theme.colors.blue500
          : theme.colors.gray100};
  border-left: 5px solid
    ${({ $state, $color, theme }) =>
      $state === "playing" ? theme.colors.teal600 : $state === "ready" ? theme.colors.blue600 : $color};
  border-radius: 0.9rem;
  padding: 0.8rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  background: ${({ $state, theme }) =>
    $state === "done"
      ? theme.colors.gray50
      : $state === "playing"
        ? theme.colors.teal50
        : $state === "ready"
          ? theme.colors.blue50
          : theme.colors.white};
  opacity: ${({ $state }) => ($state === "done" ? 0.75 : 1)};
  scroll-margin-top: 5rem;

  &[data-flash="1"] {
    animation: ${flash} 1.6s ease-out 1;
  }

  ${({ $state }) =>
    $state === "playing"
      ? css`
          animation: ${pulseGlow} 2.2s ease-out infinite;
          background-image: linear-gradient(
            120deg,
            rgba(20, 184, 166, 0.08) 0%,
            rgba(20, 184, 166, 0.02) 40%,
            rgba(20, 184, 166, 0.14) 60%,
            rgba(20, 184, 166, 0.02) 100%
          );
          background-size: 200% 100%;
        `
      : ""}
`;

export const StLiveBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.white};
  background: linear-gradient(90deg, #0f766e, #14b8a6, #0f766e);
  background-size: 200% 100%;
  animation: ${shimmer} 2.4s linear infinite;
`;

export const StLiveDot = styled.span`
  width: 0.55rem;
  height: 0.55rem;
  border-radius: 999px;
  background: #ff4d4f;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.25);
  animation: ${blink} 1.1s ease-in-out infinite;
`;

export const StBall = styled.span`
  display: inline-block;
  animation: ${bounce} 0.9s ease-in-out infinite;
`;

export const StElapsed = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.teal600};
`;

export const StElapsedTrack = styled.div`
  width: 100%;
  height: 0.5rem;
  border-radius: 999px;
  background: rgba(20, 184, 166, 0.15);
  overflow: hidden;
`;

export const StElapsedFill = styled.div<{ $ratio: number }>`
  height: 100%;
  width: ${({ $ratio }) => Math.round($ratio * 100)}%;
  border-radius: 999px;
  background: linear-gradient(90deg, #14b8a6, #0ea5e9, #14b8a6);
  background-size: 200% 100%;
  animation: ${shimmer} 1.8s linear infinite;
  transition: width 0.6s ease;
`;

export const StStateBadge = styled.span<{ $state: MatchCardState }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ $state, theme }) =>
    $state === "playing"
      ? theme.colors.teal600
      : $state === "ready"
        ? theme.colors.blue600
        : $state === "done"
          ? theme.colors.gray400
          : theme.colors.gray300};
`;

export const StFinalScore = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1.5rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StPlayedTime = styled.div<{ $known: boolean }>`
  align-self: center;
  font-size: ${({ $known }) => ($known ? "0.95rem" : "0.75rem")};
  font-weight: 900;
  padding: 0.25rem 0.8rem;
  border-radius: 999px;
  color: ${({ $known, theme }) => ($known ? theme.colors.teal600 : theme.colors.gray400)};
  background: ${({ $known, theme }) => ($known ? theme.colors.teal50 : theme.colors.gray100)};
`;

export const StOrderNo = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.7rem;
  height: 1.7rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.8rem;
  font-weight: 900;
`;

export const StCourtPick = styled.button<{ $primary?: boolean }>`
  min-height: 2.5rem;
  border: 1px solid ${({ theme }) => theme.colors.blue600};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.blue600 : theme.colors.white)};
  color: ${({ $primary, theme }) => ($primary ? theme.colors.white : theme.colors.blue600)};
  font-size: 0.85rem;
  font-weight: 900;
  padding: 0 0.9rem;
  border-radius: 0.6rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const StReorderBtn = styled.button`
  width: 2rem;
  height: 2rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray700};
  cursor: pointer;

  &:disabled {
    opacity: 0.3;
    cursor: default;
  }
`;

/* 코트 보드: 코트마다 "지금 → 다음 → 그다음"을 크게 */
export const StCourtBoard = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const StCourtCard = styled.div<{ $live: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.9rem 1rem;
  border-radius: 1rem;
  border: 2px solid ${({ $live, theme }) => ($live ? theme.colors.teal500 : theme.colors.gray200)};
  background: ${({ $live, theme }) => ($live ? theme.colors.teal50 : theme.colors.white)};
  ${({ $live }) =>
    $live
      ? css`
          animation: ${pulseGlow} 2.2s ease-out infinite;
        `
      : ""}
`;

export const StCourtHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const StCourtTitle = styled.span`
  font-size: 1.05rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StCourtSlot = styled.div<{ $kind: "now" | "next" | "later" }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.6rem;
  align-items: center;
  padding: 0.5rem 0.6rem;
  border-radius: 0.7rem;
  background: ${({ $kind, theme }) =>
    $kind === "now" ? theme.colors.white : "transparent"};
  border: 1px dashed
    ${({ $kind, theme }) => ($kind === "now" ? theme.colors.teal500 : theme.colors.gray200)};
  opacity: ${({ $kind }) => ($kind === "later" ? 0.7 : 1)};
  cursor: pointer;
  text-align: left;
  width: 100%;
  font: inherit;
  color: inherit;

  &:hover {
    background: ${({ theme }) => theme.colors.blue50};
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

export const StCourtSlotLabel = styled.span<{ $kind: "now" | "next" | "later" }>`
  font-size: 0.7rem;
  font-weight: 900;
  white-space: nowrap;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ $kind, theme }) =>
    $kind === "now" ? theme.colors.teal600 : $kind === "next" ? theme.colors.blue600 : theme.colors.gray400};
`;

export const StCourtSlotMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;

  b {
    font-size: 0.92rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }

  em {
    font-style: normal;
    font-size: 0.76rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray500};
  }
`;

export const StQueueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;


export const StMatchMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
`;

export const StTeams = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
`;

export const StTeam = styled.div<{ $winner: boolean; $align: "left" | "right" }>`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  align-items: ${({ $align }) => ($align === "left" ? "flex-start" : "flex-end")};
  opacity: ${({ $winner }) => ($winner ? 1 : 0.85)};
`;

export const StTeamLabel = styled.span<{ $color: string }>`
  font-size: 0.68rem;
  font-weight: 900;
  color: ${({ $color }) => $color};
`;

export const StPlayerLine = styled.span<{ $strong: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.9rem;
  font-weight: ${({ $strong }) => ($strong ? 900 : 700)};
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StYears = styled.span`
  font-size: 0.68rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
`;

export const StVs = styled.span`
  font-size: 0.72rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray300};
`;

/* 점수 입력 줄 */
export const StScoreRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

export const StScoreInput = styled.input`
  width: 3.4rem;
  min-height: 2.5rem;
  text-align: center;
  font-size: 1.15rem;
  font-weight: 900;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

export const StScoreColon = styled.span`
  font-size: 1.1rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StSaveBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  border: none;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.82rem;
  font-weight: 800;
  padding: 0 0.9rem;
  border-radius: 0.6rem;
  cursor: pointer;
  white-space: nowrap;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const StGhostBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  background: transparent;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0 0.7rem;
  border-radius: 0.6rem;
  cursor: pointer;
  text-decoration: none; /* 링크(as={Link})로 쓸 때도 버튼처럼 보이게 */
  box-sizing: border-box;

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }
`;

export const StResultBadge = styled.span<{ $tone: "win" | "loss" | "draw" | "todo" }>`
  font-size: 0.7rem;
  font-weight: 900;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  white-space: nowrap;
  color: ${({ $tone, theme }) =>
    $tone === "win"
      ? theme.colors.teal600
      : $tone === "loss"
        ? theme.colors.rose600
        : $tone === "draw"
          ? "#b45309"
          : theme.colors.gray400};
  background: ${({ $tone, theme }) =>
    $tone === "win"
      ? theme.colors.teal50
      : $tone === "loss"
        ? theme.colors.rose50
        : $tone === "draw"
          ? "#fffbeb"
          : theme.colors.gray100};
`;

/* 순위표 */
export const StTableWrap = styled.div`
  overflow-x: auto;
`;

export const StTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84rem;

  th,
  td {
    padding: 0.55rem 0.5rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
    text-align: center;
    white-space: nowrap;
  }

  th {
    font-size: 0.72rem;
    color: ${({ theme }) => theme.colors.gray400};
    font-weight: 800;
  }

  td.name,
  th.name {
    text-align: left;
  }

  td.right,
  th.right {
    text-align: right;
  }

  td.rank {
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }

  td.points {
    font-weight: 900;
    color: ${({ theme }) => theme.colors.blue600};
    font-size: 0.95rem;
  }

  td.muted {
    color: ${({ theme }) => theme.colors.gray400};
  }

  tr.top td {
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

export const StNameCell = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: transparent;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  cursor: pointer;
`;

/* 선수별 일정 */
export const StScheduleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const StScheduleRow = styled.div<{ $color: string }>`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-left: 4px solid ${({ $color }) => $color};
  border-radius: 0.8rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: auto minmax(0, 1fr);
  }
`;

export const StScheduleTime = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
  min-width: 4.5rem;
`;

export const StScheduleMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

export const StScheduleLine = styled.span`
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.gray900};
  font-weight: 700;

  b {
    font-weight: 900;
  }

  em {
    font-style: normal;
    color: ${({ theme }) => theme.colors.gray400};
    font-weight: 600;
    font-size: 0.78rem;
  }
`;

export const StScheduleScore = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};

  @media ${({ theme }) => theme.media.mobile} {
    grid-column: 2;
    justify-self: start;
  }
`;

export const StEmpty = styled.p`
  padding: 1.2rem 0;
  text-align: center;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

/* === 교류전 만들기 폼 === */
export const StRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.6rem;
`;

export const StLabel = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
`;

export const StFieldName = styled.span`
  font-size: 0.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StInput = styled.input`
  width: 100%;
  min-width: 0;
  min-height: 2.6rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.75rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray900};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }

  /* 숫자 칸의 위아래 화살표(스피너) 숨김 — 일반 입력칸처럼 보이게 */
  &[type="number"] {
    -moz-appearance: textfield;
    appearance: textfield;
  }
  &[type="number"]::-webkit-outer-spin-button,
  &[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const StTextarea = styled.textarea`
  width: 100%;
  min-height: 9rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0.6rem 0.75rem;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.gray900};
  resize: vertical;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

export const StSelect = styled.select`
  min-width: 0;
  width: 100%;
  min-height: 2.3rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.4rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
`;

export const StPrimaryBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  border: 1px solid ${({ theme }) => theme.semantic.primary};
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.85rem;
  font-weight: 800;
  padding: 0 1.1rem;
  border-radius: 0.6rem;
  cursor: pointer;
  box-sizing: border-box;

  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

export const StWarnList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding-left: 1rem;
  font-size: 0.8rem;
  line-height: 1.45;

  li.error {
    color: ${({ theme }) => theme.colors.rose600};
    font-weight: 700;
  }

  li.warn {
    color: #b45309;
    font-weight: 600;
  }
`;

/* 편집 중인 경기 한 줄 (드래그 가능) */
export const StEditMatch = styled.div<{ $color: string; $dragging?: boolean; $over?: boolean; $locked?: boolean }>`
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr) auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid ${({ $over, theme }) => ($over ? theme.colors.blue500 : theme.colors.gray100)};
  border-left: 4px solid ${({ $color }) => $color};
  border-radius: 0.8rem;
  background: ${({ $locked, theme }) => ($locked ? theme.colors.gray50 : theme.colors.white)};
  opacity: ${({ $dragging }) => ($dragging ? 0.4 : 1)};
  cursor: ${({ $locked }) => ($locked ? "default" : "grab")};
  transition: border-color 0.15s;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: auto auto minmax(0, 1fr) auto;
  }
`;

export const StDragHandle = styled.span`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray300};
  user-select: none;
  touch-action: none;
`;

export const StGroupHead = styled.div<{ $over?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 0.6rem;
  font-size: 0.78rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray500};
  background: ${({ $over, theme }) => ($over ? theme.colors.blue50 : theme.colors.gray100)};
  border: 1px dashed ${({ $over, theme }) => ($over ? theme.colors.blue500 : "transparent")};
`;

export const StSuggestion = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0.7rem;
  border-radius: 0.7rem;
  background: #fffbeb;
  border: 1px solid #fde68a;
  font-size: 0.8rem;
  font-weight: 700;
  color: #92400e;
`;

export const StEditMeta = styled.span`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray400};
  white-space: nowrap;

  @media ${({ theme }) => theme.media.mobile} {
    grid-column: 1 / -1;
  }
`;

export const StEditTeam = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
`;

/* 교류전 목록 카드 */
export const StEventLink = styled.a`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.9rem;
  text-decoration: none;
  color: inherit;
  background: ${({ theme }) => theme.colors.white};

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

export const StEventTitle = styled.span`
  font-size: 0.95rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StEventMeta = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;
`;

/* 코트별 현황 (지금 진행 중 / 다음 경기) */
export const StCourtStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const StCourtBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 0.9rem;
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue100};
`;

export const StCourtName = styled.span`
  font-size: 0.72rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.blue600};
`;

export const StCourtLine = styled.span`
  font-size: 0.86rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};

  em {
    font-style: normal;
    font-weight: 600;
    font-size: 0.76rem;
    color: ${({ theme }) => theme.colors.gray400};
  }
`;

export const StTiming = styled.span<{ $tone: "done" | "playing" | "shifted" | "plain" }>`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ $tone, theme }) =>
    $tone === "playing"
      ? theme.colors.teal600
      : $tone === "shifted"
        ? "#c2410c"
        : $tone === "done"
          ? theme.colors.gray400
          : theme.colors.gray500};
`;

/* 선수단 한 줄 (보기: 이름 · 구력 · 경기 수 / 편집: 이름 · 성별 · 구력 · 빼기) */
export const StRosterRow = styled.div<{ $view?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $view }) =>
    $view ? "minmax(0, 1fr) auto auto auto" : "minmax(0, 2fr) 4.5rem 4.5rem minmax(0, 1.5fr) auto"};
  align-items: center;
  gap: 0.5rem;
  padding: ${({ $view }) => ($view ? "0.45rem 0.2rem" : "0")};
  border-bottom: ${({ $view, theme }) => ($view ? `1px solid ${theme.colors.gray100}` : "none")};
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.gray900};

  span:not(:first-child) {
    font-size: 0.78rem;
    color: ${({ theme }) => theme.colors.gray400};
    font-weight: 700;
  }
`;

export const StStatButton = styled(StStatBox).attrs({ as: "button", type: "button" })`
  cursor: pointer;
  text-align: left;
  font: inherit;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

/* 규칙 배지: 연한 바탕 + 색 글자 (칩보다 조용하게) */
export const StRuleBadge = styled.span<{ $tone: "fixed" | "on" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.22rem 0.6rem;
  border-radius: 999px;
  color: ${({ $tone, theme }) => ($tone === "fixed" ? theme.colors.gray500 : theme.colors.teal600)};
  background: ${({ $tone, theme }) => ($tone === "fixed" ? theme.colors.gray100 : theme.colors.teal50)};
  border: 1px solid ${({ $tone, theme }) => ($tone === "fixed" ? theme.colors.gray200 : theme.colors.teal100)};
`;

/* === 팀 토너먼트 === */
export const StBlockHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.4rem 0.1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray100};
`;

export const StTeamName = styled.span<{ $muted?: boolean }>`
  font-size: 1rem;
  font-weight: 900;
  color: ${({ $muted, theme }) => ($muted ? theme.colors.gray400 : theme.colors.gray900)};
`;

/* 팀 이름 옆 서브 이름 — 작고 흐리게 */
export const StTeamSubName = styled.span`
  margin-left: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StSeedTag = styled.span`
  display: inline-flex;
  align-items: center;
  font-size: 0.66rem;
  font-weight: 900;
  padding: 0.1rem 0.4rem;
  border-radius: 0.4rem;
  color: ${({ theme }) => theme.colors.white};
  background: ${({ theme }) => theme.colors.gray400};
`;

export const StPairRotation = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.25rem 0.6rem;
  font-size: 0.74rem;
  color: ${({ theme }) => theme.colors.gray500};
  padding: 0.5rem 0.6rem;
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.gray50};

  b {
    color: ${({ theme }) => theme.colors.gray700};
    font-weight: 800;
  }

  span.names {
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 700;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 좁은 폰(360~390px)에선 라벨 열이 넓어 이름이 "시드2…"로 잘렸음.
     라벨은 게임 범위를 아랫줄로 내려 폭을 줄이고, 이름은 자르지 않고 ' · ' 사이에서 줄바꿈 */
  @media ${({ theme }) => theme.media.mobile} {
    gap: 0.3rem 0.45rem;
    align-items: start;

    span.label {
      max-width: 6.5rem;
    }
    span.label em {
      display: block;
      font-size: 0.68rem;
    }
    span.names {
      white-space: normal;
      overflow: visible;
      text-overflow: clip;
      word-break: keep-all;
      line-height: 1.3;
    }
  }
`;

export const StPlacementRow = styled.div<{ $top: boolean }>`
  display: grid;
  grid-template-columns: 3rem minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.6rem 0.8rem;
  border-radius: 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  background: ${({ $top, theme }) => ($top ? "#fffbeb" : theme.colors.white)};
`;

export const StRank = styled.span`
  font-size: 1.1rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

export const StTeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

export const StTeamCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.75rem 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.8rem;
`;

export const StTeamPlayers = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.3rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray700};
`;

/* 대회 방식 안내 본문 */
export const StGuide = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  font-size: 0.88rem;
  line-height: 1.75;
  color: ${({ theme }) => theme.colors.gray700};

  h4 {
    margin-top: 0.8rem;
    padding-bottom: 0.3rem;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
    font-size: 0.95rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }

  ul {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-left: 1.1rem;
  }

  li > table,
  li > div {
    margin: 0.4rem 0;
  }

  b {
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 800;
  }
`;

/* === 토너먼트 대진표 그림 === */
export const StBracketScroll = styled.div`
  overflow-x: auto;
  padding-bottom: 0.5rem;
`;

export const StBracketLane = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1.8rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed ${({ theme }) => theme.colors.gray200};

  &:last-of-type {
    border-bottom: none;
  }
`;

export const StBracketLaneTitle = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 900;
  color: ${({ $color }) => $color};

  em {
    font-style: normal;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray400};
  }
`;

export const StBracketColumns = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, minmax(14rem, 1fr));
  gap: 1.4rem;
  min-width: ${({ $cols }) => $cols * 15.4}rem;
`;

export const StBracketCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

export const StBracketColTitle = styled.div`
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;
  padding: 0.25rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
`;

/* 열 안의 경기 칸들: 세로 가운데에 고르게 */
export const StBracketColBody = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 0.9rem;
`;

export const StNode = styled.div<{ $color: string; $state: "done" | "playing" | "ready" | "waiting" | "hidden" }>`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.6rem;
  border: 1px solid
    ${({ $state, theme }) =>
      $state === "playing" ? theme.colors.teal500 : $state === "ready" ? theme.colors.blue500 : theme.colors.gray200};
  border-left: 4px solid ${({ $color }) => $color};
  background: ${({ $state, theme }) =>
    $state === "done"
      ? theme.colors.gray50
      : $state === "playing"
        ? theme.colors.teal50
        : $state === "ready"
          ? theme.colors.blue50
          : theme.colors.white};
  opacity: ${({ $state }) => ($state === "hidden" ? 0.45 : 1)};
`;

export const StNodeHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
  font-size: 0.66rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray400};
`;

export const StNodeTeam = styled.div<{ $winner: boolean; $empty: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: ${({ $winner }) => ($winner ? 900 : 600)};
  color: ${({ $empty, $winner, theme }) =>
    $empty ? theme.colors.gray400 : $winner ? theme.colors.gray900 : theme.colors.gray500};

  span.name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span.score {
    font-variant-numeric: tabular-nums;
    font-weight: 900;
  }
`;

/* === 대진표 세부 요건 설정 (새 교류전 만들기) === */
export const StDetailPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  margin-top: 0.5rem;
  padding: 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.gray50};
`;

export const StDetailSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  min-width: 0;

  & + & {
    padding-top: 0.85rem;
    border-top: 1px solid ${({ theme }) => theme.colors.gray200};
  }
`;

export const StDetailTitle = styled.h4`
  margin: 0;
  font-size: 0.85rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

/* 숫자 몇 자리만 넣는 좁은 칸 */
export const StMiniInput = styled(StInput)`
  width: 4.5rem;
  min-height: 2.2rem;
  padding: 0 0.5rem;
  font-size: 0.85rem;
`;

/* [선수 A] [관계] [선수 B] [삭제] 한 줄. 좁은 화면에서는 두 줄로 접힌다 */
export const StPairRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 0.35rem;
  align-items: center;
  min-width: 0;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr 1fr;
  }
`;

/* 묶음마다 종목을 고르는 칸들 */
export const StSlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.4rem;
  min-width: 0;
`;

export const StSlotBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
  padding: 0.45rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
`;

export const StSlotLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
`;
