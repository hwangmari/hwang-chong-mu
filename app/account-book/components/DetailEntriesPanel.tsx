"use client";

import styled from "styled-components";
import { ResolvedAccountEntry } from "../types";
import { formatPreviewDate } from "./WorkspaceLedgerView/utils";

type EntryAction = {
  label: string;
  active?: boolean;
  onClick: () => void;
};

type Props = {
  title: string;
  entries: ResolvedAccountEntry[];
  assetEntries?: ResolvedAccountEntry[];
  monthlyTracking?: Array<{ month: string; amount: number; count: number }>;
  onOpenAdd: () => void;
  onEdit?: (entry: ResolvedAccountEntry) => void;
  onDelete?: (id: string) => void;
  entryActions?: (entry: ResolvedAccountEntry) => EntryAction[];
  formatAmount: (value: number) => string;
  paymentLabel: (payment: ResolvedAccountEntry["payment"]) => string;
  showDateMeta?: boolean;
};

export default function DetailEntriesPanel({
  title,
  entries,
  assetEntries,
  monthlyTracking,
  onOpenAdd,
  onEdit,
  onDelete,
  entryActions,
  formatAmount,
  paymentLabel,
  showDateMeta = false,
}: Props) {
  const maxTrackingAmount = Math.max(
    ...(monthlyTracking?.map((row) => row.amount) || [0]),
  );
  const hasAssetEntries = (assetEntries?.length || 0) > 0;

  const formatEntryRawText = (entry: ResolvedAccountEntry) => {
    if (!entry.rawText) return "";
    if (!/(오늘|어제|그제)/.test(entry.rawText)) return entry.rawText;
    return entry.rawText.replace(/오늘|어제|그제/g, formatPreviewDate(entry.date));
  };

  const renderEntryItem = (entry: ResolvedAccountEntry) => {
    const actions = entryActions ? entryActions(entry) : [];
    const accentTone =
      entry.category.trim() === "저축"
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
              {entry.category.trim() === "저축"
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
                {entry.source === "shared_link" ? "공용방에 공유됨" : "공용방 자동반영"}
              </StMirrorBadge>
            ) : null}
          </StEntryTop>
          <StEntryCategory>{entry.category}</StEntryCategory>
          {entry.subCategory ? (
            <StEntrySubCategory>{entry.subCategory}</StEntrySubCategory>
          ) : null}
          {entry.merchant ? <StEntryMerchant>{entry.merchant}</StEntryMerchant> : null}
          <StEntryName>{entry.item}</StEntryName>
          {entry.memo.trim() ? <StEntryMemo>{entry.memo}</StEntryMemo> : null}
          {entry.rawText ? (
            <StEntryRawText>{formatEntryRawText(entry)}</StEntryRawText>
          ) : null}
          {entry.sourceWorkspaceName && entry.source !== "direct" ? (
            <StEntrySource>{entry.sourceWorkspaceName}</StEntrySource>
          ) : null}
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
          <StEntryAmount $tone={accentTone}>
            {formatAmount(entry.amount)}
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
                <StDeleteButton type="button" onClick={() => onDelete(entry.id)}>
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
        <StDetailAddButton type="button" onClick={onOpenAdd} aria-label="내역 추가">
          +
        </StDetailAddButton>
      </StDetailHeader>
      <StEntryList>
        {monthlyTracking ? (
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
                  <StTrackingAmount>{formatAmount(row.amount)}</StTrackingAmount>
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
  height: 100%;
  overflow: hidden;
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
  overflow-y: auto;
  padding-right: 0.25rem;
  padding-bottom: 1rem;
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
`;
const StEmpty = styled.p`
  font-size: 0.9rem;
  color: #8a94a6;
  padding: 0.25rem 0;
`;
const StEntryItem = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  padding: 0.95rem 1rem;
  border: 1px solid #e3ebf5;
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff, #fbfdff);
  box-shadow: 0 8px 24px rgba(31, 41, 55, 0.04);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;
const StEntryMain = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.14rem;
`;
const StEntryTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.42rem;
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
const StEntryCategory = styled.p`
  font-size: 0.96rem;
  color: #24344a;
  font-weight: 700;
`;
const StEntrySubCategory = styled.p`
  font-size: 0.77rem;
  color: #4d6ea0;
  font-weight: 700;
  margin-top: 0.08rem;
`;
const StEntryName = styled.p`
  font-size: 0.95rem;
  color: #111827;
  font-weight: 800;
  margin-top: 0.18rem;
`;
const StEntryMerchant = styled.p`
  margin-top: 0.14rem;
  font-size: 0.76rem;
  font-weight: 800;
  color: #5470a0;
`;
const StEntryMemo = styled.p`
  font-size: 0.76rem;
  color: #8a94a6;
`;
const StEntryRawText = styled.p`
  margin-top: 0.22rem;
  font-size: 0.73rem;
  line-height: 1.45;
  color: #708197;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (max-width: 720px) {
    display: none;
  }
`;
const StEntrySource = styled.p`
  margin-top: 0.2rem;
  font-size: 0.72rem;
  color: #4e6ca1;
  font-weight: 700;
`;
const StEntryActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.45rem;
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
  gap: 0.55rem;
  min-width: 7.4rem;

  @media (max-width: 720px) {
    align-items: flex-start;
    min-width: 0;
  }
`;
const StEntryAmount = styled.span<{
  $tone: "income" | "expense" | "asset";
}>`
  font-size: 1.05rem;
  font-weight: 900;
  color: ${({ $tone }) => {
    if ($tone === "income") return "#4f7cff";
    if ($tone === "asset") return "#3f8f8a";
    return "#6b63e8";
  }};
  letter-spacing: -0.01em;
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
