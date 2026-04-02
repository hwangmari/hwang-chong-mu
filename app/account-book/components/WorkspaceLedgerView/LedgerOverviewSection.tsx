"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styled from "styled-components";
import type { PaymentType, ResolvedAccountEntry } from "../../types";
import { getRepresentativeExpenseCategory, isSavingsCategory } from "./utils";

type CardCompanySummary = {
  id: string;
  label: string;
  paymentGroup: PaymentType;
  amount: number;
  count: number;
  cardCount: number;
  checkCardCount: number;
  cashCount: number;
};

type Props = {
  currentMonth: Date;
  monthEntriesCount: number;
  monthTotals: { income: number; expense: number };
  monthAssetTotal: number;
  monthEntries: ResolvedAccountEntry[];
  memberExpenseTotals: Array<[string, number]>;
  monthCategorySummary: Array<[string, number]>;
  categoryDescriptions: Record<string, string>;
  cardCompanySummary: CardCompanySummary[];
  selectedCardCompany: string | null;
  onSelectCardCompany: (cardCompany: string) => void;
  formatAmount: (value: number) => string;
};

export default function LedgerOverviewSection({
  currentMonth,
  monthEntriesCount,
  monthTotals,
  monthAssetTotal,
  monthEntries,
  memberExpenseTotals,
  monthCategorySummary,
  categoryDescriptions,
  cardCompanySummary,
  selectedCardCompany,
  onSelectCardCompany,
  formatAmount,
}: Props) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedDetailGroups, setExpandedDetailGroups] = useState<
    Record<string, boolean>
  >({});
  const compareColors = ["#4f7cff", "#6b63e8", "#3f8f8a", "#7f91ac"];
  const maxMemberExpense = Math.max(
    ...memberExpenseTotals.map(([, amount]) => amount),
    0,
  );

  const maxCardCompanyAmount = Math.max(
    ...cardCompanySummary.map((entry) => entry.amount),
    0,
  );
  const paymentGroupSummary = useMemo(
    () =>
      [
        {
          key: "card" as const,
          label: "카드",
          entries: cardCompanySummary.filter(
            (entry) => entry.paymentGroup === "card",
          ),
        },
        {
          key: "check_card" as const,
          label: "체크카드",
          entries: cardCompanySummary.filter(
            (entry) => entry.paymentGroup === "check_card",
          ),
        },
        {
          key: "cash" as const,
          label: "현금",
          entries: cardCompanySummary.filter(
            (entry) => entry.paymentGroup === "cash",
          ),
        },
      ].filter((group) => group.entries.length > 0),
    [cardCompanySummary],
  );

  const categoryDetails = useMemo(() => {
    const grouped = monthEntries.reduce<
      Record<string, { total: number; entries: ResolvedAccountEntry[] }>
    >((acc, entry) => {
      const key =
        entry.type === "income"
          ? "수입"
          : isSavingsCategory(entry.category)
            ? "자산/저축"
            : getRepresentativeExpenseCategory(entry.category);

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
      description: categoryDescriptions[label] || "",
      detailGroups: Object.values(
        (grouped[label]?.entries || []).reduce<
          Record<
            string,
            {
              label: string;
              total: number;
              count: number;
              entries: ResolvedAccountEntry[];
            }
          >
        >((acc, entry) => {
          const detailLabel =
            entry.subCategory?.trim() ||
            entry.merchant?.trim() ||
            entry.item?.trim() ||
            "기타";

          if (!acc[detailLabel]) {
            acc[detailLabel] = {
              label: detailLabel,
              total: 0,
              count: 0,
              entries: [],
            };
          }

          acc[detailLabel].total += entry.amount;
          acc[detailLabel].count += 1;
          acc[detailLabel].entries.push(entry);
          return acc;
        }, {}),
      )
        .map((detailGroup) => ({
          ...detailGroup,
          entries: detailGroup.entries
            .slice()
            .sort((a, b) =>
              `${b.date}-${String(b.amount).padStart(12, "0")}-${b.id}`.localeCompare(
                `${a.date}-${String(a.amount).padStart(12, "0")}-${a.id}`,
              ),
            ),
        }))
        .sort(
          (a, b) =>
            b.total - a.total || a.label.localeCompare(b.label, "ko-KR"),
        ),
    }));
  }, [categoryDescriptions, monthCategorySummary, monthEntries]);

  return (
    <StLedgerOverview>
      {memberExpenseTotals.length > 1 ? (
        <StCompareCard>
          <StCompareHeader>
            <strong>사용 금액 비교</strong>
            <span>공용 가계부 참여자별 이번 달 지출을 비교합니다.</span>
          </StCompareHeader>
          <StCompareList>
            {memberExpenseTotals.map(([name, amount], index) => {
              const width =
                amount > 0 && maxMemberExpense > 0
                  ? `${Math.max((amount / maxMemberExpense) * 100, 8)}%`
                  : "0%";
              const color = compareColors[index % compareColors.length];

              return (
                <StCompareRow key={name}>
                  <StCompareMeta>
                    <StCompareName>
                      <span className="dot" style={{ background: color }} />
                      <strong>{name}</strong>
                    </StCompareName>
                    <em>{formatAmount(amount)}</em>
                  </StCompareMeta>
                  <StCompareBar>
                    <StCompareFill style={{ width, background: color }} />
                  </StCompareBar>
                </StCompareRow>
              );
            })}
          </StCompareList>
        </StCompareCard>
      ) : null}
      <StCardCompanyCard>
        <StCardCompanyHeader>
          <strong>
            결제수단별 {format(currentMonth, "M월", { locale: ko })} 사용액
          </strong>
          <span>이번 달 카드, 체크카드, 현금 지출을 함께 보여줍니다.</span>
        </StCardCompanyHeader>
        {cardCompanySummary.length === 0 ? (
          <StCardCompanyEmpty>
            이번 달 결제수단 사용 내역이 아직 없습니다.
          </StCardCompanyEmpty>
        ) : (
          <StCardCompanyList>
            {paymentGroupSummary.map((group) => (
              <div key={group.key}>
                {group.entries.map((entry, index) => {
                  const width =
                    entry.amount > 0 && maxCardCompanyAmount > 0
                      ? `${Math.max((entry.amount / maxCardCompanyAmount) * 100, 8)}%`
                      : "0%";
                  const color = compareColors[index % compareColors.length];
                  const paymentMeta =
                    entry.cashCount > 0
                      ? `총 ${entry.count}건 · 현금`
                      : entry.checkCardCount > 0
                        ? `총 ${entry.count}건 · 체크카드`
                        : `총 ${entry.count}건 · 카드`;

                  return (
                    <StCardCompanyRow
                      key={entry.id}
                      type="button"
                      $active={selectedCardCompany === entry.id}
                      onClick={() => onSelectCardCompany(entry.id)}
                    >
                      <StCardCompanyMeta>
                        <div>
                          <strong>{entry.label}</strong>
                          <span>{paymentMeta}</span>
                        </div>
                        <em>{formatAmount(entry.amount)}</em>
                      </StCardCompanyMeta>
                      <StCardCompanyBar>
                        <StCardCompanyFill
                          style={{ width, background: color }}
                        />
                      </StCardCompanyBar>
                    </StCardCompanyRow>
                  );
                })}
              </div>
            ))}
          </StCardCompanyList>
        )}
      </StCardCompanyCard>
      <StLedgerCategoryList>
        {monthCategorySummary.length === 0 ? (
          <StLedgerEmpty>이번 달 기록이 아직 없습니다.</StLedgerEmpty>
        ) : (
          categoryDetails.map(({ label, total, description, detailGroups }) => {
            const isExpanded = expandedCategory === label;
            const totalCount = detailGroups.reduce(
              (sum, detailGroup) => sum + detailGroup.count,
              0,
            );

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
                    <StLedgerCategoryText>
                      <strong>{label}</strong>
                      {description ? <span>{description}</span> : null}
                    </StLedgerCategoryText>
                    <StLedgerCategoryMeta>
                      <small>{totalCount}건</small>
                      <strong>{formatAmount(total)}</strong>
                    </StLedgerCategoryMeta>
                  </StLedgerCategoryMain>
                </StLedgerCategoryButton>

                {isExpanded ? (
                  <StLedgerDetailList>
                    {detailGroups.map((detailGroup) => {
                      const detailKey = `${label}::${detailGroup.label}`;
                      const isDetailExpanded =
                        expandedDetailGroups[detailKey] ?? false;

                      return (
                        <StLedgerSubGroup key={`${label}-${detailGroup.label}`}>
                          <StLedgerSubGroupButton
                            type="button"
                            $expanded={isDetailExpanded}
                            onClick={() =>
                              setExpandedDetailGroups((current) => ({
                                ...current,
                                [detailKey]: !isDetailExpanded,
                              }))
                            }
                          >
                            <StLedgerSubGroupHeader>
                              <div>
                                <strong>{detailGroup.label}</strong>
                                <span>{detailGroup.count}건</span>
                              </div>
                              <StLedgerSubGroupHeaderMeta>
                                <em>{formatAmount(detailGroup.total)}</em>
                                <StLedgerChevron
                                  viewBox="0 0 12 12"
                                  aria-hidden="true"
                                  $expanded={isDetailExpanded}
                                >
                                  <path
                                    d="M2.25 4.5 6 8.25 9.75 4.5"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.7"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </StLedgerChevron>
                              </StLedgerSubGroupHeaderMeta>
                            </StLedgerSubGroupHeader>
                          </StLedgerSubGroupButton>
                          {isDetailExpanded ? (
                            <StLedgerSubGroupList>
                              {detailGroup.entries.map((entry) => (
                                <StLedgerDetailItem key={entry.resolvedId}>
                                  <StLedgerDetailLine>
                                    <StLedgerDetailInfo>
                                      <strong>{entry.item}</strong>
                                      <span>
                                        {[
                                          format(
                                            new Date(entry.date),
                                            "M월 d일",
                                            {
                                              locale: ko,
                                            },
                                          ),
                                          entry.merchant,
                                          entry.member,
                                        ]
                                          .filter(Boolean)
                                          .join(" · ")}
                                      </span>
                                    </StLedgerDetailInfo>
                                    <em>{formatAmount(entry.amount)}</em>
                                  </StLedgerDetailLine>
                                </StLedgerDetailItem>
                              ))}
                            </StLedgerSubGroupList>
                          ) : null}
                        </StLedgerSubGroup>
                      );
                    })}
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
  gap: 0.7rem;

  span {
    font-size: 0.8rem;
    font-weight: 800;
    color: #506680;
  }
`;

const StLedgerCategoryList = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const StCompareCard = styled.section`
  padding: 0;
`;

const StCompareHeader = styled.div`
  display: grid;
  gap: 0.18rem;
  margin-bottom: 0.45rem;

  strong {
    font-size: 0.9rem;
    color: #213247;
  }

  span {
    font-size: 0.75rem;
    color: #74849a;
  }
`;

const StCompareList = styled.div`
  display: grid;
  gap: 0.6rem;
`;

const StCardCompanyCard = styled.section`
  padding: 0;
`;

const StCardCompanyHeader = styled.div`
  display: grid;
  gap: 0.18rem;
  margin-bottom: 0.45rem;

  strong {
    font-size: 0.9rem;
    color: #213247;
  }

  span {
    font-size: 0.75rem;
    color: #74849a;
  }
`;

const StCardCompanyList = styled.div`
  display: grid;
  gap: 0;
`;

const StCardCompanyRow = styled.button<{ $active: boolean }>`
  display: grid;
  gap: 0.34rem;
  width: 100%;
  border: none;
  background-color: ${({ $active }) => ($active ? "#cfe0ff" : "")};
  background: transparent;
  padding: 0.55rem 0;
  text-align: left;

  &:first-child {
    border-top: none;
  }

  &:hover {
    background: transparent;
  }
`;

const StCardCompanyMeta = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;

  div {
    display: grid;
    gap: 0.12rem;
  }

  strong {
    font-size: 0.84rem;
    color: #33465c;
  }

  span {
    font-size: 0.72rem;
    color: #7c8ca0;
  }

  em {
    font-style: normal;
    font-size: 0.82rem;
    font-weight: 900;
    color: #2c4d97;
    white-space: nowrap;
  }
`;

const StCardCompanyBar = styled.div`
  width: 100%;
  height: 0.62rem;
  border-radius: 999px;
  background: #e9eef5;
  overflow: hidden;
`;

const StCardCompanyFill = styled.div`
  height: 100%;
  border-radius: inherit;
`;

const StCardCompanyEmpty = styled.p`
  font-size: 0.8rem;
  color: #8592a5;
  line-height: 1.5;
`;

const StCompareRow = styled.div`
  display: grid;
  gap: 0.32rem;
`;

const StCompareMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;

  em {
    font-style: normal;
    font-size: 0.8rem;
    font-weight: 800;
    color: #223147;
  }
`;

const StCompareName = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;

  .dot {
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 999px;
    flex-shrink: 0;
  }

  strong {
    font-size: 0.82rem;
    color: #42546a;
  }
`;

const StCompareBar = styled.div`
  width: 100%;
  height: 0.7rem;
  border-radius: 999px;
  background: #e9eef5;
  overflow: hidden;
`;

const StCompareFill = styled.div`
  height: 100%;
  border-radius: inherit;
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
`;

const StLedgerCategoryText = styled.div`
  display: inline-flex;
  align-items: baseline;
  gap: 0.5rem;
  min-width: 0;

  strong {
    font-size: 0.86rem;
    font-weight: 900;
    color: #34465d;
    white-space: nowrap;
  }

  span {
    font-size: 0.73rem;
    font-weight: 700;
    color: #8494aa;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

const StLedgerCategoryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-shrink: 0;

  strong {
    font-size: 0.84rem;
    font-weight: 900;
    color: #2c4d97;
  }

  small {
    font-size: 0.72rem;
    font-weight: 800;
    color: #7a8aa0;
  }
`;

const StLedgerDetailList = styled.div`
  display: grid;
  gap: 0;
  padding: 0 0.82rem 0.4rem;
`;

const StLedgerSubGroup = styled.div`
  display: grid;
  gap: 0;
`;

const StLedgerSubGroupButton = styled.button<{ $expanded: boolean }>`
  width: 100%;
  border: none;
  border-top: 1px solid #e7edf6;
  background: transparent;
  padding: 0.52rem 0.1rem;
  text-align: left;

  &:first-child {
    border-top: none;
  }

  &:hover {
    background: transparent;
  }
`;

const StLedgerSubGroupHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;

  div {
    display: inline-flex;
    align-items: baseline;
    gap: 0.42rem;
  }

  strong {
    font-size: 0.8rem;
    font-weight: 900;
    color: #34465d;
  }

  span {
    font-size: 0.72rem;
    font-weight: 700;
    color: #8494aa;
  }
`;

const StLedgerSubGroupHeaderMeta = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;

  em {
    font-style: normal;
    font-size: 0.8rem;
    font-weight: 900;
    color: #4e6cac;
    white-space: nowrap;
  }
`;

const StLedgerChevron = styled.svg<{ $expanded: boolean }>`
  width: 0.82rem;
  height: 0.82rem;
  flex-shrink: 0;
  color: #8a99ad;
  transform: rotate(${({ $expanded }) => ($expanded ? "180deg" : "0deg")});
  transition: transform 0.18s ease;
`;

const StLedgerSubGroupList = styled.div`
  display: grid;
  gap: 0;
  padding: 0 0.1rem 0.16rem;
`;

const StLedgerDetailItem = styled.div`
  border-top: 1px solid #e7edf6;
  padding: 0.42rem 0.1rem;

  &:first-child {
    border-top: none;
  }
`;

const StLedgerDetailLine = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: baseline;

  em {
    font-style: normal;
    font-size: 0.78rem;
    font-weight: 900;
    color: #3557b6;
    white-space: nowrap;
  }
`;

const StLedgerDetailInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.42rem;

  strong {
    font-size: 0.8rem;
    font-weight: 800;
    color: #243447;
  }

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
