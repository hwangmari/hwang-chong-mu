"use client";

import styled from "styled-components";
import { CategoryOption, EntryType, PaymentType } from "../types";

type Props = {
  isOpen: boolean;
  isEditing: boolean;
  selectedDate: string;
  member: string;
  memberOptions: string[];
  type: EntryType;
  category: string;
  subCategory: string;
  item: string;
  amount: string;
  payment: PaymentType;
  memo: string;
  quickInput: string;
  categoryOptions: CategoryOption[];
  onClose: () => void;
  onSetDate: (date: string) => void;
  onSetType: (type: EntryType) => void;
  onSetMember: (member: string) => void;
  onSetCategory: (category: string) => void;
  onSetSubCategory: (value: string) => void;
  onSetItem: (value: string) => void;
  onSetAmount: (value: string) => void;
  onSetPayment: (payment: PaymentType) => void;
  onSetMemo: (value: string) => void;
  onSetQuickInput: (value: string) => void;
  onApplyQuickInput: () => void;
  onSubmit: () => void;
};

export default function EntryFormModal({
  isOpen,
  isEditing,
  selectedDate,
  member,
  memberOptions,
  type,
  category,
  subCategory,
  item,
  amount,
  payment,
  memo,
  quickInput,
  categoryOptions,
  onClose,
  onSetDate,
  onSetType,
  onSetMember,
  onSetCategory,
  onSetSubCategory,
  onSetItem,
  onSetAmount,
  onSetPayment,
  onSetMemo,
  onSetQuickInput,
  onApplyQuickInput,
  onSubmit,
}: Props) {
  if (!isOpen) return null;
  const isSavingCategory = type === "expense" && category === "저축";
  const savingSubCategories = ["예금", "적금", "주식", "ETF", "연금", "코인"];

  return (
    <StModalBackdrop onClick={onClose}>
      <StModalCard onClick={(event) => event.stopPropagation()}>
        <StModalHeader>
          <strong>{isEditing ? "내역 수정" : "내역 추가"}</strong>
          <StCloseButton type="button" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z" />
            </svg>
          </StCloseButton>
        </StModalHeader>

        <StFormRow $columns={3}>
          <StFormField>
            <StLabel>날짜</StLabel>
            <StInput
              type="date"
              value={selectedDate}
              onChange={(e) => onSetDate(e.target.value)}
            />
          </StFormField>
          <StFormField>
            <StLabel>작성자</StLabel>
            <StMemberSelector>
              {memberOptions.map((option) => (
                <StMemberOption
                  key={option}
                  type="button"
                  $active={member === option}
                  onClick={() => onSetMember(option)}
                >
                  {option}
                </StMemberOption>
              ))}
            </StMemberSelector>
          </StFormField>
          <StFormField>
            <StLabel>구분</StLabel>
            <StTypeSelector>
              <StTypeOption
                type="button"
                $active={type === "expense"}
                onClick={() => onSetType("expense")}
              >
                지출
              </StTypeOption>
              <StTypeOption
                type="button"
                $active={type === "income"}
                onClick={() => onSetType("income")}
              >
                수입
              </StTypeOption>
            </StTypeSelector>
          </StFormField>
        </StFormRow>

        <StFormRow $columns={3}>
          <StFormField>
            <StLabel>금액</StLabel>
            <StInput
              $large
              type="number"
              value={amount}
              onChange={(e) => onSetAmount(e.target.value)}
              placeholder="예: 15000"
            />
          </StFormField>
          <StFormField>
            <StLabel>세부항목</StLabel>
            <StPaymentSelector>
              <StPaymentOption
                type="button"
                $active={payment === "cash"}
                onClick={() => onSetPayment("cash")}
              >
                현금
              </StPaymentOption>
              {type === "expense" && (
                <>
                  <StPaymentOption
                    type="button"
                    $active={payment === "card"}
                    onClick={() => onSetPayment("card")}
                  >
                    카드
                  </StPaymentOption>
                  <StPaymentOption
                    type="button"
                    $active={payment === "check_card"}
                    onClick={() => onSetPayment("check_card")}
                  >
                    체크카드
                  </StPaymentOption>
                </>
              )}
            </StPaymentSelector>
          </StFormField>
          <StFormField>
            <StLabel>항목 / 메모</StLabel>
            <StInput
              value={item}
              onChange={(e) => onSetItem(e.target.value)}
              placeholder="예: 카카오 T 주차"
            />
            <StInlineSubInput
              value={memo}
              onChange={(e) => onSetMemo(e.target.value)}
              placeholder="메모 (선택)"
            />
          </StFormField>
        </StFormRow>

        <StFormRow $columns={1}>
          <StFormField>
            <StLabel>카테고리</StLabel>
            <StSelectedCategory>
              <span
                className="dot"
                style={{
                  background:
                    categoryOptions.find((o) => o.label === category)?.color ||
                    "#94a3b8",
                }}
              />
              <strong>{category || "카테고리를 선택하세요"}</strong>
              <StCategoryDescription>
                {categoryOptions.find((option) => option.label === category)
                  ?.description || "카테고리를 선택해주세요."}
              </StCategoryDescription>
            </StSelectedCategory>
            <StCategoryPicker>
              {categoryOptions.map((option) => (
                <StCategoryButton
                  key={option.label}
                  type="button"
                  $active={category === option.label}
                  onClick={() => onSetCategory(option.label)}
                >
                  <span className="icon">{option.icon}</span>
                  <span className="dot" style={{ background: option.color }} />
                  <span>{option.label}</span>
                </StCategoryButton>
              ))}
            </StCategoryPicker>
          </StFormField>
        </StFormRow>

        {isSavingCategory && (
          <StFormRow>
            <StFormField>
              <StLabel>저축 세부카테고리</StLabel>
              <StSubCategorySelector>
                {savingSubCategories.map((option) => (
                  <StSubCategoryOption
                    key={option}
                    type="button"
                    $active={subCategory === option}
                    onClick={() => onSetSubCategory(option)}
                  >
                    {option}
                  </StSubCategoryOption>
                ))}
              </StSubCategorySelector>
              <StInput
                value={subCategory}
                onChange={(e) => onSetSubCategory(e.target.value)}
                placeholder="예: 예금, 주식"
              />
            </StFormField>
          </StFormRow>
        )}

        <StQuickInputBox>
          <StLabel>텍스트로 빠르게 입력</StLabel>
          <StQuickRow>
            <StQuickTextarea
              value={quickInput}
              onChange={(e) => onSetQuickInput(e.target.value)}
              placeholder="예: 남편 지출 식당 30000, 쇼핑 20000, 차비 10000"
            />
            <StQuickButton type="button" onClick={onApplyQuickInput}>
              해석
            </StQuickButton>
          </StQuickRow>
        </StQuickInputBox>

        <StAddButton type="button" onClick={onSubmit}>
          {isEditing ? "수정 저장" : "내역 추가"}
        </StAddButton>
      </StModalCard>
    </StModalBackdrop>
  );
}

