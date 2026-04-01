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
  merchant: string;
  item: string;
  amount: string;
  payment: PaymentType;
  cardCompany: string;
  memo: string;
  quickInput: string;
  categoryOptions: CategoryOption[];
  categoryDetailOptions: string[];
  cardCompanyOptions: string[];
  onClose: () => void;
  onSetDate: (date: string) => void;
  onSetType: (type: EntryType) => void;
  onSetMember: (member: string) => void;
  onSetCategory: (category: string) => void;
  onSetSubCategory: (value: string) => void;
  onSetMerchant: (value: string) => void;
  onSetItem: (value: string) => void;
  onSetAmount: (value: string) => void;
  onSetPayment: (payment: PaymentType) => void;
  onSetCardCompany: (value: string) => void;
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
  merchant,
  item,
  amount,
  payment,
  cardCompany,
  memo,
  quickInput,
  categoryOptions,
  categoryDetailOptions,
  cardCompanyOptions,
  onClose,
  onSetDate,
  onSetType,
  onSetMember,
  onSetCategory,
  onSetSubCategory,
  onSetMerchant,
  onSetItem,
  onSetAmount,
  onSetPayment,
  onSetCardCompany,
  onSetMemo,
  onSetQuickInput,
  onApplyQuickInput,
  onSubmit,
}: Props) {
  if (!isOpen) return null;

  const isSavingCategory = type === "expense" && category === "저축";
  const isFixedExpenseCategory = type === "expense" && category === "고정비";
  const shouldShowCategoryDetail = type === "expense" && Boolean(category);
  const shouldShowCardCompany = type === "expense" && payment !== "cash";
  const categoryDetailLabel = isSavingCategory
    ? "저축 세부카테고리"
    : isFixedExpenseCategory
      ? "고정비 세부카테고리"
    : "카테고리 디테일";
  const categoryDetailPlaceholder =
    categoryDetailOptions.length > 0
      ? `예: ${categoryDetailOptions.slice(0, 3).join(", ")}`
      : isFixedExpenseCategory
        ? "예: 공과금, 핸드폰비, 보험료"
        : "예: 배민, 카페, 온라인쇼핑";

  return (
    <StModalBackdrop onClick={onClose}>
      <StModalCard onClick={(event) => event.stopPropagation()}>
        <StSheetHandle aria-hidden="true" />
        <StModalHeader>
          <StModalTitleWrap>
            <strong>{isEditing ? "내역 수정" : "내역 추가"}</strong>
            <StModalDescription>
              필수 항목부터 빠르게 입력하고, 나머지는 선택으로 채울 수 있어요.
            </StModalDescription>
          </StModalTitleWrap>
          <StCloseButton type="button" onClick={onClose} aria-label="닫기">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z" />
            </svg>
          </StCloseButton>
        </StModalHeader>

        <StFormRow $columns={2}>
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
        </StFormRow>

        <StFormRow $columns={2}>
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
        </StFormRow>

        <StFormRow $columns={2}>
          <StFormField>
            <StLabel>결제수단</StLabel>
            <StPaymentSelector>
              <StPaymentOption
                type="button"
                $active={payment === "cash"}
                onClick={() => onSetPayment("cash")}
              >
                현금
              </StPaymentOption>
              {type === "expense" ? (
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
              ) : null}
            </StPaymentSelector>
            {shouldShowCardCompany ? (
              <>
                <StSubLabel>카드사</StSubLabel>
                <StSubCategorySelector>
                  {cardCompanyOptions.map((option) => (
                    <StSubCategoryOption
                      key={option}
                      type="button"
                      $active={cardCompany === option}
                      onClick={() => onSetCardCompany(option)}
                    >
                      {option}
                    </StSubCategoryOption>
                  ))}
                </StSubCategorySelector>
                <StInlineSubInput
                  value={cardCompany}
                  onChange={(e) => onSetCardCompany(e.target.value)}
                  placeholder="예: 삼성카드"
                />
              </>
            ) : null}
          </StFormField>
          <StFormField>
            <StLabel>가맹점 / 항목 / 메모 (선택)</StLabel>
            <StInput
              value={merchant}
              onChange={(e) => onSetMerchant(e.target.value)}
              placeholder="가맹점 (선택)"
            />
            <StInlineSubInput
              value={item}
              onChange={(e) => onSetItem(e.target.value)}
              placeholder="항목 (선택)"
            />
            <StInlineSubInput
              value={memo}
              onChange={(e) => onSetMemo(e.target.value)}
              placeholder="메모 한 줄 (선택)"
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

        {shouldShowCategoryDetail ? (
          <StFormRow>
            <StFormField>
              <StLabel>{categoryDetailLabel}</StLabel>
              {categoryDetailOptions.length > 0 ? (
                <StSubCategorySelector>
                  {categoryDetailOptions.map((option) => (
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
              ) : null}
              <StInput
                value={subCategory}
                onChange={(e) => onSetSubCategory(e.target.value)}
                placeholder={categoryDetailPlaceholder}
              />
            </StFormField>
          </StFormRow>
        ) : null}

        <StQuickInputBox>
          <StLabel>텍스트로 빠르게 입력</StLabel>
          <StQuickRow>
            <StQuickTextarea
              value={quickInput}
              onChange={(e) => onSetQuickInput(e.target.value)}
              placeholder="예: 우아한형제들 배민 삼성카드 30000, 쇼핑 20000"
            />
            <StQuickButton type="button" onClick={onApplyQuickInput}>
              해석
            </StQuickButton>
          </StQuickRow>
        </StQuickInputBox>

        <StFooterActionBar>
          <StAddButton type="button" onClick={onSubmit}>
            {isEditing ? "수정 저장" : "내역 추가"}
          </StAddButton>
        </StFooterActionBar>
      </StModalCard>
    </StModalBackdrop>
  );
}

const StFormRow = styled.div<{ $columns?: number }>`
  display: grid;
  grid-template-columns: ${({ $columns = 2 }) =>
    `repeat(${$columns}, minmax(0, 1fr))`};
  gap: 0.65rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }
`;

const StQuickInputBox = styled.div`
  margin-bottom: 0.75rem;

  @media (max-width: 720px) {
    margin-bottom: 0.9rem;
    padding: 0.85rem 0.85rem 0.9rem;
    border: 1px solid #e6edf5;
    border-radius: 18px;
    background: linear-gradient(180deg, #fbfdff, #f8fbff);
  }
`;

const StQuickRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  align-items: stretch;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
    gap: 0.55rem;
  }
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

  @media (max-width: 720px) {
    min-height: 44px;
    width: 100%;
  }
`;

const StFormField = styled.div`
  margin-bottom: 0.65rem;

  @media (max-width: 720px) {
    margin-bottom: 0;
    padding: 0.85rem 0.85rem 0.9rem;
    border: 1px solid #e6edf5;
    border-radius: 18px;
    background: linear-gradient(180deg, #fbfdff, #f8fbff);
  }
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

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-wrap: wrap;
  }
`;

const StCategoryPicker = styled.div`
  max-height: 150px;
  overflow: auto;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;
  padding-right: 0.25rem;
  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.45rem;
    max-height: none;
    padding-right: 0;
  }

  @media (max-width: 400px) {
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

  span:last-child {
    min-width: 0;
    word-break: keep-all;
  }

  @media (max-width: 720px) {
    min-height: 48px;
    align-items: center;
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

  @media (max-width: 720px) {
    margin-bottom: 0.4rem;
    font-size: 0.78rem;
    color: #556274;
  }
`;

const StSubLabel = styled.label`
  display: block;
  margin: 0.55rem 0 0.25rem;
  font-size: 0.72rem;
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

  @media (max-width: 720px) {
    min-height: 44px;
  }
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

  @media (max-width: 720px) {
    min-height: 44px;
  }
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

  @media (max-width: 720px) {
    min-height: 42px;
  }
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

  @media (max-width: 720px) {
    padding: 0.42rem 0.72rem;
  }
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
  border: 1px solid #4e67d0;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  background: #5f73d9;
  box-shadow: 0 16px 30px rgba(95, 115, 217, 0.22);
`;

const StModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  padding: 0.9rem;
  z-index: 120;

  @media (max-width: 720px) {
    align-items: flex-end;
    padding: 0.75rem;
  }
`;

const StModalCard = styled.div`
  width: min(480px, 100%);
  height: calc(100vh - 1.8rem);
  max-height: calc(100vh - 1.8rem);
  overflow: auto;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 28px;
  border: 1px solid #dde5f0;
  padding: 1rem;
  box-shadow: -18px 0 40px rgba(49, 67, 110, 0.14);

  @media (max-width: 720px) {
    width: 100%;
    height: auto;
    max-height: min(88vh, 900px);
    border-radius: 26px 26px 20px 20px;
    padding: 0.9rem 0.85rem calc(0.9rem + env(safe-area-inset-bottom));
    box-shadow: 0 -18px 38px rgba(49, 67, 110, 0.14);
  }
`;

const StSheetHandle = styled.div`
  display: none;

  @media (max-width: 720px) {
    display: block;
    width: 3rem;
    height: 0.3rem;
    border-radius: 999px;
    background: #d7dfea;
    margin: 0 auto 0.7rem;
  }
`;

const StModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.8rem;
  position: sticky;
  top: -1rem;
  z-index: 1;
  background: rgba(255, 255, 255, 0.94);
  padding: 0.15rem 0 0.75rem;
  backdrop-filter: blur(10px);

  strong {
    font-size: 1.18rem;
    font-weight: 900;
    color: #111827;
  }

  @media (max-width: 720px) {
    top: -0.9rem;
    margin-bottom: 0.9rem;
    padding: 0.05rem 0 0.8rem;
  }
`;

const StModalTitleWrap = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.22rem;
`;

const StModalDescription = styled.p`
  font-size: 0.78rem;
  line-height: 1.45;
  color: #7b8798;

  @media (max-width: 720px) {
    font-size: 0.75rem;
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

  @media (max-width: 720px) {
    width: 34px;
    height: 34px;
    flex-shrink: 0;
  }
`;

const StFooterActionBar = styled.div`
  position: sticky;
  bottom: calc(-0.9rem - env(safe-area-inset-bottom));
  padding-top: 0.2rem;
  padding-bottom: env(safe-area-inset-bottom);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.92) 22%,
    rgba(255, 255, 255, 0.98) 100%
  );

  @media (max-width: 720px) {
    margin: 0 -0.1rem -0.15rem;
  }
`;
