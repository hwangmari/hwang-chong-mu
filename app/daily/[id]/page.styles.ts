import styled from "styled-components";
import { TREND_COLUMN_WIDTH, TREND_ROW_HEIGHT } from "./helpers";

export const PageContainer = styled.div`
  max-width: 1200px;
  margin: 1.5rem auto 2rem;
  padding: 0 1rem 1rem;
`;

export const LoadingCard = styled.section`
  max-width: 420px;
  margin: 3.5rem auto 0;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.white};
  padding: 1rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 700;
`;

export const LockCard = styled.section`
  max-width: 420px;
  margin: 3.5rem auto 0;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.white};
  padding: 1rem;
`;

export const LockDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
`;

export const NotebookIdText = styled.p`
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.8rem;
  margin-top: 0.35rem;
  word-break: break-all;
`;

export const LockInput = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 8px;
  padding: 0.6rem 0.65rem;
  font-size: 0.95rem;
  outline: none;
`;

export const LockError = styled.p`
  color: ${({ theme }) => theme.colors.rose600};
  font-size: 0.8rem;
  margin-top: 0.45rem;
`;

export const LockActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.8rem;
`;

export const UnlockButton = styled.button`
  border: 1px solid #7ba7ef;
  border-radius: 8px;
  background: #2f6cc7;
  color: ${({ theme }) => theme.colors.white};
  padding: 0.45rem 0.7rem;
  font-size: 0.85rem;
  font-weight: 700;
`;

export const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

export const Subtitle = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  margin-top: 0.25rem;
  font-size: 0.95rem;
`;

export const SummaryCard = styled.div`
  min-width: 170px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.white};
  padding: 0.75rem 0.9rem;
`;

export const SummaryTitle = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.8rem;
`;

export const SummaryValue = styled.strong<{ $color: string }>`
  color: ${({ $color }) => $color};
`;

export const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
`;

export const OpenSettingsButton = styled.button<{ $color: string }>`
  border-radius: 10px;
  border: 1px solid ${({ $color }) => `${$color}88`};
  background: ${({ $color }) => `${$color}18`};
  color: ${({ $color }) => $color};
  padding: 0.5rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 700;
`;

export const MonthNavBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.8rem;
`;

export const MonthNavButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray700};
  background: ${({ theme }) => theme.colors.white};
`;

export const MonthText = styled.strong`
  margin: 0 0.25rem;
  font-size: 0.92rem;
  color: ${({ theme }) => theme.colors.gray800};
`;

export const CurrentMonthButton = styled.button<{ $color: string }>`
  margin-left: auto;
  border-radius: 8px;
  border: 1px solid ${({ $color }) => `${$color}88`};
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}18`};
  padding: 0.45rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 700;

  &:disabled {
    opacity: 0.45;
  }
`;

export const AccessHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
`;

export const AccessTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray700};
`;

export const AccessStatus = styled.span<{ $locked: boolean }>`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ $locked, theme }) => ($locked ? theme.colors.blue600 : theme.colors.gray500)};
  background: ${({ $locked, theme }) => ($locked ? theme.colors.blue50 : theme.colors.gray100)};
  border-radius: 9999px;
  padding: 0.2rem 0.45rem;
`;

export const AccessInput = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 8px;
  padding: 0.5rem 0.55rem;
  font-size: 0.86rem;
  outline: none;
`;

export const AccessButton = styled.button`
  border-radius: 8px;
  border: 1px solid #7ba7ef;
  background: #2f6cc7;
  color: ${({ theme }) => theme.colors.white};
  padding: 0.45rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
`;

export const AccessNotice = styled.p<{ $type: "success" | "error" | "" }>`
  margin-top: 0.45rem;
  font-size: 0.78rem;
  color: ${({ $type, theme }) => ($type === "error" ? theme.colors.rose600 : theme.colors.green600)};
`;

export const AccessModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 70;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

export const AccessModal = styled.section`
  width: 100%;
  max-width: 920px;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  padding: 0.9rem;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
`;

export const AccessModalTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.35rem;
`;

export const AccessModalDesc = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
  margin-bottom: 0.65rem;
`;

export const SettingsSection = styled.section`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 10px;
  padding: 0.75rem;
  margin-top: 0.7rem;
`;

export const AccessModalActions = styled.div`
  margin-top: 0.65rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
`;

export const AccessModalCancel = styled.button`
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  padding: 0.45rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 600;
`;

export const EditorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.6rem;
  gap: 0.6rem;
`;

export const EditorTitle = styled.h2`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray700};
`;

export const EditorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

export const AddItemButton = styled.button`
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray700};
  padding: 0.35rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
`;

export const SaveChecklistButton = styled.button<{ $color: string }>`
  border-radius: 8px;
  border: 1px solid ${({ $color }) => `${$color}99`};
  background: ${({ $color }) => $color};
  color: ${({ theme }) => theme.colors.white};
  padding: 0.35rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 700;

  &:disabled {
    opacity: 0.5;
  }
`;

export const ChecklistEditGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 0.5rem;
`;

