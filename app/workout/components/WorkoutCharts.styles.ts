import styled from "styled-components";

export const StWrap = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  padding: 0.95rem 1.05rem 0.85rem;

  @media (max-width: 540px) {
    border: none;
    border-radius: 0;
  }
`;

export const StTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  letter-spacing: -0.01em;
`;

export const StSub = styled.p`
  font-size: 0.68rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 0.1rem;
  margin-bottom: 0.55rem;
`;

export const StEmpty = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
  padding: 1.25rem 0;
  text-align: center;
`;

export const StHeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
`;

export const StTotal = styled.p`
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 0.25rem;
  text-align: right;
  letter-spacing: -0.01em;

  b {
    color: ${({ theme }) => theme.colors.gray800};
    font-weight: 800;
  }
`;

export const StCalendarScroll = styled.div`
  overflow-x: auto;
  padding-bottom: 0.2rem;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray200};
    border-radius: 2px;
  }
`;

export const StLegendRow = styled.div`
  margin-top: 0.55rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

export const StLegendDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
`;

export const StLegendSpacer = styled.div`
  flex: 1;
`;

export const StTypeLegend = styled.div`
  display: flex;
  gap: 0.55rem 0.85rem;
  align-items: center;
  margin-top: 0.5rem;
  font-size: 0.74rem;
  color: ${({ theme }) => theme.colors.gray600};
  flex-wrap: wrap;
`;

export const StTypeLegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-weight: 700;
`;

export const StTypeDot = styled.span<{ $color: string }>`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: inline-block;
`;

export const StTypeCount = styled.span`
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 700;
  margin-left: 0.1rem;
`;

export const StIntervalWrap = styled.div`
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.65rem;
  padding: 0.5rem 0.6rem 0.4rem;
  margin-top: 0.4rem;
`;

export const StIntervalEmpty = styled.p`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;
  padding: 0.6rem 0;
`;

export const StIntervalLegend = styled.div`
  display: flex;
  gap: 0.7rem;
  margin-top: 0.2rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray500};
  flex-wrap: wrap;

  b {
    font-weight: 900;
  }
`;

export const StCalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.6rem;
`;

export const StCalNavGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StCalNav = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
`;

export const StCalNavBtn = styled.button`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
  cursor: pointer;
  padding: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

export const StCalMonth = styled.span`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  letter-spacing: -0.01em;
  padding: 0 0.3rem;
`;

export const StCalTodayBtn = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.35rem 0.7rem;
  border-radius: 0.5rem;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

export const StCalSummary = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem 1.4rem;
  padding-top: 0.75rem;
  margin-bottom: 0.9rem;
  border-top: 1px dashed ${({ theme }) => theme.colors.gray200};

  /* 좁은 화면: N일 운동 윗줄 + 리스트 아랫줄(전체 폭) 영역 확보 */
  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.55rem;
  }
`;

export const StCalSummaryMetrics = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  margin-left: auto;
  gap: 0.5rem 1.5rem;
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.gray500};

  b {
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray600};
  }

  /* 좁은 화면: 우측 정렬 대신 좌측 정렬로 N일 운동과 줄맞춤 */
  @media (max-width: 767px) {
    justify-content: flex-start;
    margin-left: 0;
    width: 100%;
    gap: 0.45rem 1.1rem;
  }
`;

export const StCalSummaryDays = styled.span`
  flex-shrink: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};

  b {
    font-size: 1.05rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
    margin-right: 0.15rem;
  }
`;

export const StCalSummaryBreakdown = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
`;

export const StCalSummaryChip = styled.button<{ $color: string; $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  font-size: 0.74rem;
  font-weight: 800;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.white : theme.colors.gray700};
  background: ${({ $active, $color, theme }) =>
    $active ? $color : theme.colors.white};
  padding: 0.3rem 0.62rem;
  border-radius: 0.5rem;
  border: 1px solid
    ${({ $active, $color, theme }) =>
      $active ? $color : theme.colors.gray200};
  cursor: pointer;
  transition: all 0.12s;
  line-height: 1;

  &:hover {
    border-color: ${({ $color }) => $color};
  }
`;

export const StChipDot = styled.span<{ $color: string; $active: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $active, $color, theme }) =>
    $active ? theme.colors.white : $color};
`;

export const StCalDayHeaderRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

export const StCalDayHeader = styled.div<{ $weekend: boolean }>`
  font-size: 0.68rem;
  font-weight: 800;
  text-align: center;
  padding: 0.35rem 0;
  color: ${({ $weekend, theme }) =>
    $weekend ? theme.colors.gray400 : theme.colors.gray500};
`;

export const StCalGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
`;

