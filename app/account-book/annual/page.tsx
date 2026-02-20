"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { AccountEntry } from "../types";

const STORAGE_KEY = "hwang-account-book-v2";
const CATEGORY_COLOR_MAP: Record<string, string> = {
  "식비/외식": "#9b9b9b",
  "병원/의료": "#bf8a79",
  "선물/기타": "#3c3d41",
  "쇼핑/패션": "#bf8a79",
  "쇼핑/기타": "#818bd7",
  "교통/택시": "#78c99b",
  "여행/관광": "#68b383",
  "주차/교통": "#dbc85a",
  "결제/플랫폼": "#d8c553",
  "문화/구독": "#67b182",
  저축: "#5d9cec",
  "교통카드/충전": "#e28da8",
  통행료: "#bbd271",
  약국: "#7f86d6",
};

type AnnualKind = "income" | "expense" | "asset";
type PaymentKey = "cash" | "card" | "check_card";

const PAYMENT_META: Array<{ key: PaymentKey; label: string; color: string }> = [
  { key: "cash", label: "현금", color: "#67b182" },
  { key: "card", label: "카드", color: "#6d87ef" },
  { key: "check_card", label: "체크카드", color: "#d08b5b" },
];

function formatAmount(value: number) {
  return `${value.toLocaleString()}원`;
}

function normalizeEntry(
  raw: Partial<AccountEntry>,
  fallbackId: string,
): AccountEntry {
  return {
    id: raw.id || fallbackId,
    date: raw.date || "2026-01-01",
    member: raw.member || "나",
    type: raw.type === "income" ? "income" : "expense",
    category: raw.category || "기타",
    subCategory: raw.subCategory || "",
    item: raw.item || "항목명 없음",
    amount: Number(raw.amount) || 0,
    cardCompany: raw.cardCompany || "",
    payment:
      raw.payment === "cash"
        ? "cash"
        : raw.payment === "check_card"
          ? "check_card"
          : "card",
    memo: raw.memo || "",
  };
}

function getSavedEntries() {
  if (typeof window === "undefined") return [] as AccountEntry[];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [] as AccountEntry[];
    const parsed = JSON.parse(raw) as Partial<AccountEntry>[];
    if (!Array.isArray(parsed)) return [] as AccountEntry[];
    return parsed.map((entry, index) =>
      normalizeEntry(entry, `annual-${index}`),
    );
  } catch {
    return [] as AccountEntry[];
  }
}