const StFormRow = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: ${({ $columns = 2 }) =>
    `repeat(${$columns}, minmax(0, 1fr))`};
  gap: 0.65rem;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;
const StQuickInputBox = styled.div`
  margin-bottom: 0.75rem;
`;
const StQuickRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: stretch;
`;
const StQuickTextarea = styled.textarea`
  width: 100%;
  min-height: 68px;
  border: 1px solid #dce3eb;
  border-radius: 10px;
  padding: 0.62rem 0.7rem;
  font-size: 0.88rem;
  background: #fff;
  color: #111827;
  resize: vertical;
  &:focus {
    outline: none;
    border-color: #6fa6c9;
    box-shadow: 0 0 0 3px rgba(111, 166, 201, 0.15);
  }
`;
const StQuickButton = styled.button`
  border: 1px solid #bfd2e4;
  background: #edf6fe;
  color: #2f5f95;
  border-radius: 10px;
  min-width: 64px;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0 0.75rem;
`;
const StFormField = styled.div`
  margin-bottom: 0.65rem;
`;
const StSelectedCategory = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.45rem;
  .dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 999px;
    flex-shrink: 0;
  }
  strong {
    font-size: 0.82rem;
    color: #374151;
  }
`;
const StCategoryPicker = styled.div`
  max-height: 190px;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
  padding-right: 0.25rem;
  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const StCategoryButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#b9d0e5" : "#e5eaf0")};
  background: ${({ $active }) => ($active ? "#f1f7fc" : "#fff")};
  border-radius: 8px;
  padding: 0.4rem 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  text-align: left;
  font-size: 0.82rem;
  color: #334155;
  .dot {
    width: 0.62rem;
    height: 0.62rem;
    border-radius: 999px;
    flex-shrink: 0;
  }
  .icon {
    font-size: 0.9rem;
    line-height: 1;
  }
`;
const StCategoryDescription = styled.p`
  font-size: 0.75rem;
  color: #708197;
`;
const StLabel = styled.label`
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 700;
`;
const StTypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
`;
const StTypeOption = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#b7d0e5" : "#dce3eb")};
  background: ${({ $active }) => ($active ? "#eff6fc" : "#fff")};
  color: ${({ $active }) => ($active ? "#2f5f95" : "#5b6475")};
  border-radius: 9px;
  padding: 0.55rem 0.5rem;
  font-size: 0.85rem;
  font-weight: 700;
`;
const StMemberSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
`;
const StMemberOption = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#b7d0e5" : "#dce3eb")};
  background: ${({ $active }) => ($active ? "#eff6fc" : "#fff")};
  color: ${({ $active }) => ($active ? "#2f5f95" : "#5b6475")};
  border-radius: 9px;
  padding: 0.55rem 0.5rem;
  font-size: 0.82rem;
  font-weight: 700;
`;
const StPaymentSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 0.4rem;
`;
const StPaymentOption = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#b7d0e5" : "#dce3eb")};
  background: ${({ $active }) => ($active ? "#eff6fc" : "#fff")};
  color: ${({ $active }) => ($active ? "#2f5f95" : "#5b6475")};
  border-radius: 9px;
  padding: 0.55rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
`;
const StSubCategorySelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.45rem;
`;
const StSubCategoryOption = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#b7d0e5" : "#dce3eb")};
  background: ${({ $active }) => ($active ? "#eff6fc" : "#fff")};
  color: ${({ $active }) => ($active ? "#2f5f95" : "#5b6475")};
  border-radius: 999px;
  padding: 0.32rem 0.6rem;
  font-size: 0.76rem;
  font-weight: 700;
`;
const inputBase = `
  width: 100%;
  border: 1px solid #dce3eb;
  border-radius: 10px;
  padding: 0.62rem 0.7rem;
  font-size: 0.9rem;
  background: #fff;
  color: #111827;
  &:focus {
    outline: none;
    border-color: #6fa6c9;
    box-shadow: 0 0 0 3px rgba(111, 166, 201, 0.15);
  }
`;
const StInput = styled.input<{ $large?: boolean }>`
  ${inputBase}
  ${({ $large }) =>
    $large
      ? `
    min-height: 52px;
    font-size: 1rem;
    padding: 0.72rem 0.78rem;
  `
      : ""}
`;
const StInlineSubInput = styled.input`
  ${inputBase}
  margin-top: 0.35rem;
`;
const StAddButton = styled.button`
  width: 100%;
  border: none;
  border-radius: 11px;
  padding: 0.75rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  background: linear-gradient(135deg, #6d87ef, #5f73d9);
`;
const StModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 120;
`;
const StModalCard = styled.div`
  width: min(680px, 100%);
  max-height: 80vh;
  overflow: auto;
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 0.9rem;
`;
const StModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.7rem;
  strong {
    font-size: 1.35rem;
    font-weight: 900;
    color: #111827;
  }
`;
const StCloseButton = styled.button`
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 999px;
  background: #f1f4f8;
  color: #49566d;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
`;