export const StCalCell = styled.div<{
  $inMonth: boolean;
  $today: boolean;
  $active: boolean;
  $pinned: boolean;
}>`
  position: relative;
  min-height: 62px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 3px;
  padding: 0.32rem 0.18rem 0.3rem;
  border-radius: 0.55rem;
  background: ${({ $today, $active, $pinned, theme }) =>
    $pinned
      ? theme.colors.blue100
      : $today
        ? theme.colors.blue50
        : $active
          ? theme.colors.gray50
          : "transparent"};
  border: 1px solid
    ${({ $today, $pinned, theme }) =>
      $pinned
        ? theme.colors.blue500
        : $today
          ? theme.colors.blue200
          : "transparent"};
  opacity: ${({ $inMonth }) => ($inMonth ? 1 : 0.35)};
  cursor: ${({ $active }) => ($active ? "pointer" : "default")};
  transition: background 0.1s, border-color 0.1s;
`;

export const StCalDayNum = styled.span<{ $today: boolean }>`
  font-size: 0.72rem;
  font-weight: ${({ $today }) => ($today ? 900 : 700)};
  color: ${({ $today, theme }) =>
    $today ? theme.colors.blue600 : theme.colors.gray700};
  line-height: 1;
`;

export const StCalTags = styled.div`
  margin-top: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  width: 100%;
`;

export const StCalTag = styled.span<{ $kind: "run" | "gym" | "activity" }>`
  display: block;
  max-width: 100%;
  font-size: 0.58rem;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1.35;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ $kind }) =>
    $kind === "run" ? "#1f7a55" : $kind === "gym" ? "#b05a23" : "#4e3dc4"};
  background: ${({ $kind }) =>
    $kind === "run" ? "#e6f4ed" : $kind === "gym" ? "#fce9d8" : "#e9e6fb"};

  @media (max-width: 420px) {
    font-size: 0.52rem;
    padding: 1px 2px;
  }
`;

export const StCalPopover = styled.div<{ $pinned: boolean }>`
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(calc(-50% + var(--shift, 0px)));
  min-width: 180px;
  max-width: 240px;
  padding: 0.6rem 0.75rem;
  background: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  border-radius: 0.65rem;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.28);
  opacity: ${({ $pinned }) => ($pinned ? 1 : 0)};
  pointer-events: ${({ $pinned }) => ($pinned ? "auto" : "none")};
  visibility: ${({ $pinned }) => ($pinned ? "visible" : "hidden")};
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  text-align: left;

  &::after {
    content: "";
    position: absolute;
    top: 100%;
    left: calc(50% - var(--shift, 0px));
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: ${({ theme }) => theme.colors.gray900};
  }
`;

export const StPopoverDate = styled.span`
  font-size: 0.68rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray400};
  letter-spacing: 0.02em;
`;

export const StPopoverLine = styled.div<{ $kind: "run" | "gym" | "activity" }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding-left: 0.5rem;
  border-left: 2px solid
    ${({ $kind }) =>
      $kind === "run" ? "#3aa675" : $kind === "gym" ? "#e07a3a" : "#7c6ae0"};

  b {
    font-size: 0.72rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.white};
    letter-spacing: -0.01em;
  }

  span {
    font-size: 0.68rem;
    color: ${({ theme }) => theme.colors.gray300};
    line-height: 1.4;
    word-break: keep-all;
  }
`;

export const StCalFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-top: 0.65rem;
  padding-top: 0.6rem;
  border-top: 1px dashed ${({ theme }) => theme.colors.gray100};

  /* 모바일에선 우클릭 힌트가 숨겨져 내용이 비므로 푸터 자체를 접음 */
  @media (max-width: 480px) {
    display: none;
  }
`;

export const StCalHint = styled.span`
  font-size: 0.66rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 600;

  @media (max-width: 480px) {
    display: none;
  }
`;

export const StContextMenu = styled.div`
  position: fixed;
  z-index: 100;
  min-width: 140px;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.7rem;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.18);
  padding: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

export const StContextMenuHead = styled.div`
  font-size: 0.66rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray400};
  padding: 0.3rem 0.5rem 0.35rem;
  letter-spacing: 0.01em;
`;

export const StContextMenuItem = styled.button<{
  $kind: "run" | "gym" | "activity";
}>`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  padding: 0.5rem 0.55rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
  cursor: pointer;
  transition: background 0.1s, color 0.1s;

  &:hover {
    background: ${({ $kind }) =>
      $kind === "run" ? "#e6f4ed" : $kind === "gym" ? "#fce9d8" : "#e9e6fb"};
    color: ${({ $kind }) =>
      $kind === "run" ? "#1f7a55" : $kind === "gym" ? "#b05a23" : "#4e3dc4"};
  }
`;