export default function AccountBookAnnualPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries] = useState<AccountEntry[]>(() => getSavedEntries());
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>(
    {},
  );
  const selectedYear = useMemo(() => {
    const nextYear = Number(searchParams.get("year"));
    if (Number.isFinite(nextYear) && nextYear > 2000 && nextYear < 3000) {
      return nextYear;
    }
    return new Date().getFullYear();
  }, [searchParams]);

  const kind = useMemo<AnnualKind>(() => {
    const nextKind = searchParams.get("kind");
    if (
      nextKind === "income" ||
      nextKind === "expense" ||
      nextKind === "asset"
    ) {
      return nextKind;
    }
    return "expense";
  }, [searchParams]);

  const annualEntries = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    return entries.filter((entry) => entry.date.startsWith(yearPrefix));
  }, [entries, selectedYear]);

  const filteredEntries = useMemo(() => {
    if (kind === "income")
      return annualEntries.filter((entry) => entry.type === "income");
    if (kind === "asset") {
      return annualEntries.filter(
        (entry) => entry.type === "expense" && entry.category.trim() === "저축",
      );
    }
    return annualEntries.filter(
      (entry) => entry.type === "expense" && entry.category.trim() !== "저축",
    );
  }, [annualEntries, kind]);

  const total = useMemo(
    () => filteredEntries.reduce((sum, entry) => sum + entry.amount, 0),
    [filteredEntries],
  );

  const monthlyRows = useMemo(() => {
    const grouped = filteredEntries.reduce<
      Record<
        string,
        { amount: number; count: number; payments: Record<PaymentKey, number> }
      >
    >((acc, entry) => {
      const month = entry.date.slice(5, 7);
      if (!acc[month]) {
        acc[month] = {
          amount: 0,
          count: 0,
          payments: { cash: 0, card: 0, check_card: 0 },
        };
      }
      acc[month].amount += entry.amount;
      acc[month].count += 1;
      acc[month].payments[entry.payment] += entry.amount;
      return acc;
    }, {});

    return Array.from({ length: 12 }, (_, index) => {
      const mm = String(index + 1).padStart(2, "0");
      const target = grouped[mm] || { amount: 0, count: 0 };
      return {
        month: `${index + 1}월`,
        amount: target.amount,
        count: target.count,
        payments: target.payments || { cash: 0, card: 0, check_card: 0 },
      };
    });
  }, [filteredEntries]);

  const annualPaymentTotals = useMemo(() => {
    return filteredEntries.reduce<Record<PaymentKey, number>>(
      (acc, entry) => {
        acc[entry.payment] += entry.amount;
        return acc;
      },
      { cash: 0, card: 0, check_card: 0 },
    );
  }, [filteredEntries]);

  const maxMonthlyAmount = Math.max(...monthlyRows.map((row) => row.amount), 0);

  const entriesByMonth = useMemo(() => {
    const filteredMonthlyRows = selectedMonth
      ? monthlyRows.filter((row) => row.month === selectedMonth)
      : monthlyRows;

    return filteredMonthlyRows
      .map((row) => {
        const monthNumber = Number(row.month.replace("월", ""));
        const mm = String(monthNumber).padStart(2, "0");
        const monthEntries = filteredEntries
          .filter((entry) => entry.date.slice(5, 7) === mm)
          .sort((a, b) => b.date.localeCompare(a.date));
        return { month: row.month, entries: monthEntries };
      })
      .filter((row) => row.entries.length > 0);
  }, [filteredEntries, monthlyRows, selectedMonth]);

  const kindLabel =
    kind === "income" ? "수입" : kind === "asset" ? "자산" : "지출";

  return (
    <StPage>
      <StHeader>
        <StBackButton
          type="button"
          onClick={() => router.push("/account-book")}
        >
          뒤로
        </StBackButton>
        <StTitle>
          {selectedYear}년 {kindLabel} 연간 상세
        </StTitle>
      </StHeader>

      <StSplit>
        <StCard>
          <StSectionTitle>연간 요약</StSectionTitle>
          <StTotal>{formatAmount(total)}</StTotal>
          <StPaymentLegend>
            {PAYMENT_META.map((payment) => {
              const value = annualPaymentTotals[payment.key];
              return (
                <StLegendItem key={payment.key}>
                  <span className="dot" style={{ background: payment.color }} />
                  <strong>{payment.label}</strong>
                  <em>{formatAmount(value)}</em>
                </StLegendItem>
              );
            })}
          </StPaymentLegend>
          {total === 0 ? (
            <StEmpty>연간 요약 그래프 데이터가 없습니다.</StEmpty>
          ) : (
            <StChartWrap>
              {monthlyRows.map((row) => {
                const height =
                  row.amount > 0 && maxMonthlyAmount > 0
                    ? `${Math.max((row.amount / maxMonthlyAmount) * 100, 6)}%`
                    : "4px";
                const isActive = selectedMonth === row.month;
                return (
                  <StChartColumn
                    key={row.month}
                    type="button"
                    $active={isActive}
                    onClick={() =>
                      setSelectedMonth((prev) =>
                        prev === row.month ? null : row.month,
                      )
                    }
                  >
                    <StChartBarArea>
                      <StChartBar style={{ height }}>
                        {PAYMENT_META.map((payment) => {
                          if (
                            row.amount <= 0 ||
                            row.payments[payment.key] <= 0
                          ) {
                            return null;
                          }
                          const segmentRatio =
                            (row.payments[payment.key] / row.amount) * 100;
                          return (
                            <StChartSegment
                              key={`${row.month}-${payment.key}`}
                              style={{
                                height: `${Math.max(segmentRatio, 6)}%`,
                                background: payment.color,
                              }}
                            />
                          );
                        })}
                      </StChartBar>
                    </StChartBarArea>
                    <strong>{row.month}</strong>
                    <span>{row.count}건</span>
                    <em>{formatAmount(row.amount)}</em>
                    <StBarTooltip className="tooltip">
                      <h5>{row.month}</h5>
                      {PAYMENT_META.map((payment) => (
                        <p key={`tt-${row.month}-${payment.key}`}>
                          <span>{payment.label}</span>
                          <strong>
                            {formatAmount(row.payments[payment.key])}
                          </strong>
                        </p>
                      ))}
                      <p className="total">
                        <span>합계</span>
                        <strong>{formatAmount(row.amount)}</strong>
                      </p>
                    </StBarTooltip>
                  </StChartColumn>
                );
              })}
            </StChartWrap>
          )}
        </StCard>

        <StCard>
          <StDetailHead>
            <StSectionTitle>
              {selectedMonth ? `${selectedMonth} 세부 내역` : "월별 세부 내역"}
            </StSectionTitle>
            {selectedMonth && (
              <StResetButton
                type="button"
                onClick={() => setSelectedMonth(null)}
              >
                전체 보기
              </StResetButton>
            )}
          </StDetailHead>
          <StDetailList>
            {entriesByMonth.length === 0 ? (
              <StEmpty>해당 연도 내역이 없습니다.</StEmpty>
            ) : (
              entriesByMonth.map((monthGroup) => (
                <StMonthGroup key={monthGroup.month}>
                  <h4>{monthGroup.month}</h4>
                  {(() => {
                    const monthTotal = monthGroup.entries.reduce(
                      (sum, entry) => sum + entry.amount,
                      0,
                    );
                    const groupedCategories = Object.entries(
                      monthGroup.entries.reduce<Record<string, AccountEntry[]>>(
                        (acc, entry) => {
                          const key = entry.category || "기타";
                          if (!acc[key]) acc[key] = [];
                          acc[key].push(entry);
                          return acc;
                        },
                        {},
                      ),
                    )
                      .map(([category, categoryEntries]) => ({
                        category,
                        entries: categoryEntries,
                        total: categoryEntries.reduce(
                          (sum, entry) => sum + entry.amount,
                          0,
                        ),
                      }))
                      .map((group) => ({
                        ...group,
                        ratio:
                          monthTotal > 0 ? (group.total / monthTotal) * 100 : 0,
                        color: CATEGORY_COLOR_MAP[group.category] || "#8a94a6",
                      }))
                      .sort((a, b) => b.total - a.total);

                    const maxTitleColumnWidth = Math.min(
                      Math.max(
                        ...groupedCategories.map(
                          (group) => group.category.length * 10 + 92,
                        ),
                        170,
                      ),
                      320,
                    );

                    return groupedCategories.map((group) => {
                      const accordionKey = `${monthGroup.month}-${group.category}`;
                      const isOpen = Boolean(openAccordions[accordionKey]);
                      return (
                        <StAccordion key={accordionKey}>
                          <StAccordionHeader
                            $titleWidth={maxTitleColumnWidth}
                            type="button"
                            onClick={() =>
                              setOpenAccordions((prev) => ({
                                ...prev,
                                [accordionKey]: !prev[accordionKey],
                              }))
                            }
                          >
                            <StAccordionTitleWrap>
                              <StCategoryDot
                                style={{ background: group.color }}
                              />
                              <strong>{group.category}</strong>
                              <span>{group.entries.length}건</span>
                            </StAccordionTitleWrap>
                            <StAccordionGraph>
                              <StAccordionTrack>
                                <StAccordionFill
                                  style={{
                                    width: `${Math.max(group.ratio, 2)}%`,
                                    background: group.color,
                                  }}
                                />
                              </StAccordionTrack>
                              <em>{Math.round(group.ratio)}%</em>
                            </StAccordionGraph>
                            <StAccordionRight>
                              <strong>{formatAmount(group.total)}</strong>
                              <StAccordionChevron
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                                $open={isOpen}
                              >
                                <path d="m7 10 5 5 5-5z" />
                              </StAccordionChevron>
                            </StAccordionRight>
                          </StAccordionHeader>

                          {isOpen && (
                            <StAccordionBody>
                              {group.entries
                                .slice()
                                .sort((a, b) => b.date.localeCompare(a.date))
                                .map((entry) => (
                                  <StEntry key={entry.id}>
                                    <div>
                                      <p>
                                        {entry.item}
                                        {entry.subCategory
                                          ? ` · ${entry.subCategory}`
                                          : ""}
                                      </p>
                                      <span>
                                        {entry.date} | {entry.member || "나"}
                                      </span>
                                    </div>
                                    <strong>
                                      {formatAmount(entry.amount)}
                                    </strong>
                                  </StEntry>
                                ))}
                            </StAccordionBody>
                          )}
                        </StAccordion>
                      );
                    });
                  })()}
                </StMonthGroup>
              ))
            )}
          </StDetailList>
        </StCard>
      </StSplit>
    </StPage>
  );
}

