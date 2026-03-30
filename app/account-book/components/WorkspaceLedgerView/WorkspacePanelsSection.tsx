"use client";

import styled from "styled-components";
import type { PaymentType, ResolvedAccountEntry, ViewMode } from "../../types";
import CalendarPanel from "../CalendarPanel";
import DetailEntriesPanel from "../DetailEntriesPanel";
import MonthlyBoardPanel from "../MonthlyBoardPanel";
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
  selectedDate: string;
  monthEntries: ResolvedAccountEntry[];
  monthTotals: { income: number; expense: number };
  monthPaymentTotals: {
    income: { cash: number; card: number; check_card: number };
    expense: { cash: number; card: number; check_card: number };
  };
  cashBalance: number;
  monthAssetTotal: number;
  memberExpenseTotals: Array<[string, number]>;
  monthCategorySummary: Array<[string, number]>;
  onOpenIncomeYearly: () => void;
  onOpenExpenseYearly: () => void;
  onOpenAssetYearly: () => void;
  formatAmount: (value: number) => string;
  boardMonthLabel: string;
  monthlyBoardColumns: Array<{
    id: string;
    title: string;
    description: string;
    totalAmount: number;
    cards: Array<{ amount: number }>;
  }>;
  effectiveBoardColumnId: string;
  onSelectBoardColumn: (columnId: string) => void;
  calendarDays: Date[];
  daySummary: Record<string, { income: number; expense: number }>;
  toIsoDate: (date: Date) => string;
  onSelectDate: (date: string) => void;
  ledgerDetailTitle: string;
  boardDetailTitle: string;
  calendarDetailTitle: string;
  selectedDateEntries: ResolvedAccountEntry[];
  selectedDateAssetEntries: ResolvedAccountEntry[];
  monthlyBoardDetailEntries: Record<string, ResolvedAccountEntry[]>;
  onOpenAdd: () => void;
  onEdit: (entry: ResolvedAccountEntry) => void;
  onDelete: (id: string) => void;
  entryActions: (entry: ResolvedAccountEntry) => EntryAction[];
  paymentLabel: (payment: PaymentType) => string;
};

export default function WorkspacePanelsSection({
  viewMode,
  currentMonth,
  selectedDate,
  monthEntries,
  monthTotals,
  monthPaymentTotals,
  cashBalance,
  monthAssetTotal,
  memberExpenseTotals,
  monthCategorySummary,
  onOpenIncomeYearly,
  onOpenExpenseYearly,
  onOpenAssetYearly,
  formatAmount,
  boardMonthLabel,
  monthlyBoardColumns,
  effectiveBoardColumnId,
  onSelectBoardColumn,
  calendarDays,
  daySummary,
  toIsoDate,
  onSelectDate,
  ledgerDetailTitle,
  boardDetailTitle,
  calendarDetailTitle,
  selectedDateEntries,
  selectedDateAssetEntries,
  monthlyBoardDetailEntries,
  onOpenAdd,
  onEdit,
  onDelete,
  entryActions,
  paymentLabel,
}: Props) {
  return (
    <StCalendarSplit>
      <StLeftSplitCard>
        <TopSummaryControls
          monthTotals={monthTotals}
          monthPaymentTotals={monthPaymentTotals}
          cashBalance={cashBalance}
          assetTotal={monthAssetTotal}
          onOpenIncomeYearly={onOpenIncomeYearly}
          onOpenExpenseYearly={onOpenExpenseYearly}
          onOpenAssetYearly={onOpenAssetYearly}
          formatAmount={formatAmount}
        />

        <StLeftBody>
          {viewMode === "ledger" ? (
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
          ) : viewMode === "board" ? (
            <MonthlyBoardPanel
              monthLabel={boardMonthLabel}
              columns={monthlyBoardColumns}
              selectedColumnId={effectiveBoardColumnId}
              formatAmount={formatAmount}
              onSelectColumn={onSelectBoardColumn}
            />
          ) : (
            <CalendarPanel
              currentMonth={currentMonth}
              calendarDays={calendarDays}
              daySummary={daySummary}
              selectedDate={selectedDate}
              toIsoDate={toIsoDate}
              onSelectDate={onSelectDate}
            />
          )}
        </StLeftBody>
      </StLeftSplitCard>

      <StRightSplitCard>
        {viewMode === "ledger" ? (
          <DetailEntriesPanel
            title={ledgerDetailTitle}
            entries={monthEntries}
            onOpenAdd={onOpenAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            entryActions={entryActions}
            formatAmount={formatAmount}
            paymentLabel={paymentLabel}
            showDateMeta
          />
        ) : viewMode === "board" ? (
          <DetailEntriesPanel
            title={boardDetailTitle}
            entries={monthlyBoardDetailEntries[effectiveBoardColumnId] || []}
            onOpenAdd={onOpenAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            entryActions={entryActions}
            formatAmount={formatAmount}
            paymentLabel={paymentLabel}
            showDateMeta
          />
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
          />
        )}
      </StRightSplitCard>
    </StCalendarSplit>
  );
}

const StCalendarSplit = styled.div`
  height: 100%;
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.78fr);
  gap: 0.85rem;
  min-height: 0;
  align-items: stretch;

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
  min-height: 0;
  border: 1px solid #dce5f0;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  padding: 0.9rem;
  overflow: hidden;

  @media (max-width: 1080px) {
    overflow: visible;
  }
`;

const StLeftBody = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.25rem;
  padding-bottom: 1rem;
  overscroll-behavior: contain;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }

  @media (max-width: 1080px) {
    overflow: visible;
    padding-right: 0;
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
  overflow: hidden;
  overscroll-behavior: contain;

  @media (max-width: 1080px) {
    overflow: visible;
    margin: 20px 0;
  }
`;
