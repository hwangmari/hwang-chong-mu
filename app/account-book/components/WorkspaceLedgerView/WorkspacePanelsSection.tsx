"use client";

import styled from "styled-components";
import type { PaymentType, ResolvedAccountEntry, ViewMode } from "../../types";
import AccountBookDashboardPanel from "../AccountBookDashboardPanel";
import CalendarPanel from "../CalendarPanel";
import DetailEntriesPanel from "../DetailEntriesPanel";
import TopSummaryControls from "../TopSummaryControls";
import LedgerOverviewSection from "./LedgerOverviewSection";

type EntryAction = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

type Props = {
  viewMode: ViewMode;
  currentMonth: Date;
  currentYear: number;
  currentMonthIndex: number;
  selectedDate: string;
  monthEntries: ResolvedAccountEntry[];
  monthTotals: { income: number; expense: number };
  monthPaymentTotals: { cash: number; card: number; check_card: number };
  cashBalance: number;
  monthAssetTotal: number;
  listMemo: string;
  isListMemoEditing: boolean;
  onChangeListMemo: (value: string) => void;
  onSaveListMemo: () => void;
  onEditListMemo: () => void;
  memberExpenseTotals: Array<[string, number]>;
  monthCategorySummary: Array<[string, number]>;
  onOpenIncomeYearly: () => void;
  onOpenExpenseYearly: () => void;
  onOpenAssetYearly: () => void;
  formatAmount: (value: number) => string;
  boardSummaryCards: Array<{
    id: string;
    label: string;
    amount: number;
    count: number;
    description: string;
  }>;
  selectedLedgerCardId: string | null;
  onSelectLedgerCard: (cardId: string) => void;
  ledgerDetailTitle: string;
  ledgerDetailEntries: ResolvedAccountEntry[];
  ledgerDetailAssetEntries: ResolvedAccountEntry[];
  annualSavingGoal: number;
  monthlySavingGoal: number;
  onChangeAnnualSavingGoal: (value: number) => boolean | Promise<boolean>;
  onChangeMonthlySavingGoal: (value: number) => boolean | Promise<boolean>;
  dashboardRows: Array<{
    monthNumber: number;
    monthLabel: string;
    income: number;
    totalExpense: number;
    fixedExpense: number;
    consumptionExpense: number;
    regularSavings: number;
    netAmount: number;
    actualSavings: number;
    savingsRate: number | null;
    cumulativeSavings: number;
    goalAmount: number;
    achievementRate: number | null;
  }>;
  onSelectBoardMonth: (monthNumber: number) => void;
  calendarDays: Date[];
  daySummary: Record<string, { income: number; expense: number }>;
  toIsoDate: (date: Date) => string;
  onSelectDate: (date: string) => void;
  calendarDetailTitle: string;
  selectedDateEntries: ResolvedAccountEntry[];
  selectedDateAssetEntries: ResolvedAccountEntry[];
  onOpenAdd: () => void;
  onOpenAddForDate: (date: string) => void;
  onEdit: (entry: ResolvedAccountEntry) => void;
  onDelete: (id: string) => void;
  entryActions: (entry: ResolvedAccountEntry) => EntryAction[];
  paymentLabel: (payment: PaymentType) => string;
};