const StPage = styled.main`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 200;
  min-height: 100vh;
  padding: 1rem;
  background: #f3f5f7;
  @media (max-width: 720px) {
    position: relative;
    min-height: auto;
  }
`;

const StHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
  min-width: 0;
`;

const StBackButton = styled.button`
  border: 1px solid #d0d7e2;
  background: #fff;
  color: #475569;
  border-radius: 10px;
  padding: 0.4rem 0.65rem;
  font-size: 0.82rem;
  font-weight: 700;
`;

const StTitle = styled.h1`
  font-size: 1.2rem;
  font-weight: 800;
  color: #1f2937;
  min-width: 0;
  white-space: normal;
  word-break: keep-all;
  overflow-wrap: anywhere;
`;

const StSplit = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  height: calc(100vh - 120px);
  min-height: 0;
  @media (max-width: 900px) {
    height: auto;
  }
`;

const StCard = styled.section`
  background: #fff;
  border: 1px solid #dde3ea;
  border-radius: 12px;
  padding: 0.85rem;
  min-height: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  &:first-child {
    flex: 3;
  }
  &:last-child {
    flex: 7;
  }
`;

const StSectionTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.6rem;
`;

const StTotal = styled.strong`
  font-size: 1.15rem;
  color: #164e63;
  margin-bottom: 0.65rem;
