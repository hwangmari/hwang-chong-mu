"use client";

import { useState } from "react";
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
  hideIncomeAmount?: boolean;
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
  hideIncomeAmount = false,
  onToggleAmountVisibility,
}: Props) {
  const shouldShowSupportDate = showSupportDate ?? !showDateMeta;
  const maxTrackingAmount = Math.max(
    ...(monthlyTracking?.map((row) => row.amount) || [0]),
  );
  const hasAssetEntries = (assetEntries?.length || 0) > 0;
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
    const badgeLabel = isSavingsCategory(entry.category)
      ? "저축"
      : entry.type === "income"
        ? "수입"
        : "지출";
    // 타입 배지(수입/지출/저축)와 겹치는 카테고리 메모는 중복이라 숨긴다.
    const supportLabels = buildSupportLabels(
      entry,
      categoryLabel,
      headline,
    ).filter((label) => !isSameMeaning(label, badgeLabel));
    const memoText = normalizeDisplayText(entry.memo);
    const accentTone = isSavingsCategory(entry.category)
      ? "asset"
      : entry.type === "income"
        ? "income"
        : "expense";
    const amountMasked =
      isAmountHidden || (hideIncomeAmount && entry.type === "income");

    const menuItems: Array<{
      key: string;
      label: string;
      onClick: () => void;
      active?: boolean;
      danger?: boolean;
    }> = [
      ...actions.map((action) => ({
        key: `action-${action.label}`,
        label: action.label,
        onClick: action.onClick,
        active: action.active,
      })),
    ];
    if (!entry.readonly && onEdit) {
      menuItems.push({ key: "edit", label: "수정", onClick: () => onEdit(entry) });
    }
    if (!entry.readonly && onDelete) {
      menuItems.push({
        key: "delete",
        label: "삭제",
        onClick: () => onDelete(entry.id),
        danger: true,
      });
    }
    const isMenuOpen = openMenuId === entry.resolvedId;
    const isShared = actions.some(
      (action) => action.active && action.label.includes("공유"),
    );

    return (
      <StEntryItem key={entry.resolvedId} $shared={isShared}>
        <StEntryTop>
          {entry.source !== "direct" ? (
            <StMemberBadge>{entry.member || "나"}</StMemberBadge>
          ) : null}
          <StEntryBadge $tone={accentTone}>{badgeLabel}</StEntryBadge>
          <StEntryPayment>
            {paymentLabel(entry.payment)}
            {entry.payment !== "cash" && entry.cardCompany
              ? ` · ${entry.cardCompany}`
              : ""}
          </StEntryPayment>
          {isShared ? <StSharedTag>공유중</StSharedTag> : null}
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
          {memoText && !isSameMeaning(memoText, headline) ? (
            <StEntryMemo>{memoText}</StEntryMemo>
          ) : null}
        </StEntryBox>
        <StEntryAmount $tone={accentTone} $hidden={amountMasked}>
          {amountMasked ? "금액 숨김" : formatAmount(entry.amount)}
        </StEntryAmount>
        <StEntryDateRow>
            {showDateMeta ? <StEntryMeta>{entry.date}</StEntryMeta> : null}
            {menuItems.length > 0 ? (
            <StEntryMenuAnchor>
              <StKebabButton
                type="button"
                aria-label="더보기"
                aria-expanded={isMenuOpen}
                onClick={() =>
                  setOpenMenuId(isMenuOpen ? null : entry.resolvedId)
                }
              >
                ⋯
              </StKebabButton>
              {isMenuOpen ? (
                <>
                  <StMenuBackdrop
                    type="button"
                    aria-label="메뉴 닫기"
                    onClick={() => setOpenMenuId(null)}
                  />
                  <StMenuPopover role="menu">
                    {menuItems.map((item) => (
                      <StMenuItem
                        key={`${entry.resolvedId}-${item.key}`}
                        type="button"
                        role="menuitem"
                        $danger={item.danger}
                        $active={item.active}
                        onClick={() => {
                          item.onClick();
                          setOpenMenuId(null);
                        }}
                      >
                        <span>{item.label}</span>
                        {item.active ? <StMenuCheck aria-hidden>✓</StMenuCheck> : null}
                      </StMenuItem>
                    ))}
                  </StMenuPopover>
                </>
              ) : null}
            </StEntryMenuAnchor>
            ) : null}
          </StEntryDateRow>
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
  color: ${({ theme }) => theme.colors.gray800};
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
  border: 1px solid #e1e2e3;
  background: ${({ theme }) => theme.colors.blue50};
  color: #71757d;
  border-radius: 999px;
  padding: 0.48rem 0.78rem;
  font-size: 0.75rem;
  font-weight: 800;
`;
const StDetailAddButton = styled.button`
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: #3182f6;
  color: ${({ theme }) => theme.colors.white};
  border-radius: 999px;
  font-size: 1.35rem;
  line-height: 1;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 22px rgba(49, 130, 246, 0.24);
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
  color: ${({ theme }) => theme.colors.gray500};
  padding: 0.25rem 0;
`;
const StEntryItem = styled.article<{ $shared?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-template-areas:
    "top amount"
    "box date";
  column-gap: 0.7rem;
  row-gap: 0.2rem;
  align-items: center;
  padding: 0.58rem 0.72rem;
  border: 1px solid ${({ $shared }) => ($shared ? "#d5e4fb" : "#ebeced")};
  border-radius: 13px;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 2px 8px rgba(36, 37, 39, 0.03);

  @media (max-width: 720px) {
    column-gap: 0.55rem;
  }
`;
const StEntryTop = styled.div`
  grid-area: top;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;

  @media (max-width: 720px) {
    gap: 0.3rem;
  }
`;
const StSharedTag = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.68rem;
  font-weight: 700;
  color: #7f9bc9;

  &::before {
    content: "";
    width: 0.34rem;
    height: 0.34rem;
    border-radius: 999px;
    background: #9db8e6;
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
    if ($tone === "income") return "#3182f6";
    if ($tone === "asset") return "#3182f6";
    return "#4e5968";
  }};
  background: ${({ $tone, theme }) => {
    if ($tone === "income") return "#e8f2fe";
    if ($tone === "asset") return "#e8f2fe";
    return theme.colors.gray100;
  }};
`;
const StMemberBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.2rem 0.56rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray700};
  background: ${({ theme }) => theme.colors.gray100};
`;
const StEntryPayment = styled.span`
  font-size: 0.72rem;
  color: #82868d;
  font-weight: 700;
`;
const StMirrorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray600};
  background: ${({ theme }) => theme.colors.gray100};
  border: 1px solid #e7e8e9;