export const ChecklistEditRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.4rem;
`;

export const ChecklistInput = styled.input`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  font-size: 0.85rem;
  outline: none;
`;

export const DeleteItemButton = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  padding: 0.4rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.4;
  }
`;

export const NotebookBoard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray300};
  border-radius: 12px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.white};
`;

export const BoardHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 38%) 1fr ${TREND_COLUMN_WIDTH}px;
  background: ${({ theme }) => theme.colors.gray100};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const LeftHeader = styled.div`
  padding: 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
  border-right: 1px solid ${({ theme }) => theme.colors.gray200};

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
  }
`;

export const MiddleHeader = styled.div`
  padding: 0.75rem;
`;

export const ChecklistHeader = styled.div<{ $count: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(50px, 64px));
  align-items: center;
  gap: 0.5rem;
`;

export const ChecklistLabel = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.78rem;
  font-weight: 700;
`;

export const GraphLabel = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.78rem;
  font-weight: 700;
`;

export const TrendHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: 0.75rem 0.5rem;

  @media (max-width: 900px) {
    display: none;
  }
`;

export const BoardBody = styled.div<{ $rows: number }>`
  display: grid;
  grid-template-columns: minmax(240px, 38%) 1fr ${TREND_COLUMN_WIDTH}px;
  grid-template-rows: repeat(${({ $rows }) => $rows}, ${TREND_ROW_HEIGHT}px);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
`;

export const DiaryCell = styled.div<{
  $row: number;
  $last: boolean;
  $isToday: boolean;
}>`
  grid-column: 1;
  grid-row: ${({ $row }) => $row};
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.7rem 0.75rem;
  border-right: 1px solid ${({ theme }) => theme.colors.gray200};
  border-bottom: ${({ $last }) => ($last ? "none" : "1px dashed #e5e7eb")};
  background: ${({ $isToday }) => ($isToday ? "#f8fff8" : "transparent")};

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
    border-right: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
  }
`;

export const DateLabel = styled.span`
  width: 64px;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  text-align: center;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
`;

export const TodayBadge = styled.span<{ $color: string }>`
  padding: 0.1rem 0.35rem;
  border-radius: 9999px;
  background: ${({ $color }) => $color};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.63rem;
  font-weight: 700;
`;

export const DiaryInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 0.95rem;
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray400};
  }
`;

export const ChecklistCell = styled.div<{
  $row: number;
  $count: number;
  $last: boolean;
  $isToday: boolean;
}>`
  grid-column: 2;
  grid-row: ${({ $row }) => $row};
  display: grid;
  grid-template-columns: repeat(${({ $count }) => $count}, minmax(50px, 64px));
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-bottom: ${({ $last }) => ($last ? "none" : "1px dashed #e5e7eb")};
  background: ${({ $isToday }) => ($isToday ? "#f8fff8" : "transparent")};

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
    grid-template-columns: repeat(${({ $count }) => $count}, minmax(44px, 56px)) minmax(
        52px,
        auto
      );
  }
`;

export const CheckButton = styled.button<{ $checked: boolean; $color: string }>`
  width: 44px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid ${({ $checked, $color, theme }) => ($checked ? $color : theme.colors.gray300)};
  background: ${({ $checked, $color }) => ($checked ? `${$color}22` : "#fff")};
  color: ${({ $checked, $color, theme }) => ($checked ? $color : theme.colors.gray500)};
  font-size: 0.9rem;
  font-weight: 700;
`;

export const MobileScoreText = styled.span`
  display: none;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 700;

  @media (max-width: 900px) {
    display: block;
    text-align: right;
  }
`;

export const BackButton = styled.button`
  margin-top: 0.75rem;
  color: ${({ theme }) => theme.colors.blue600};
  font-weight: 600;
`;

export const TrendCell = styled.div<{ $rows: number }>`
  grid-column: 3;
  grid-row: 1 / span ${({ $rows }) => $rows};
  border-left: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;

  @media (max-width: 900px) {
    display: none;
  }
`;

export const TrendSvg = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`;

export const TrendGridLine = styled.line`
  stroke: ${({ theme }) => theme.colors.gray200};
  stroke-width: 1;
  stroke-dasharray: 4 4;
`;

export const TrendScaleLabel = styled.text`
  fill: ${({ theme }) => theme.colors.gray400};
  font-size: 9px;
  font-weight: 600;
  text-anchor: middle;
`;

export const TrendPath = styled.polyline<{ $color: string }>`
  fill: none;
  stroke: ${({ $color }) => $color};
  stroke-width: 2.5;
  stroke-linejoin: round;
  stroke-linecap: round;
`;

export const TrendPoint = styled.circle<{ $isToday: boolean }>`
  fill: ${({ $isToday, theme }) => ($isToday ? "#0ea5e9" : theme.colors.green500)};
  stroke: ${({ theme }) => theme.colors.white};
  stroke-width: 2;
`;

export const TrendPointLabel = styled.text<{ $isToday: boolean; $color: string }>`
  fill: ${({ $isToday, $color }) => ($isToday ? "#0284c7" : $color)};
  font-size: 9px;
  font-weight: 700;
`;
