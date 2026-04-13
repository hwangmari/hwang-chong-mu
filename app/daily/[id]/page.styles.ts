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
  border: 1px solid #d9dce3;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
  text-align: center;
  color: #475569;
  font-weight: 700;
`;

export const LockCard = styled.section`
  max-width: 420px;
  margin: 3.5rem auto 0;
  border: 1px solid #d9dce3;
  border-radius: 12px;
  background: #fff;
  padding: 1rem;
`;

export const LockDescription = styled.p`
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 0.75rem;
`;

export const NotebookIdText = styled.p`
  color: #475569;
  font-size: 0.8rem;
  margin-top: 0.35rem;
  word-break: break-all;
`;

export const LockInput = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.6rem 0.65rem;
  font-size: 0.95rem;
  outline: none;
`;

export const LockError = styled.p`
  color: #dc2626;
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
  color: #fff;
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
  color: #6b7280;
  margin-top: 0.25rem;
  font-size: 0.95rem;
`;

export const SummaryCard = styled.div`
  min-width: 170px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
  padding: 0.75rem 0.9rem;
`;

export const SummaryTitle = styled.p`
  color: #6b7280;
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
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 0.45rem 0.65rem;
  font-size: 0.82rem;
  color: #334155;
  background: #fff;
`;

export const MonthText = styled.strong`
  margin: 0 0.25rem;
  font-size: 0.92rem;
  color: #1f2937;
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
  color: #334155;
`;

export const AccessStatus = styled.span<{ $locked: boolean }>`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ $locked }) => ($locked ? "#2563eb" : "#6b7280")};
  background: ${({ $locked }) => ($locked ? "#eff6ff" : "#f1f5f9")};
  border-radius: 9999px;
  padding: 0.2rem 0.45rem;
`;

export const AccessInput = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.5rem 0.55rem;
  font-size: 0.86rem;
  outline: none;
`;

export const AccessButton = styled.button`
  border-radius: 8px;
  border: 1px solid #7ba7ef;
  background: #2f6cc7;
  color: #fff;
  padding: 0.45rem 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
`;

export const AccessNotice = styled.p<{ $type: "success" | "error" | "" }>`
  margin-top: 0.45rem;
  font-size: 0.78rem;
  color: ${({ $type }) => ($type === "error" ? "#dc2626" : "#16a34a")};
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
  background: #fff;
  border: 1px solid #d9dce3;
  padding: 0.9rem;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
`;

export const AccessModalTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: #111827;
  margin-bottom: 0.35rem;
`;

export const AccessModalDesc = styled.p`
  font-size: 0.85rem;
  color: #6b7280;
  margin-bottom: 0.65rem;
`;

export const SettingsSection = styled.section`
  border: 1px solid #e5e7eb;
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
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
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
  color: #334155;
`;

export const EditorActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
`;

export const AddItemButton = styled.button`
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #334155;
  padding: 0.35rem 0.6rem;
  font-size: 0.78rem;
  font-weight: 600;
`;

export const SaveChecklistButton = styled.button<{ $color: string }>`
  border-radius: 8px;
  border: 1px solid ${({ $color }) => `${$color}99`};
  background: ${({ $color }) => $color};
  color: #fff;
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
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 0.45rem 0.55rem;
  font-size: 0.85rem;
  outline: none;
`;

export const DeleteItemButton = styled.button`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  color: #6b7280;
  padding: 0.4rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;

  &:disabled {
    opacity: 0.4;
  }
`;

export const NotebookBoard = styled.div`
  border: 1px solid #d9dce3;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
`;

export const BoardHeader = styled.div`
  display: grid;
  grid-template-columns: minmax(240px, 38%) 1fr ${TREND_COLUMN_WIDTH}px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const LeftHeader = styled.div`
  padding: 0.75rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: #475569;
  border-right: 1px solid #e5e7eb;

  @media (max-width: 900px) {
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
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
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
`;

export const GraphLabel = styled.div`
  text-align: center;
  color: #475569;
  font-size: 0.78rem;
  font-weight: 700;
`;

export const TrendHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-left: 1px solid #e5e7eb;
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
  border-right: 1px solid #e5e7eb;
  border-bottom: ${({ $last }) => ($last ? "none" : "1px dashed #e5e7eb")};
  background: ${({ $isToday }) => ($isToday ? "#f8fff8" : "transparent")};

  @media (max-width: 900px) {
    grid-column: 1;
    grid-row: auto;
    border-right: none;
    border-bottom: 1px solid #f1f5f9;
  }
`;

export const DateLabel = styled.span`
  width: 64px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #64748b;
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
  color: #fff;
  font-size: 0.63rem;
  font-weight: 700;
`;

export const DiaryInput = styled.input`
  width: 100%;
  border: none;
  background: transparent;
  color: #111827;
  font-size: 0.95rem;
  outline: none;

  &::placeholder {
    color: #9ca3af;
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
  border: 1px solid ${({ $checked, $color }) => ($checked ? $color : "#d1d5db")};
  background: ${({ $checked, $color }) => ($checked ? `${$color}22` : "#fff")};
  color: ${({ $checked, $color }) => ($checked ? $color : "#6b7280")};
  font-size: 0.9rem;
  font-weight: 700;
`;

export const MobileScoreText = styled.span`
  display: none;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 700;

  @media (max-width: 900px) {
    display: block;
    text-align: right;
  }
`;

export const BackButton = styled.button`
  margin-top: 0.75rem;
  color: #2563eb;
  font-weight: 600;
`;

export const TrendCell = styled.div<{ $rows: number }>`
  grid-column: 3;
  grid-row: 1 / span ${({ $rows }) => $rows};
  border-left: 1px solid #e5e7eb;
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
  stroke: #e2e8f0;
  stroke-width: 1;
  stroke-dasharray: 4 4;
`;

export const TrendScaleLabel = styled.text`
  fill: #94a3b8;
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
  fill: ${({ $isToday }) => ($isToday ? "#0ea5e9" : "#22c55e")};
  stroke: #fff;
  stroke-width: 2;
`;

export const TrendPointLabel = styled.text<{ $isToday: boolean; $color: string }>`
  fill: ${({ $isToday, $color }) => ($isToday ? "#0284c7" : $color)};
  font-size: 9px;
  font-weight: 700;
`;