export default function WorkspacePanelsSection({
  viewMode,
  currentMonth,
  currentYear,
  currentMonthIndex,
  selectedDate,
  monthEntries,
  monthTotals,
  monthPaymentTotals,
  cashBalance,
  monthAssetTotal,
  listMemo,
  isListMemoEditing,
  onChangeListMemo,
  onSaveListMemo,
  onEditListMemo,
  memberExpenseTotals,
  monthCategorySummary,
  onOpenIncomeYearly,
  onOpenExpenseYearly,
  onOpenAssetYearly,
  formatAmount,
  boardSummaryCards,
  selectedLedgerCardId,
  onSelectLedgerCard,
  ledgerDetailTitle,
  ledgerDetailEntries,
  ledgerDetailAssetEntries,
  annualSavingGoal,
  monthlySavingGoal,
  onChangeAnnualSavingGoal,
  onChangeMonthlySavingGoal,
  dashboardRows,
  onSelectBoardMonth,
  calendarDays,
  daySummary,
  toIsoDate,
  onSelectDate,
  calendarDetailTitle,
  selectedDateEntries,
  selectedDateAssetEntries,
  onOpenAdd,
  onOpenAddForDate,
  onEdit,
  onDelete,
  entryActions,
  paymentLabel,
}: Props) {
  const hasDetailPanel = viewMode !== "board";
  const isLedgerLayout = viewMode === "ledger";

  return (
    <StCalendarSplit $hasDetailPanel={hasDetailPanel}>
      <StLeftSplitCard>
        {viewMode === "board" ? null : (
          <TopSummaryControls
            viewMode={viewMode === "calendar" ? "calendar" : "ledger"}
            monthTotals={monthTotals}
            monthPaymentTotals={monthPaymentTotals}
            cashBalance={cashBalance}
            monthAssetTotal={monthAssetTotal}
            boardSummaryCards={boardSummaryCards}
            formatAmount={formatAmount}
            selectedLedgerCardId={selectedLedgerCardId}
            onSelectLedgerCard={onSelectLedgerCard}
          />
        )}

        {isLedgerLayout ? (
          <StLeftBody>
            <StLedgerLeftStack>
              <StLedgerMemoCard>
                <StLedgerMemoHeader>
                  <StLedgerMemoTitleWrap>
                    <strong>이번 달 메모</strong>
                    <span>리스트 화면에서만 보는 메모</span>
                  </StLedgerMemoTitleWrap>
                  <StLedgerMemoActionButton
                    type="button"
                    onClick={
                      isListMemoEditing ? onSaveListMemo : onEditListMemo
                    }
                  >
                    {isListMemoEditing ? "저장" : "수정"}
                  </StLedgerMemoActionButton>
                </StLedgerMemoHeader>
                <StLedgerMemoTextarea
                  value={listMemo}
                  onChange={(event) => onChangeListMemo(event.target.value)}
                  readOnly={!isListMemoEditing}
                  placeholder="이번 달 체크할 내용, 예산 메모, 공유 전 확인할 항목을 적어두세요."
                />
              </StLedgerMemoCard>
              <StLedgerOverviewBlock>
                <LedgerOverviewSection
                  currentMonth={currentMonth}
                  monthEntriesCount={monthEntries.length}
                  monthTotals={monthTotals}
                  monthAssetTotal={monthAssetTotal}
                  monthEntries={monthEntries}
                  memberExpenseTotals={memberExpenseTotals}
                  monthCategorySummary={monthCategorySummary}
                  formatAmount={formatAmount}
                />
              </StLedgerOverviewBlock>
            </StLedgerLeftStack>
          </StLeftBody>
        ) : (
          <StLeftBody>
            {viewMode === "board" ? (
              <AccountBookDashboardPanel
                currentYear={currentYear}
                currentMonthIndex={currentMonthIndex}
                annualGoal={annualSavingGoal}
                monthlyGoal={monthlySavingGoal}
                onChangeAnnualGoal={onChangeAnnualSavingGoal}
                onChangeMonthlyGoal={onChangeMonthlySavingGoal}
                dashboardRows={dashboardRows}
                onSelectMonth={onSelectBoardMonth}
                onOpenIncomeYearly={onOpenIncomeYearly}
                onOpenExpenseYearly={onOpenExpenseYearly}
                onOpenAssetYearly={onOpenAssetYearly}
              />
            ) : (
              <CalendarPanel
                currentMonth={currentMonth}
                calendarDays={calendarDays}
                daySummary={daySummary}
                selectedDate={selectedDate}
                toIsoDate={toIsoDate}
                onSelectDate={onSelectDate}
                onOpenAddForDate={onOpenAddForDate}
              />
            )}
          </StLeftBody>
        )}
      </StLeftSplitCard>

      {hasDetailPanel ? (
        <StRightSplitCard>
          {isLedgerLayout ? (
            <StLedgerDetailBlock>
              <DetailEntriesPanel
                title={ledgerDetailTitle}
                entries={ledgerDetailEntries}
                assetEntries={ledgerDetailAssetEntries}
                onOpenAdd={onOpenAdd}
                onEdit={onEdit}
                onDelete={onDelete}
                entryActions={entryActions}
                formatAmount={formatAmount}
                paymentLabel={paymentLabel}
                showDateMeta
              />
            </StLedgerDetailBlock>
          ) : (
            <DetailEntriesPanel
              title={calendarDetailTitle}
              entries={selectedDateEntries}
              assetEntries={selectedDateAssetEntries}
              onOpenAdd={onOpenAdd}
              onEdit={onEdit}
              onDelete={onDelete}
              entryActions={entryActions}
              formatAmount={formatAmount}
              paymentLabel={paymentLabel}
              showSupportDate={false}
            />
          )}
        </StRightSplitCard>
      ) : null}
    </StCalendarSplit>
  );
}

