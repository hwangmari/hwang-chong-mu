"use client";

import styled from "styled-components";
import { ResolvedAccountEntry } from "../types";
import {
  formatPreviewDate,
  getRepresentativeCategory,
  isSavingsCategory,
} from "./WorkspaceLedgerView/utils";

type EntryAction = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

type Props = {
  title: string;
  entries: ResolvedAccountEntry[];
  assetEntries?: ResolvedAccountEntry[];
  groupedEntries?: Array<{
    id: string;
    title: string;
    amount: number;
    count: number;
    entries: ResolvedAccountEntry[];
  }>;
  monthlyTracking?: Array<{ month: string; amount: number; count: number }>;
  onOpenAdd: () => void;
  onEdit?: (entry: ResolvedAccountEntry) => void;
  onDelete?: (id: string) => void;
  entryActions?: (entry: ResolvedAccountEntry) => EntryAction[];
  formatAmount: (value: number) => string;
  paymentLabel: (payment: ResolvedAccountEntry["payment"]) => string;
  showDateMeta?: boolean;
  showSupportDate?: boolean;
  canToggleAmountVisibility?: boolean;
  isAmountHidden?: boolean;
  onToggleAmountVisibility?: () => void;
};

export default function DetailEntriesPanel({
  title,
  entries,
  assetEntries,
  groupedEntries,
  monthlyTracking,
  onOpenAdd,
  onEdit,
  onDelete,
  entryActions,
  formatAmount,
  paymentLabel,
  showDateMeta = false,
  showSupportDate,
  canToggleAmountVisibility = false,
  isAmountHidden = false,
  onToggleAmountVisibility,
}: Props) {
  const shouldShowSupportDate = showSupportDate ?? !showDateMeta;
  const maxTrackingAmount = Math.max(
    ...(monthlyTracking?.map((row) => row.amount) || [0]),
  );
  const hasAssetEntries = (assetEntries?.length || 0) > 0;

  const formatEntryRawText = (entry: ResolvedAccountEntry) => {
    if (!entry.rawText) return "";
    if (!/(오늘|어제|그제)/.test(entry.rawText)) return entry.rawText;
    return entry.rawText.replace(
      /오늘|어제|그제/g,
      formatPreviewDate(entry.date),
    );
  };

  const normalizeDisplayText = (value?: string) =>
    (value || "")
      .replace(/\s*#fixed-template:[a-z0-9-]+\s*/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const toCompareKey = (value?: string) =>
    normalizeDisplayText(value)
      .toLowerCase()
      .replace(/[^0-9a-zA-Z가-힣]+/g, "");

  const isSameMeaning = (left?: string, right?: string) => {
    const leftKey = toCompareKey(left);
    const rightKey = toCompareKey(right);
    return Boolean(leftKey) && Boolean(rightKey) && leftKey === rightKey;
  };

  const isDateOnlyLabel = (value?: string) => {
    const normalized = normalizeDisplayText(value);
    return /^(?:\d{1,2}일(?:\s*[가-힣]+요일)?|일)$/.test(normalized);
  };

  const getCondensedRawDetail = (entry: ResolvedAccountEntry) => {
    const formattedText = formatEntryRawText(entry);
    if (!formattedText) return "";

    return normalizeDisplayText(
      formattedText
        .replace(/\d{4}-\d{2}-\d{2}/g, " ")
        .replace(/\d{1,2}월\s*\d{1,2}일(?:\s*[가-힣]+요일)?/g, " ")
        .replace(/오늘|어제|그제/g, " ")
        .replace(/-?\d[\d,]*원/g, " ")
        .replace(/일시불|할부|체크카드|체크|현금|카드/g, " ")
        .replace(entry.cardCompany, " ")
        .replace(entry.member || "", " "),
    );
  };

  const buildCategoryLabel = (
    entry: ResolvedAccountEntry,
    representativeCategory: string,
  ) => {
    const categoryDetail = normalizeDisplayText(
      entry.subCategory ||
        (isSameMeaning(entry.category, representativeCategory)
          ? ""
          : entry.category),
    );

    if (
      !categoryDetail ||
      isSameMeaning(categoryDetail, representativeCategory)
    ) {
      return representativeCategory;
    }

    return `${representativeCategory} · ${categoryDetail}`;
  };

  const buildHeadline = (
    entry: ResolvedAccountEntry,
    categoryLabel: string,
  ) => {
    const candidates = [
      normalizeDisplayText(entry.item),
      normalizeDisplayText(entry.merchant),
      getCondensedRawDetail(entry),
      categoryLabel,
    ];

    return (
      candidates.find(
        (candidate, index) =>
          candidate &&
          candidates
            .slice(0, index)
            .every((previous) => !isSameMeaning(previous, candidate)),
      ) || "내역"
    );
  };

  const buildSupportLabels = (
    entry: ResolvedAccountEntry,
    categoryLabel: string,
    headline: string,
  ) => {
    const labels: string[] = [];
    const pushLabel = (value?: string) => {
      const normalized = normalizeDisplayText(value);
      if (!normalized) return;
      if (isDateOnlyLabel(normalized)) return;
      if (labels.some((label) => isSameMeaning(label, normalized))) return;
      if (isSameMeaning(headline, normalized)) return;
      labels.push(normalized);
    };

    pushLabel(categoryLabel);
    pushLabel(entry.merchant);

    if (shouldShowSupportDate) {
      pushLabel(formatPreviewDate(entry.date));
    }

    if (entry.sourceWorkspaceName && entry.source !== "direct") {
      pushLabel(entry.sourceWorkspaceName);
    }

    return labels;
  };

  const renderEntryItem = (entry: ResolvedAccountEntry) => {
    const actions = entryActions ? entryActions(entry) : [];
    const representativeCategory = getRepresentativeCategory(
      entry.category,
      entry.type,
    );
    const categoryLabel = buildCategoryLabel(entry, representativeCategory);
    const headline = buildHeadline(entry, categoryLabel);
    const supportLabels = buildSupportLabels(entry, categoryLabel, headline);
    const memoText = normalizeDisplayText(entry.memo);
    const accentTone = isSavingsCategory(entry.category)
      ? "asset"
      : entry.type === "income"
        ? "income"
        : "expense";

    return (
      <StEntryItem key={entry.resolvedId}>
        <StEntryMain>
          <StEntryTop>
            <StMemberBadge>{entry.member || "나"}</StMemberBadge>
            <StEntryBadge $tone={accentTone}>
              {isSavingsCategory(entry.category)
                ? "저축"
                : entry.type === "income"
                  ? "수입"
                  : "지출"}
            </StEntryBadge>
            <StEntryPayment>
              {paymentLabel(entry.payment)}
              {entry.payment !== "cash" && entry.cardCompany
                ? ` · ${entry.cardCompany}`
                : ""}
            </StEntryPayment>
            {entry.source !== "direct" ? (
              <StMirrorBadge>
                {entry.source === "shared_link"
                  ? "공용방에 공유됨"
                  : "공용방 자동반영"}
              </StMirrorBadge>
            ) : null}
          </StEntryTop>
          <StEntryBox>
            <StEntryName>{headline}</StEntryName>
            {supportLabels.length > 0 ? (
              <StEntryMetaList>
                {supportLabels.map((label) => (
                  <StEntryMetaText key={`${entry.resolvedId}-${label}`}>
                    {label}
                  </StEntryMetaText>
                ))}
              </StEntryMetaList>
            ) : null}
            {memoText ? <StEntryMemo>{memoText}</StEntryMemo> : null}
          </StEntryBox>
          {actions.length > 0 ? (
            <StEntryActions>
              {actions.map((action) => (
                <StEntryActionButton
                  key={`${entry.resolvedId}-${action.label}`}
                  type="button"
                  $active={Boolean(action.active)}
                  onClick={action.onClick}
                >
                  {action.label}
                </StEntryActionButton>
              ))}
            </StEntryActions>
          ) : null}
        </StEntryMain>
        <StEntryAside>
          <StEntryAmount $tone={accentTone} $hidden={isAmountHidden}>
            {isAmountHidden ? "금액 숨김" : formatAmount(entry.amount)}
          </StEntryAmount>
          {showDateMeta ? <StEntryMeta>{entry.date}</StEntryMeta> : null}
          {!entry.readonly && (onEdit || onDelete) ? (
            <StEntryControlGroup>
              {onEdit ? (
                <StEditButton type="button" onClick={() => onEdit(entry)}>
                  수정
                </StEditButton>
              ) : null}
              {onDelete ? (
                <StDeleteButton
                  type="button"
                  onClick={() => onDelete(entry.id)}
                >
                  삭제
                </StDeleteButton>
              ) : null}
            </StEntryControlGroup>
          ) : null}
        </StEntryAside>
      </StEntryItem>
    );
  };

  return (
    <StPanel>
      <StDetailHeader>
        <StBlockTitle>{title}</StBlockTitle>
        <StDetailHeaderActions>
          {canToggleAmountVisibility ? (
            <StDetailVisibilityButton
              type="button"
              onClick={onToggleAmountVisibility}
            >
              {isAmountHidden ? "금액 보기" : "금액 숨기기"}
            </StDetailVisibilityButton>
          ) : null}
          <StDetailAddButton
            type="button"
            onClick={onOpenAdd}
            aria-label="내역 추가"
          >
            +
          </StDetailAddButton>
        </StDetailHeaderActions>
      </StDetailHeader>
      <StEntryList>
        {groupedEntries ? (
          groupedEntries.length === 0 ? (
            <StEmpty>내역이 없습니다.</StEmpty>
          ) : (
            groupedEntries.map((group) => (
              <StGroupedSection key={group.id}>
                <StGroupedHeader>
                  <div>
                    <strong>{group.title}</strong>
                    <span>{group.count}건</span>
                  </div>
                  <em>{formatAmount(group.amount)}</em>
                </StGroupedHeader>
                <StGroupedList>
                  {group.entries.map((entry) => renderEntryItem(entry))}
                </StGroupedList>
              </StGroupedSection>
            ))
          )
        ) : monthlyTracking ? (
          monthlyTracking.length === 0 ? (
            <StEmpty>월별 통계 데이터가 없습니다.</StEmpty>
          ) : (
            monthlyTracking.map((row) => {
              const width =
                row.amount > 0 && maxTrackingAmount > 0
                  ? `${Math.max((row.amount / maxTrackingAmount) * 100, 4)}%`
                  : "0%";

              return (
                <StTrackingRow key={row.month}>
                  <StTrackingMeta>
                    <strong>{row.month}</strong>
                    <span>{row.count}건</span>
                  </StTrackingMeta>
                  <StTrackingBar>
                    <StTrackingFill style={{ width }} />
                  </StTrackingBar>
                  <StTrackingAmount>
                    {formatAmount(row.amount)}
                  </StTrackingAmount>
                </StTrackingRow>
              );
            })
          )
        ) : entries.length === 0 && !hasAssetEntries ? (
          <StEmpty>내역이 없습니다.</StEmpty>
        ) : (
          <>
            {entries.map((entry) => renderEntryItem(entry))}
            {hasAssetEntries ? (
              <StAssetSection>
                <StAssetTitle>자산</StAssetTitle>
                <StAssetList>
                  {assetEntries!.map((entry) => renderEntryItem(entry))}
                </StAssetList>
              </StAssetSection>
            ) : null}
          </>
        )}
      </StEntryList>
    </StPanel>
  );
}

const StPanel = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const StBlockTitle = styled.h3`
  font-size: 1.08rem;
  font-weight: 900;
  color: #1f2937;
  margin-bottom: 0.2rem;
`;
const StDetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding-bottom: 0.55rem;
`;
const StDetailHeaderActions = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
`;
const StDetailVisibilityButton = styled.button`
  border: 1px solid #d6e0ee;
  background: #f8fbff;
  color: #61738d;
  border-radius: 999px;
  padding: 0.48rem 0.78rem;
  font-size: 0.75rem;
  font-weight: 800;
`;
const StDetailAddButton = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: linear-gradient(135deg, #6d87ef, #5f73d9);
  color: #fff;
  border-radius: 999px;
  font-size: 1.35rem;
  line-height: 1;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 22px rgba(95, 115, 217, 0.2);
`;
const StEntryList = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  min-height: 0;
  padding-bottom: 1rem;
`;
const StEmpty = styled.p`
  font-size: 0.9rem;
  color: #8a94a6;
  padding: 0.25rem 0;
`;
const StEntryItem = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.85rem;
  padding: 0.82rem 0.9rem;
  border: 1px solid #e3ebf5;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.04);

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.65rem;
    align-items: start;
  }
`;
const StEntryMain = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.32rem;
`;
const StEntryTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.12rem;

  @media (max-width: 720px) {
    gap: 0.32rem;
  }
`;
const StEntryBadge = styled.span<{
  $tone: "income" | "expense" | "asset";
}>`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.56rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ $tone }) => {
    if ($tone === "income") return "#4f7cff";
    if ($tone === "asset") return "#3f8f8a";
    return "#6b63e8";
  }};
  background: ${({ $tone }) => {
    if ($tone === "income") return "#eef4ff";
    if ($tone === "asset") return "#eef8f7";
    return "#f2f0ff";
  }};
