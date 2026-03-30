"use client";

import styled from "styled-components";
import { EntryType, ResolvedAccountEntry } from "../types";
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

    return (
      <StEntryItem key={entry.resolvedId}>
        <StEntryMain>
          <StEntryTop>
            <StMemberBadge>{entry.member || "나"}</StMemberBadge>
            <StEntryBadge $kind={entry.type}>
              {entry.type === "income" ? "수입" : "지출"}
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
          <StEntryMemo>{entry.memo || ""}</StEntryMemo>
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
          <StEntryAmount $kind={entry.type}>
            {formatAmount(entry.amount)}
          </StEntryAmount>
          {showDateMeta ? <StEntryMeta>{entry.date}</StEntryMeta> : null}
          {!entry.readonly && onEdit ? (
            <StEditButton type="button" onClick={() => onEdit(entry)}>
              수정
            </StEditButton>
          ) : null}
          {!entry.readonly && onDelete ? (
            <StDeleteButton type="button" onClick={() => onDelete(entry.id)}>
              삭제
            </StDeleteButton>
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
  font-size: 1rem;
  font-weight: 800;
  color: #1f2937;
  margin-bottom: 0.65rem;
`;
const StDetailHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;
const StDetailAddButton = styled.button`
  width: 2rem;
  height: 2rem;
  border: none;
  background: linear-gradient(135deg, #6d87ef, #5f73d9);
  color: #fff;
  border-radius: 999px;
  font-size: 1.25rem;
  line-height: 1;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(95, 115, 217, 0.28);
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
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem;
  border: 1px solid #edf1f5;
  border-radius: 12px;
`;
const StEntryMain = styled.div`
  min-width: 0;
`;
const StEntryTop = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.35rem;
`;
const StEntryBadge = styled.span<{ $kind: EntryType }>`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.16rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: ${({ $kind }) => ($kind === "income" ? "#1f8f5a" : "#b73f67")};
  background: ${({ $kind }) => ($kind === "income" ? "#eaf8f0" : "#ffe8f0")};
`;
const StMemberBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.16rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #224a82;
  background: #e8f2ff;
`;
const StEntryPayment = styled.span`
  font-size: 0.72rem;
  color: #7a8495;
`;
const StMirrorBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.16rem 0.45rem;
  font-size: 0.68rem;
  font-weight: 800;
  color: #55667f;
  background: #eef3f8;
`;
const StEntryCategory = styled.p`
  font-size: 0.92rem;
  color: #374151;
  font-weight: 700;
`;
const StEntrySubCategory = styled.p`
  font-size: 0.76rem;
  color: #4d6ea0;
  font-weight: 700;
  margin-top: 0.08rem;
`;
const StEntryName = styled.p`
  font-size: 0.88rem;
  color: #111827;
  margin-top: 0.15rem;
`;
const StEntryMerchant = styled.p`
  margin-top: 0.14rem;
  font-size: 0.76rem;
  font-weight: 800;
  color: #355b92;
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
  gap: 0.25rem;
`;
const StEntryAmount = styled.span<{ $kind: EntryType }>`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ $kind }) => ($kind === "income" ? "#27a269" : "#da4f7f")};
`;
const StEntryMeta = styled.span`
  font-size: 0.72rem;
  color: #7a8495;
`;
const StEditButton = styled.button`
  border: none;
  background: transparent;
  color: #4b76c6;
  font-size: 0.78rem;
`;
const StDeleteButton = styled.button`
  border: none;
  background: transparent;
  color: #8a94a6;
  font-size: 0.78rem;
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
  margin-top: 0.35rem;
  padding-top: 0.4rem;
  border-top: 1px dashed #d8dee8;
`;
const StAssetTitle = styled.h4`
  font-size: 0.86rem;
  font-weight: 800;
  color: #2d4f83;
  margin-bottom: 0.5rem;
`;
const StAssetList = styled.div`
  display: grid;
  gap: 0.6rem;
`;
