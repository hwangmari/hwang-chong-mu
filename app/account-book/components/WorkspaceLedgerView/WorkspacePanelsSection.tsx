"use client";

import styled from "styled-components";
import type { PaymentType, ResolvedAccountEntry, ViewMode } from "../../types";
import AccountBookDashboardPanel from "../AccountBookDashboardPanel";
import MonthlyIssueMemo from "../MonthlyIssueMemo";
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
  isShared: boolean;
  currentMonth: Date;
  currentYear: number;
  currentMonthIndex: number;
  selectedDate: string;
  monthEntries: ResolvedAccountEntry[];
  monthTotals: { income: number; expense: number };
  monthPaymentTotals: { cash: number; card: number; check_card: number };
  cashBalance: number;
  monthSettlementTotal: number;
  monthAssetTotal: number;
  selectedCalendarCardId: string | null;
  listMemo: string;
  onChangeListMemo: (value: string) => void;
  onSaveListMemo: () => void | Promise<void>;
  memberExpenseTotals: Array<[string, number]>;
  selectedExpenseMemberName: string | null;
  onSelectExpenseMember: (memberName: string) => void;
  monthCategorySummary: Array<[string, number]>;
  cardCompanySummary: Array<{
    id: string;
    label: string;
    paymentGroup: PaymentType;
    amount: number;
    benefitExcludedAmount: number;
    count: number;
    cardCount: number;
    checkCardCount: number;
    cashCount: number;
  }>;
  selectedCardCompany: string | null;
  onSelectCardCompany: (cardCompany: string) => void;
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
  monthlyBudget: number;
  onChangeAnnualSavingGoal?: (value: number) => boolean | Promise<boolean>;
  onChangeMonthlyBudget?: (value: number) => boolean | Promise<boolean>;
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
  daySummary: Record<
    string,
    { income: number; expense: number; settlement: number }
  >;
  toIsoDate: (date: Date) => string;
  onSelectDate: (date: string) => void;
  calendarDetailTitle: string;
  selectedDateEntries: ResolvedAccountEntry[];
  selectedDateAssetEntries: ResolvedAccountEntry[];
  onOpenAdd: () => void;
  onOpenNaturalAdd?: () => void;
  onOpenNaturalRegisterForDate: (date: string) => void;
  onSelectCalendarCard: (cardId: string) => void;
  onEdit: (entry: ResolvedAccountEntry) => void;
  onCopy?: (entry: ResolvedAccountEntry) => void;
  onDelete: (id: string) => void;
  entryActions: (entry: ResolvedAccountEntry) => EntryAction[];
  paymentLabel: (payment: PaymentType) => string;
  isCalendarIncomeAmountHidden: boolean;
  onToggleCalendarIncomeAmountHidden: () => void;
  hiddenCalendarAmountCardIds: string[];
  onToggleCalendarAmountCard: (cardId: string) => void;
};