`;

const StEntryBox = styled.div`
  grid-area: box;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.25rem 0.45rem;
`;

const StEntryName = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray900};
  font-weight: 500;
  line-height: 1.35;
  word-break: break-word;

  @media (max-width: 720px) {
    font-size: 0.86rem;
    line-height: 1.28;
  }
`;
const StEntryMetaList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.5rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.8rem;
  line-height: 1.45;
`;
const StEntryMetaText = styled.span`
  display: inline-flex;
  align-items: center;
  font-weight: 400;

  &:not(:first-child)::before {
    content: "·";
    margin-right: 0.5rem;
    color: #aeb0b5;
    font-weight: 400;
  }
`;
const StEntryMemo = styled.p`
  width: 100%;
  font-size: 0.76rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.45;
`;
const StEntryAmount = styled.span<{
  $tone: "income" | "expense" | "asset";
  $hidden?: boolean;
}>`
  grid-area: amount;
  justify-self: end;
  font-size: 0.98rem;
  font-weight: 900;
  text-align: right;
  color: ${({ $tone, $hidden }) => {
    if ($hidden) return "#8b95a1";
    if ($tone === "income") return "#3182f6";
    if ($tone === "asset") return "#3182f6";
    return "#333d4b";
  }};
  letter-spacing: -0.01em;

  @media (max-width: 720px) {
    font-size: 0.9rem;
    text-align: right;
  }
`;
const StEntryMeta = styled.span`
  font-size: 0.72rem;
  color: #82868d;
`;
const StEntryDateRow = styled.div`
  grid-area: date;
  justify-self: end;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
`;
const StEntryMenuAnchor = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
`;
const StKebabButton = styled.button`
  width: 1.65rem;
  height: 1.65rem;
  border: 1px solid #e6e7e9;
  background: ${({ theme }) => theme.colors.white};
  color: #6b6f77;
  border-radius: 999px;
  font-size: 0.95rem;
  line-height: 1;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;

  &:hover {
    border-color: #d3d5d9;
    background: ${({ theme }) => theme.colors.gray100};
  }
`;
const StMenuBackdrop = styled.button`
  position: fixed;
  inset: 0;
  z-index: 40;
  border: none;
  background: transparent;
  cursor: default;
`;
const StMenuPopover = styled.div`
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 41;
  min-width: 9.5rem;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  border: 1px solid #e9eaec;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 12px 28px rgba(26, 34, 49, 0.14);
`;
const StMenuItem = styled.button<{ $danger?: boolean; $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  border: none;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.gray100 : "transparent"};
  color: ${({ $danger }) => ($danger ? "#f04452" : "#3a3f47")};
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ $danger }) => ($danger ? "#fef2f3" : "#f4f5f7")};
  }
`;
const StMenuCheck = styled.span`
  color: #3182f6;
  font-size: 0.78rem;
  font-weight: 900;
`;
const StTrackingRow = styled.article`
  border: 1px solid ${({ theme }) => theme.colors.gray100};
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
    color: ${({ theme }) => theme.colors.gray800};
  }
  span {
    font-size: 0.75rem;
    color: #82868d;
  }
`;
const StTrackingBar = styled.div`
  height: 0.52rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray100};
  overflow: hidden;
`;
const StTrackingFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: #9a9ea4;
`;
const StTrackingAmount = styled.strong`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray900};
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
    color: #26457a;
  }

  span {
    font-size: 0.74rem;
    color: #898d94;
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
  border-top: 1px dashed #dee0e2;
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
