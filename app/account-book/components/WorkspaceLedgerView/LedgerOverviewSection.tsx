"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styled from "styled-components";
import type { ResolvedAccountEntry } from "../../types";

type Props = {
  currentMonth: Date;
  monthEntriesCount: number;
  monthTotals: { income: number; expense: number };
  monthAssetTotal: number;
  monthEntries: ResolvedAccountEntry[];
  monthCategorySummary: Array<[string, number]>;
  formatAmount: (value: number) => string;
};

export default function LedgerOverviewSection({
  currentMonth,
  monthEntriesCount,
  monthTotals,
  monthAssetTotal,
  monthEntries,
  monthCategorySummary,
  formatAmount,
}: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const categoryDetails = useMemo(() => {
    const grouped = monthEntries.reduce<
      Record<string, { total: number; entries: ResolvedAccountEntry[] }>
    >((acc, entry) => {
      const key =
        entry.type === "income"
          ? "수입"
          : entry.category.trim() === "저축"
            ? "자산/저축"
            : entry.category;

      if (!acc[key]) {
        acc[key] = { total: 0, entries: [] };
      }

      acc[key].total += entry.amount;
      acc[key].entries.push(entry);
      return acc;
    }, {});

    return monthCategorySummary.map(([label, total]) => ({
      label,
      total,
      entries: (grouped[label]?.entries || [])
        .slice()
        .sort((a, b) =>
          `${b.date}-${String(b.amount).padStart(12, "0")}-${b.id}`.localeCompare(
            `${a.date}-${String(a.amount).padStart(12, "0")}-${a.id}`,
          ),
        ),
    }));
  }, [monthCategorySummary, monthEntries]);

  return (
    <StLedgerOverview>
      <StLedgerOverviewHeader>
        <div>
          <StLedgerOverviewEyebrow>Monthly Snapshot</StLedgerOverviewEyebrow>
          <StLedgerOverviewTitle>
            {format(currentMonth, "M월", { locale: ko })} 사용 흐름
          </StLedgerOverviewTitle>
        </div>
        <StLedgerOverviewCount>{monthEntriesCount}건</StLedgerOverviewCount>
      </StLedgerOverviewHeader>
      <StLedgerOverviewSummary>
        <span>지출 {formatAmount(monthTotals.expense)}</span>
        <span>수입 {formatAmount(monthTotals.income)}</span>
        <span>자산 {formatAmount(monthAssetTotal)}</span>
      </StLedgerOverviewSummary>
      <StLedgerCategoryList>
        {monthCategorySummary.length === 0 ? (
          <StLedgerEmpty>
            이번 달 기록이 아직 없습니다. 위 문장 입력창으로 바로 추가해보세요.
          </StLedgerEmpty>
        ) : (
          categoryDetails.map(({ label, total, entries }) => {
            const isExpanded = expandedCategory === label;

            return (
              <StLedgerCategoryCard key={label}>
                <StLedgerCategoryButton
                  type="button"
                  $expanded={isExpanded}
                  onClick={() =>
                    setExpandedCategory((current) =>
                      current === label ? null : label,
                    )
                  }
                >
                  <StLedgerCategoryMain>
                    <span>{label}</span>
                    <StLedgerCategoryMeta>
                      <small>{entries.length}건</small>
                      <strong>{formatAmount(total)}</strong>
                    </StLedgerCategoryMeta>
                  </StLedgerCategoryMain>
                </StLedgerCategoryButton>

                {isExpanded ? (
                  <StLedgerDetailList>
                    {entries.map((entry) => (
                      <StLedgerDetailItem key={entry.resolvedId}>
                        <StLedgerDetailHead>
                          <strong>{entry.item}</strong>
                          <span>{formatAmount(entry.amount)}</span>
                        </StLedgerDetailHead>
                        <StLedgerDetailMeta>
                          <span>{format(new Date(entry.date), "M월 d일", { locale: ko })}</span>
                          {entry.merchant ? <span>{entry.merchant}</span> : null}
                          {entry.member ? <span>{entry.member}</span> : null}
                        </StLedgerDetailMeta>
                      </StLedgerDetailItem>
                    ))}
                  </StLedgerDetailList>
                ) : null}
              </StLedgerCategoryCard>
            );
          })
        )}
      </StLedgerCategoryList>
    </StLedgerOverview>
  );
}

const StLedgerOverview = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const StLedgerOverviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-end;
`;

const StLedgerOverviewEyebrow = styled.p`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7386a2;
`;

const StLedgerOverviewTitle = styled.h3`
  margin-top: 0.2rem;
  font-size: 1.12rem;
  font-weight: 900;
  color: #223147;
`;

const StLedgerOverviewCount = styled.span`
  font-size: 0.78rem;
  font-weight: 800;
  color: #59708c;
`;

const StLedgerOverviewSummary = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;

  span {
    border-radius: 999px;
    border: 1px solid #d7e2ef;
    background: #f8fbff;
    padding: 0.32rem 0.62rem;
    font-size: 0.78rem;
    font-weight: 800;
    color: #506680;
  }
`;

const StLedgerCategoryList = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const StLedgerCategoryCard = styled.div`
  border: 1px solid #e3eaf2;
  border-radius: 16px;
  background: #fbfdff;
  overflow: hidden;
`;

const StLedgerCategoryButton = styled.button<{ $expanded: boolean }>`
  width: 100%;
  border: none;
  background: ${({ $expanded }) => ($expanded ? "#f4f8ff" : "#fbfdff")};
  padding: 0.72rem 0.82rem;
`;

const StLedgerCategoryMain = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;

  span {
    font-size: 0.86rem;
    font-weight: 800;
    color: #34465d;
  }

  strong {
    font-size: 0.84rem;
    font-weight: 900;
    color: #2c4d97;
  }
`;

const StLedgerCategoryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;

  small {
    font-size: 0.72rem;
    font-weight: 800;
    color: #7a8aa0;
  }
`;

const StLedgerDetailList = styled.div`
  display: grid;
  gap: 0.45rem;
  padding: 0 0.82rem 0.82rem;
`;

const StLedgerDetailItem = styled.div`
  border-top: 1px solid #e7edf6;
  padding-top: 0.55rem;
`;

const StLedgerDetailHead = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;

  strong {
    font-size: 0.8rem;
    font-weight: 800;
    color: #243447;
  }

  span {
    font-size: 0.78rem;
    font-weight: 900;
    color: #3557b6;
  }
`;

const StLedgerDetailMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.24rem;

  span {
    font-size: 0.72rem;
    font-weight: 700;
    color: #74859a;
  }
`;

const StLedgerEmpty = styled.p`
  font-size: 0.84rem;
  line-height: 1.6;
  color: #8592a5;
`;