const StCalendarSplit = styled.div<{ $hasDetailPanel: boolean }>`
  height: auto;
  display: grid;
  grid-template-columns: ${({ $hasDetailPanel }) => {
    if (!$hasDetailPanel) return "minmax(0, 1fr)";
    return "minmax(0, 1.35fr) minmax(320px, 0.78fr)";
  }};
  gap: 0.85rem;
  min-height: 0;
  align-items: start;

  @media (max-width: 1080px) {
    display: block;
    height: auto;
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

const StLeftSplitCard = styled.section`
  display: flex;
  flex-direction: column;
  border: 1px solid #dce5f0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  padding: 0.9rem;
`;

const StLedgerMemoCard = styled.section`
  margin-top: 0.75rem;
  border: 1px solid #dce5f0;
  border-radius: 18px;
  background: linear-gradient(180deg, #fcfdff, #f8fbff);
  padding: 0.9rem;
`;

const StLedgerMemoHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
  margin-bottom: 0.6rem;
`;

const StLedgerMemoTitleWrap = styled.div`
  display: grid;
  gap: 0.18rem;

  strong {
    font-size: 0.9rem;
    font-weight: 900;
    color: #223147;
  }

  span {
    font-size: 0.74rem;
    color: #7a8799;
    font-weight: 700;
  }
`;

const StLedgerMemoActionButton = styled.button`
  flex-shrink: 0;
  border: 1px solid #cad8ee;
  border-radius: 999px;
  background: #ffffff;
  padding: 0.42rem 0.9rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #4f7cff;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    border-color: #b5c8ea;
    background: #f5f8ff;
  }
`;

const StLedgerMemoTextarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  border: 1px solid #dbe4f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 0.85rem 0.9rem;
  resize: vertical;
  font-size: 0.84rem;
  line-height: 1.55;
  color: #334155;
  outline: none;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    background-color 0.18s ease;

  &:read-only {
    background: #f8fbff;
    color: #516074;
    cursor: default;
  }

  &::placeholder {
    color: #99a5b6;
  }

  &:focus {
    border-color: #b9cdf8;
    box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.08);
  }
`;

const StLeftBody = styled.div`
  flex: 1;
  min-height: 0;
  padding-bottom: 1rem;

  @media (max-width: 1080px) {
    padding-bottom: 0;
  }
`;

const StRightSplitCard = styled.section`
  min-height: 0;
  border: 1px solid #dce5f0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  padding: 0.9rem;
  display: flex;
  flex-direction: column;

  @media (max-width: 1080px) {
    margin: 20px 0;
  }
`;

const StLedgerLeftStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StLedgerOverviewBlock = styled.section`
  flex-shrink: 0;
`;

const StLedgerDetailBlock = styled.section`
  flex: 1;
  min-height: 0;
`;