`;

const StChartWrap = styled.div`
  margin-top: 0.25rem;
  flex: 1;
  min-height: 240px;
  border: 1px solid #edf1f5;
  border-radius: 10px;
  padding: 0.8rem 0.55rem 0.55rem;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 0.35rem;
  align-items: end;
  background: linear-gradient(180deg, #f8fbff, #ffffff);
`;

const StChartColumn = styled.button<{ $active: boolean }>`
  border: none;
  background: ${({ $active }) => ($active ? "#eef5ff" : "transparent")};
  border-radius: 8px;
  padding: 0.2rem 0.1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.22rem;
  min-height: 0;
  cursor: pointer;
  outline: none;
  &:hover {
    background: #f2f6fc;
  }
  &:hover .tooltip {
    opacity: 1;
    transform: translate(-50%, -6px);
    pointer-events: auto;
  }
  strong {
    font-size: 0.68rem;
    color: ${({ $active }) => ($active ? "#2b5cab" : "#4b5563")};
    font-weight: 700;
  }
  span {
    font-size: 0.62rem;
    color: #94a3b8;
  }
  em {
    font-style: normal;
    font-size: 0.62rem;
    color: #60718b;
    white-space: nowrap;
  }
`;

const StChartBarArea = styled.div`
  height: 160px;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
`;

const StChartBar = styled.div`
  width: 100%;
  max-width: 18px;
  min-height: 4px;
  border-radius: 8px 8px 3px 3px;
  background: #dbe4ef;
  display: flex;
  flex-direction: column-reverse;
  overflow: hidden;
`;

const StChartSegment = styled.div`
  width: 100%;
`;
const StBarTooltip = styled.div`
  position: absolute;
  left: 50%;
  bottom: calc(100% + 6px);
  transform: translate(-50%, 0);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.14s ease,
    transform 0.14s ease;
  background: rgba(20, 26, 38, 0.95);
  color: #f8fafc;
  border-radius: 8px;
  padding: 0.45rem 0.5rem;
  min-width: 146px;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.26);
  z-index: 20;
  h5 {
    font-size: 0.68rem;
    margin-bottom: 0.25rem;
    color: #e2e8f0;
  }
  p {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.4rem;
    font-size: 0.66rem;
    margin: 0.1rem 0;
  }
  p.total {
    margin-top: 0.28rem;
    padding-top: 0.24rem;
    border-top: 1px solid rgba(226, 232, 240, 0.24);
    font-weight: 700;
  }
