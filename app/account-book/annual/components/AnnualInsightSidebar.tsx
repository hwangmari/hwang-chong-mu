import {
  StCard,
  StSideColumn,
  StSectionHeader,
  StSectionTitle,
  StSectionMeta,
  StEmpty,
  StCategoryList,
  StCategoryItem,
  StPaymentLegend,
  StLegendItem,
  StCatSummaryList,
  StCatGroup,
  StCatButton,
  StCatMain,
  StCatRight,
  StCatChevron,
  StCatItems,
  StCatItem,
} from "../page.styles";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import type { AnnualKind, PaymentKey } from "../types";
import type { ResolvedAccountEntry } from "../../types";

const PAYMENT_META: Array<{ key: PaymentKey; label: string; color: string }> = [
  { key: "cash", label: "현금", color: "#868a92" },
  { key: "card", label: "카드", color: "#888c94" },
  { key: "check_card", label: "체크카드", color: "#3f8f8a" },
];

function formatCompactPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

type LabeledRow = {
  label: string;
  amount: number;
  ratio: number;
};

type CategoryGroup = {
  category: string;
  count: number;
  total: number;
  entries: ResolvedAccountEntry[];
};

type AnnualInsightSidebarProps = {
  kind: AnnualKind;
  selectedYear: number;
  selectedMonth: string | null;
  selectedCategory: string | null;
  incomeSourceRows: LabeledRow[];
  incomeMemberRows: LabeledRow[];
  paymentTotals: Record<PaymentKey, number>;
  insightTotal: number;
  insightCategoryGroups: CategoryGroup[];
  openAccordions: Record<string, boolean>;
  maskAmount: (value: number) => string;
  onToggleCategory: (category: string) => void;
};

export default function AnnualInsightSidebar({
  kind,
  selectedYear,
  selectedMonth,
  selectedCategory,
  incomeSourceRows,
  incomeMemberRows,
  paymentTotals,
  insightTotal,
  insightCategoryGroups,
  openAccordions,
  maskAmount,
  onToggleCategory,
}: AnnualInsightSidebarProps) {
  return (
    <StSideColumn>
      {kind === "income" ? (
        <>
          <StCard>
            <StSectionHeader>
              <StSectionTitle>들어온 항목</StSectionTitle>
              <StSectionMeta>
                {selectedMonth ? `${selectedMonth} 기준` : `${selectedYear}년 전체`}
              </StSectionMeta>
            </StSectionHeader>
            {incomeSourceRows.length === 0 ? (
              <StEmpty>수입 항목 데이터가 없습니다.</StEmpty>
            ) : (
              <StCategoryList>
                {incomeSourceRows.map((row) => (
                  <StCategoryItem key={row.label}>
                    <div>
                      <strong>{row.label}</strong>
                      <span>{formatCompactPercent(row.ratio)}</span>
                    </div>
                    <em>{maskAmount(row.amount)}</em>
                  </StCategoryItem>
                ))}
              </StCategoryList>
            )}
          </StCard>

          <StCard>
            <StSectionHeader>
              <StSectionTitle>기록한 사람</StSectionTitle>
              <StSectionMeta>
                {selectedMonth ? `${selectedMonth} 기준` : `${selectedYear}년 전체`}
              </StSectionMeta>
            </StSectionHeader>
            {incomeMemberRows.length === 0 ? (
              <StEmpty>작성자 데이터가 없습니다.</StEmpty>
            ) : (
              <StCategoryList>
                {incomeMemberRows.map((row) => (
                  <StCategoryItem key={row.label}>
                    <div>
                      <strong>{row.label}</strong>
                      <span>{formatCompactPercent(row.ratio)}</span>
                    </div>
                    <em>{maskAmount(row.amount)}</em>
                  </StCategoryItem>
                ))}
              </StCategoryList>
            )}
          </StCard>
        </>
      ) : (
        <>
          {kind !== "asset" ? (
            <StCard>
              <StSectionHeader>
                <StSectionTitle>결제 수단 비중</StSectionTitle>
                <StSectionMeta>
                  {selectedMonth ? `${selectedMonth} 기준` : `${selectedYear}년 전체`}
                </StSectionMeta>
              </StSectionHeader>
              <StPaymentLegend>
                {PAYMENT_META.map((payment) => {
                  const value = paymentTotals[payment.key];
                  const ratio = insightTotal > 0 ? (value / insightTotal) * 100 : 0;

                  return (
                    <StLegendItem key={payment.key}>
                      <div className="info">
                        <span
                          className="dot"
                          style={{ background: payment.color }}
                        />
                        <strong>{payment.label}</strong>
                      </div>
                      <div className="meta">
                        <em>{maskAmount(value)}</em>
                        <span>{formatCompactPercent(ratio)}</span>
                      </div>
                    </StLegendItem>
                  );
                })}
              </StPaymentLegend>
            </StCard>
          ) : null}

          <StCard>
            <StSectionHeader>
              <StSectionTitle>많이 나온 분류</StSectionTitle>
              <StSectionMeta>
                {selectedMonth ? `${selectedMonth} 기준` : `${selectedYear}년 전체`}
              </StSectionMeta>
            </StSectionHeader>
            {insightCategoryGroups.length === 0 ? (
              <StEmpty>분류할 데이터가 없습니다.</StEmpty>
            ) : (
              <StCatSummaryList>
                {insightCategoryGroups.map((group) => {
                  const isOpen = openAccordions[group.category] ?? false;
                  const ratio =
                    insightTotal > 0
                      ? (group.total / insightTotal) * 100
                      : 0;
                  return (
                    <StCatGroup key={group.category}>
                      <StCatButton
                        type="button"
                        $active={selectedCategory === group.category}
                        onClick={() => onToggleCategory(group.category)}
                      >
                        <StCatMain>
                          <strong>{group.category}</strong>
                          <span>
                            {formatCompactPercent(ratio)} ·{" "}
                            {group.count}건
                          </span>
                        </StCatMain>
                        <StCatRight>
                          <em>{maskAmount(group.total)}</em>
                          <StCatChevron $open={isOpen} aria-hidden>
                            <ExpandMoreRoundedIcon fontSize="inherit" />
                          </StCatChevron>
                        </StCatRight>
                      </StCatButton>
                      {isOpen ? (
                        <StCatItems>
                          {group.entries.map((entry) => (
                            <StCatItem key={entry.resolvedId}>
                              <div>
                                <strong>{entry.item}</strong>
                                <span>
                                  {entry.date}
                                  {entry.subCategory
                                    ? ` · ${entry.subCategory}`
                                    : ""}
                                </span>
                              </div>
                              <em>{maskAmount(entry.amount)}</em>
                            </StCatItem>
                          ))}
                        </StCatItems>
                      ) : null}
                    </StCatGroup>
                  );
                })}
              </StCatSummaryList>
            )}
          </StCard>
        </>
      )}
    </StSideColumn>
  );
}