export default function WorkspacePanelsSection({
  viewMode,
  isShared,
  currentMonth,
  currentYear,
  currentMonthIndex,
  selectedDate,
  monthEntries,
  monthTotals,
  monthPaymentTotals,
  cashBalance,
  monthSettlementTotal,
  monthAssetTotal,
  selectedCalendarCardId,
  listMemo,
  onChangeListMemo,
  onSaveListMemo,
  memberExpenseTotals,
  selectedExpenseMemberName,
  onSelectExpenseMember,
  monthCategorySummary,
  cardCompanySummary,
  selectedCardCompany,
  onSelectCardCompany,
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
  monthlyBudget,
  onChangeAnnualSavingGoal,
  onChangeMonthlyBudget,
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
  onOpenNaturalAdd,
  onOpenNaturalRegisterForDate,
  onSelectCalendarCard,
  onEdit,
  onCopy,
  onDelete,
  entryActions,
  paymentLabel,
  isCalendarIncomeAmountHidden,
  onToggleCalendarIncomeAmountHidden,
  hiddenCalendarAmountCardIds,
  onToggleCalendarAmountCard,
}: Props) {
  const hasDetailPanel = viewMode !== "board";
  const isLedgerLayout = viewMode === "ledger";
  const hideIncomeAmount =
    isCalendarIncomeAmountHidden ||
    hiddenCalendarAmountCardIds.includes("income");

  return (
    <StCalendarSplit $hasDetailPanel={hasDetailPanel}>
      <StLeftSplitCard>
        {viewMode === "calendar" ? (
          <TopSummaryControls
            viewMode={viewMode === "calendar" ? "calendar" : "ledger"}
            monthTotals={monthTotals}
            monthPaymentTotals={monthPaymentTotals}
            cashBalance={cashBalance}
            monthSettlementTotal={monthSettlementTotal}
            monthAssetTotal={monthAssetTotal}
            boardSummaryCards={boardSummaryCards}
            formatAmount={formatAmount}
            selectedLedgerCardId={selectedLedgerCardId}
            onSelectLedgerCard={onSelectLedgerCard}
            selectedCalendarCardId={selectedCalendarCardId}
            onSelectCalendarCard={onSelectCalendarCard}
            hiddenCalendarAmountCardIds={hiddenCalendarAmountCardIds}
            onToggleCalendarAmountCard={onToggleCalendarAmountCard}
          />
        ) : null}

        {isLedgerLayout ? (
          <StLeftBody>
            <StLedgerLeftStack>
              <StLedgerOverviewBlock>
                <LedgerOverviewSection
                  currentMonth={currentMonth}
                  monthEntriesCount={monthEntries.length}
                  monthTotals={monthTotals}
                  monthAssetTotal={monthAssetTotal}
                  monthEntries={monthEntries}
                  memberExpenseTotals={memberExpenseTotals}
                  selectedExpenseMemberName={selectedExpenseMemberName}
                  onSelectExpenseMember={onSelectExpenseMember}
                  monthCategorySummary={monthCategorySummary}
                  categoryDescriptions={Object.fromEntries(
                    boardSummaryCards.map((card) => [
                      card.label,
                      card.description,
                    ]),
                  )}
                  cardCompanySummary={cardCompanySummary}
                  selectedCardCompany={selectedCardCompany}
                  onSelectCardCompany={onSelectCardCompany}
                  onEdit={onEdit}
                  formatAmount={formatAmount}
                  isShared={isShared}
                  cardColumnFooter={
                    <StLedgerMemoBar>
                      <MonthlyIssueMemo
                        memo={listMemo}
                        onChangeMemo={onChangeListMemo}
                        onSaveMemo={onSaveListMemo}
                        placement="top"
                      />
                    </StLedgerMemoBar>
                  }
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
                monthlyBudget={monthlyBudget}
                onChangeAnnualGoal={onChangeAnnualSavingGoal}
                onChangeMonthlyBudget={onChangeMonthlyBudget}
                dashboardRows={dashboardRows}
                onSelectMonth={onSelectBoardMonth}
                onOpenIncomeYearly={onOpenIncomeYearly}
                onOpenExpenseYearly={onOpenExpenseYearly}
                onOpenAssetYearly={onOpenAssetYearly}
                monthlyMemo={listMemo}
                onChangeMonthlyMemo={onChangeListMemo}
                onSaveMonthlyMemo={onSaveListMemo}
              />
            ) : (
              <CalendarPanel
                currentMonth={currentMonth}
                calendarDays={calendarDays}
                daySummary={daySummary}
                selectedDate={selectedDate}
                toIsoDate={toIsoDate}
                onSelectDate={onSelectDate}
                onOpenNaturalRegisterForDate={onOpenNaturalRegisterForDate}
                hideIncomeAmount={
                  isCalendarIncomeAmountHidden ||
                  hiddenCalendarAmountCardIds.includes("income")
                }
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
                onOpenNaturalAdd={onOpenNaturalAdd}
                onEdit={onEdit}
                onCopy={onCopy}
                onDelete={onDelete}
                entryActions={entryActions}
                formatAmount={formatAmount}
                paymentLabel={paymentLabel}
                showDateMeta
                hideIncomeAmount={hideIncomeAmount}
              />
            </StLedgerDetailBlock>
          ) : (
            <DetailEntriesPanel
              title={calendarDetailTitle}
              entries={selectedDateEntries}
              assetEntries={
                selectedCalendarCardId ? undefined : selectedDateAssetEntries
              }
              canToggleAmountVisibility={selectedCalendarCardId === "income"}
              hideIncomeAmount={hideIncomeAmount}
              isAmountHidden={
                selectedCalendarCardId === "income" &&
                isCalendarIncomeAmountHidden
              }
              onToggleAmountVisibility={onToggleCalendarIncomeAmountHidden}
              onOpenAdd={onOpenAdd}
              onOpenNaturalAdd={onOpenNaturalAdd}
              onEdit={onEdit}
              onCopy={onCopy}
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
    return "minmax(0, 1.35fr) minmax(min(320px, 100%), 0.78fr)";
  }};
  gap: 1rem;
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
  background: transparent;
  padding: 1rem 0 0;

  @media (max-width: 720px) {
    padding: 0;
  }
`;

const StLedgerMemoBar = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const StLeftBody = styled.div`
  flex: 1;
  min-height: 0;
  padding-bottom: 1rem;

  @media (max-width: 1080px) {
    padding-bottom: 0;
  }

  @media (max-width: 720px) {
    padding-bottom: 0;
  }
`;

const StRightSplitCard = styled.section`
  min-height: 0;
  background: transparent;
  padding-top: 1rem;
  display: flex;
  flex-direction: column;

  @media (max-width: 1080px) {
    margin: 20px 0 0;
  }

  @media (max-width: 720px) {
    margin: 0.8rem 0 0;
    padding-top: 0;
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