`;
const StPaymentLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-bottom: 0.45rem;
`;
const StLegendItem = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid #e2e8f0;
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  background: #fff;
  .dot {
    width: 0.58rem;
    height: 0.58rem;
    border-radius: 999px;
    flex-shrink: 0;
  }
  strong {
    font-size: 0.72rem;
    color: #334155;
    font-weight: 700;
  }
  em {
    font-style: normal;
    font-size: 0.68rem;
    color: #60718b;
  }
`;

const StDetailList = styled.div`
  flex: 1;
  overflow: auto;
  min-height: 0;
  display: grid;
  gap: 0.7rem;
`;
const StDetailHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
`;
const StResetButton = styled.button`
  border: 1px solid #d1d9e5;
  background: #fff;
  color: #52617b;
  border-radius: 999px;
  padding: 0.28rem 0.62rem;
  font-size: 0.72rem;
  font-weight: 700;
`;

const StMonthGroup = styled.section`
  h4 {
    font-size: 0.86rem;
    font-weight: 800;
    color: #1f2937;
    margin-bottom: 0.35rem;
  }
`;
const StAccordion = styled.section`
  border: 1px solid #e6edf5;
  border-radius: 10px;
  background: #fff;
  overflow: hidden;
  margin-bottom: 0.45rem;
`;
const StAccordionHeader = styled.button<{ $titleWidth: number }>`
  width: 100%;
  border: none;
  background: #f8fbff;
  padding: 0.5rem 0.6rem;
  display: grid;
  grid-template-columns: ${({ $titleWidth }) =>
    `${$titleWidth}px minmax(110px, 180px) minmax(92px, auto)`};
  align-items: center;
  gap: 0.55rem;
  text-align: left;
  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
    gap: 0.35rem;
  }
`;
const StAccordionTitleWrap = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  strong {
    font-size: 0.82rem;
    color: #2f3b4f;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  span {
    font-size: 0.7rem;
    color: #7a8495;
    flex-shrink: 0;
  }
`;
const StCategoryDot = styled.span`
  width: 0.72rem;
  height: 0.72rem;
  border-radius: 999px;
  flex-shrink: 0;
`;
const StAccordionGraph = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.35rem;
  align-items: center;
  justify-items: stretch;
  em {
    justify-self: flex-end;
    font-style: normal;
    font-size: 0.68rem;
    color: #60718b;
    line-height: 1;
  }
`;
const StAccordionTrack = styled.div`
  height: 0.5rem;
  border-radius: 999px;
  background: #e4ebf3;
  overflow: hidden;
  width: 100%;
`;
const StAccordionFill = styled.div`
  height: 100%;
  border-radius: inherit;
`;
const StAccordionRight = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  flex-shrink: 0;
  min-width: 96px;
  strong {
    font-size: 0.8rem;
    font-weight: 800;
    color: #1f2937;
    white-space: nowrap;
  }
`;
const StAccordionChevron = styled.svg<{ $open: boolean }>`
  width: 0.95rem;
  height: 0.95rem;
  fill: #60718b;
  flex-shrink: 0;
  transform: rotate(${({ $open }) => ($open ? "0deg" : "-90deg")});
  transition: transform 0.16s ease;
`;
const StAccordionBody = styled.div`
  padding: 0.45rem 0.5rem 0.55rem;
  display: grid;
  gap: 0.4rem;
`;

const StEntry = styled.article`
  border: 1px solid #edf1f5;
  border-radius: 10px;
  padding: 0.5rem 0.6rem;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.65rem;
  min-width: 0;
  > div {
    min-width: 0;
    flex: 1;
  }
  p {
    font-size: 0.8rem;
    color: #334155;
    font-weight: 700;
    white-space: normal;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  span {
    font-size: 0.72rem;
    color: #7a8495;
    display: block;
    white-space: normal;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  strong {
    font-size: 0.8rem;
    color: #111827;
    white-space: nowrap;
    flex-shrink: 0;
  }
`;

const StEmpty = styled.p`
  color: #8a94a6;
  font-size: 0.88rem;
`;