`;
const StMemberBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.56rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #335a95;
  background: #eef4ff;
`;
const StEntryPayment = styled.span`
  font-size: 0.72rem;
  color: #7a8495;
  font-weight: 700;
`;
const StMirrorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #5d6e87;
  background: #f3f6fa;
  border: 1px solid #e1e7ef;
`;

const StEntryBox = styled.div`
  min-width: 0;

  @media (max-width: 720px) {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
`;

const StEntryName = styled.p`
  font-size: 1rem;
  color: #111827;
  font-weight: 800;
  line-height: 1.35;
  word-break: break-word;

  @media (max-width: 720px) {
    font-size: 0.94rem;
    line-height: 1.28;
  }
`;
const StEntryMetaList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.5rem;
  color: #64748b;
  font-size: 0.8rem;
  line-height: 1.45;
`;
const StEntryMetaText = styled.span`
  display: inline-flex;
  align-items: center;
  font-weight: 700;

  &:not(:first-child)::before {
    content: "·";
    margin-right: 0.5rem;
    color: #a1afc2;
    font-weight: 700;
  }
`;
const StEntryMemo = styled.p`
  font-size: 0.76rem;
  color: #8a94a6;
  line-height: 1.45;
`;
const StEntryActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.18rem;
`;
const StEntryActionButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#99b4ff" : "#d9e4f1")};
  background: ${({ $active }) => ($active ? "#edf3ff" : "#f7f9fc")};
  color: ${({ $active }) => ($active ? "#3557b6" : "#66758b")};
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.2rem 0.5rem;
`;
const StEntryAside = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.4rem;
  min-width: 6.8rem;

  @media (max-width: 720px) {
    align-items: flex-end;
    min-width: 0;
  }
`;
const StEntryAmount = styled.span<{
  $tone: "income" | "expense" | "asset";
  $hidden?: boolean;
}>`
  font-size: 0.98rem;
  font-weight: 900;
  text-align: right;
  color: ${({ $tone, $hidden }) => {
    if ($hidden) return "#8b95a6";
    if ($tone === "income") return "#4f7cff";
    if ($tone === "asset") return "#3f8f8a";
    return "#6b63e8";
  }};
  letter-spacing: -0.01em;

  @media (max-width: 720px) {
    font-size: 0.9rem;
    text-align: right;
  }
`;
const StEntryMeta = styled.span`
  font-size: 0.72rem;
  color: #7a8495;
`;
const StEntryControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;

  @media (max-width: 720px) {
    justify-content: flex-end;
    gap: 0.35rem;
  }
`;
const StEditButton = styled.button`
  border: 1px solid #d7e3ff;
  background: #f3f7ff;
  color: #4b76c6;
  border-radius: 999px;
  padding: 0.28rem 0.68rem;
  font-size: 0.76rem;
  font-weight: 800;
`;
const StDeleteButton = styled.button`
  border: 1px solid #e3e8ef;
  background: #ffffff;
  color: #7e8a9b;
  border-radius: 999px;
  padding: 0.28rem 0.68rem;
  font-size: 0.76rem;
  font-weight: 800;
`;
const StTrackingRow = styled.article`
  border: 1px solid #edf1f5;
  border-radius: 12px;
  padding: 0.65rem 0.7rem;
  display: grid;
  gap: 0.45rem;
`;
const StTrackingMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  strong {
    font-size: 0.86rem;
    color: #1f2937;
  }
  span {
    font-size: 0.75rem;
    color: #7a8495;
  }
`;
const StTrackingBar = styled.div`
  height: 0.52rem;
  border-radius: 999px;
  background: #edf1f5;
  overflow: hidden;
`;
const StTrackingFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #78a8e9, #5f86da);
`;
const StTrackingAmount = styled.strong`
  font-size: 0.9rem;
  color: #111827;
`;
const StGroupedSection = styled.section`
  display: grid;
  gap: 0.6rem;
`;
const StGroupedHeader = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.75rem;

  div {
    display: grid;
    gap: 0.12rem;
  }

  strong {
    font-size: 0.9rem;
    color: #315e84;
  }

  span {
    font-size: 0.74rem;
    color: #7d8ca0;
    font-weight: 700;
  }

  em {
    font-style: normal;
    font-size: 0.84rem;
    font-weight: 900;
    color: #3f8f8a;
    white-space: nowrap;
  }
`;
const StGroupedList = styled.div`
  display: grid;
  gap: 0.6rem;
`;
const StAssetSection = styled.section`
  margin-top: 0.45rem;
  padding-top: 0.7rem;
  border-top: 1px dashed #d8dee8;
`;
const StAssetTitle = styled.h4`
  font-size: 0.86rem;
  font-weight: 800;
  color: #3f8f8a;
  margin-bottom: 0.6rem;
`;
const StAssetList = styled.div`
  display: grid;
  gap: 0.6rem;
`;
