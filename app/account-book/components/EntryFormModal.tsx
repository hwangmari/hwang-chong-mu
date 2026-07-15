"use client";

import type { KeyboardEvent } from "react";
import styled from "styled-components";
import ModalCloseButton from "./ModalCloseButton";
import { CategoryOption, EntryType, PaymentType } from "../types";
import { evaluateAmountExpression } from "./WorkspaceLedgerView/utils";
import {
  abInputBase,
  StAbFormRow,
  StAbLabel,
  StAbSubLabel,
  StAbSectionHeader,
  StAbSectionTitle,
  StAbSectionDescription,
  StAbSectionCard,
  StAbSelectOption,
  StAbPillOption,
  StAbPrimaryButton,
  StAbFooterActionBar,
  media,
} from "./shared";

type Props = {
  isOpen: boolean;
  isEditing: boolean;
  selectedDate: string;
  member: string;
  memberOptions: string[];
  type: EntryType;
  category: string;
  subCategory: string;
  amount: string;
  payment: PaymentType;
  cardCompany: string;
  memo: string;
  quickInput: string;
  categoryOptions: CategoryOption[];
  categoryDetailOptions: string[];
  cardCompanyOptions: string[];
  recurringAvailable: boolean;
  recurring: boolean;
  onToggleRecurring: (value: boolean) => void;
  cashReceipt: boolean;
  onSetCashReceipt: (value: boolean) => void;
  benefitExcluded: boolean;
  onSetBenefitExcluded: (value: boolean) => void;
  onClose: () => void;
  onSetDate: (date: string) => void;
  onSetType: (type: EntryType) => void;
  onSetMember: (member: string) => void;
  onSetCategory: (category: string) => void;
  onSetSubCategory: (value: string) => void;
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
  amount,
  payment,
  cardCompany,
  memo,
  categoryOptions,
  categoryDetailOptions,
  cardCompanyOptions,
  recurringAvailable,
  recurring,
  onToggleRecurring,
  cashReceipt,
  onSetCashReceipt,
  benefitExcluded,
  onSetBenefitExcluded,
  onClose,
  onSetDate,
  onSetType,
  onSetMember,
  onSetCategory,
  onSetSubCategory,
  onSetAmount,
  onSetPayment,
  onSetCardCompany,
  onSetMemo,
  onSubmit,
}: Props) {
  if (!isOpen) return null;

  const amountValue = evaluateAmountExpression(amount);
  const amountHasExpression = /[+*/]/.test(amount) || /\d\s*-/.test(amount);
  const handleAmountKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "=" && event.key !== "Enter") return;
    event.preventDefault();
    if (amountValue !== null) {
      onSetAmount(Math.trunc(amountValue).toLocaleString("ko-KR"));
    }
  };
  // 숫자만 있으면 천단위 콤마, 계산식(연산자 포함)이면 원본 유지
  const handleAmountChange = (value: string) => {
    if (/^[\d,]*$/.test(value)) {
      const digits = value.replace(/,/g, "");
      onSetAmount(digits ? Number(digits).toLocaleString("ko-KR") : "");
      return;
    }
    onSetAmount(value);
  };

  const shouldShowCardCompany = type === "expense" && payment !== "cash";
  const cardCompanyLabel = payment === "check_card" ? "체크 항목" : "카드사";
  const cardCompanyPlaceholder =
    payment === "check_card" ? "예: 네이버하나머니" : "예: 삼성카드";

  return (
    <StModalBackdrop onClick={onClose}>
      <StModalCard onClick={(event) => event.stopPropagation()}>
        <StSheetHandle aria-hidden="true" />
        <StModalHeader>
          <StModalTitleWrap>
            <strong>{isEditing ? "내역 수정" : "내역 추가"}</strong>
            <StModalDescription>
              필요한 항목만 간단히 입력하고 바로 저장할 수 있어요.
            </StModalDescription>
          </StModalTitleWrap>
          <ModalCloseButton onClick={onClose} />
        </StModalHeader>

        <StModalScrollBody>
          <StAbSectionCard>
            <StAbSectionHeader>
              <div>
                <StAbSectionTitle>핵심 입력</StAbSectionTitle>
                <StAbSectionDescription>
                  금액, 날짜, 작성자, 결제수단만 먼저 잡으면 등록 흐름이
                  빨라져요.
                </StAbSectionDescription>
              </div>
            </StAbSectionHeader>

            <StAbFormRow $columns={2}>
              <StFormField>
                <StAbLabel>금액</StAbLabel>
                <StInput
                  type="text"
                  inputMode="text"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  onKeyDown={handleAmountKeyDown}
                  placeholder="예: 15,000 또는 15000+3000"
                />
                {amountHasExpression ? (
                  <StAmountPreview $invalid={amountValue === null}>
                    {amountValue === null
                      ? "계산식을 확인해주세요"
                      : `= ${Math.trunc(amountValue).toLocaleString()}원`}
                  </StAmountPreview>
                ) : null}
              </StFormField>
              <StFormField>
                <StAbLabel>날짜</StAbLabel>
                <StInput
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onSetDate(e.target.value)}
                />
              </StFormField>
            </StAbFormRow>

            <StAbFormRow $columns={2}>
              <StFormField>
                <StAbLabel>구분</StAbLabel>
                <StTypeSelector>
                  <StAbSelectOption
                    type="button"
                    $active={type === "expense"}
                    onClick={() => onSetType("expense")}
                  >
                    지출
                  </StAbSelectOption>
                  <StAbSelectOption
                    type="button"
                    $active={type === "income"}
                    onClick={() => onSetType("income")}
                  >
                    수입
                  </StAbSelectOption>
                </StTypeSelector>
              </StFormField>
              <StFormField>
                <StAbLabel>작성자</StAbLabel>
                <StMemberSelector>
                  {memberOptions.map((option) => (
                    <StAbSelectOption
                      key={option}
                      type="button"
                      $active={member === option}
                      onClick={() => onSetMember(option)}
                    >
                      {option}
                    </StAbSelectOption>
                  ))}
                </StMemberSelector>
              </StFormField>
            </StAbFormRow>

            <StFormField $mobileTopSpace>
              <StAbLabel>결제수단</StAbLabel>
              <StPaymentSelector>
                <StAbSelectOption
                  type="button"
                  $active={payment === "cash"}
                  onClick={() => onSetPayment("cash")}
                >
                  현금
                </StAbSelectOption>
                {type === "expense" ? (
                  <>
                    <StAbSelectOption
                      type="button"
                      $active={payment === "card"}
                      onClick={() => onSetPayment("card")}
                    >
                      카드
                    </StAbSelectOption>
                    <StAbSelectOption
                      type="button"
                      $active={payment === "check_card"}
                      onClick={() => onSetPayment("check_card")}
                    >
                      체크카드
                    </StAbSelectOption>
                  </>
                ) : null}
              </StPaymentSelector>
              {shouldShowCardCompany ? (
                <>
                  <StAbSubLabel>{cardCompanyLabel}</StAbSubLabel>
                  <StSubCategorySelector $mobileWrap>
                    {cardCompanyOptions.map((option) => (
                      <StAbPillOption
                        key={option}
                        type="button"
                        $active={cardCompany === option}
                        onClick={() => onSetCardCompany(option)}
                      >
                        {option}
                      </StAbPillOption>
                    ))}
                  </StSubCategorySelector>
                  <StInlineSubInput
                    value={cardCompany}
                    onChange={(e) => onSetCardCompany(e.target.value)}
                    placeholder={cardCompanyPlaceholder}
                  />
                </>
              ) : null}
              {payment === "cash" ? (
                <StRecurringRow
                  type="button"
                  $active={cashReceipt}
                  onClick={() => onSetCashReceipt(!cashReceipt)}
                  aria-pressed={cashReceipt}
                >
                  <StRecurringText>
                    <strong>🧾 현금영수증 발급</strong>
                    <span>현금 결제 시 현금영수증을 발급했다면 켜주세요</span>
                  </StRecurringText>
                  <StRecurringSwitch $active={cashReceipt} aria-hidden>
                    <span />
                  </StRecurringSwitch>
                </StRecurringRow>
              ) : null}
              {payment === "card" || payment === "check_card" ? (
                <StRecurringRow
                  type="button"
                  $active={benefitExcluded}
                  onClick={() => onSetBenefitExcluded(!benefitExcluded)}
                  aria-pressed={benefitExcluded}
                >
                  <StRecurringText>
                    <strong>🚫 실적 제외</strong>
                    <span>
                      공과금·상품권처럼 카드 실적에 안 잡히는 지출이면 켜주세요
                    </span>
                  </StRecurringText>
                  <StRecurringSwitch $active={benefitExcluded} aria-hidden>
                    <span />
                  </StRecurringSwitch>
                </StRecurringRow>
              ) : null}
            </StFormField>
          </StAbSectionCard>

          <StAbSectionCard>
            <StAbSectionHeader>
              <div>
                <StAbSectionTitle>카테고리</StAbSectionTitle>
                <StAbSectionDescription>
                  지금 소비 성격에 가장 가까운 항목을 먼저 선택해주세요.
                </StAbSectionDescription>
              </div>
            </StAbSectionHeader>
            <StFormField>
              <StSelectedCategory>
                <span
                  className="dot"
                  style={{
                    background:
                      categoryOptions.find((o) => o.label === category)
                        ?.color || "#a2a5aa",
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
                    <span
                      className="dot"
                      style={{ background: option.color }}
                    />
                    <span>{option.label}</span>
                  </StCategoryButton>
                ))}
              </StCategoryPicker>
              {categoryDetailOptions.length > 0 ? (
                <>
                  <StAbSubLabel>세부 태그</StAbSubLabel>
                  <StSubCategorySelector>
                    {categoryDetailOptions.map((option) => (
                      <StAbPillOption
                        key={option}
                        type="button"
                        $active={subCategory === option}
                        onClick={() => onSetSubCategory(option)}
                      >
                        {option}
                      </StAbPillOption>
                    ))}
                  </StSubCategorySelector>
                  <StInlineSubInput
                    value={subCategory}
                    onChange={(e) => onSetSubCategory(e.target.value)}
                    placeholder="세부 카테고리 직접 입력"
                  />
                </>
              ) : null}
              {recurringAvailable ? (
                <StRecurringRow
                  type="button"
                  $active={recurring}
                  onClick={() => onToggleRecurring(!recurring)}
                  aria-pressed={recurring}
                >
                  <StRecurringText>
                    <strong>정기 반복 저축</strong>
                    <span>매달 이 날짜에 자동으로 기록돼요 (예: 청약)</span>
                  </StRecurringText>
                  <StRecurringSwitch $active={recurring} aria-hidden>
                    <span />
                  </StRecurringSwitch>
                </StRecurringRow>
              ) : null}
            </StFormField>
          </StAbSectionCard>

          <StAbSectionCard>
            <StAbSectionHeader>
              <div>
                <StAbSectionTitle>상세 메모</StAbSectionTitle>
                <StAbSectionDescription>
                  메모를 적어두면 나중에 검색하거나 비교하기 쉬워져요.
                </StAbSectionDescription>
              </div>
            </StAbSectionHeader>
            <StAbFormRow $columns={1}>
              <StFormField>
                <StAbLabel>메모</StAbLabel>
                <StInlineTextarea
                  value={memo}
                  onChange={(e) => onSetMemo(e.target.value)}
                  placeholder="공유 전 확인할 내용이나 메모를 남겨보세요."
                />
              </StFormField>
            </StAbFormRow>
          </StAbSectionCard>
        </StModalScrollBody>

        <StAbFooterActionBar>
          <StFooterSummary>
            {type === "expense" ? "지출" : "수입"} · {member} ·{" "}
            {amountValue !== null
              ? `${Math.trunc(amountValue).toLocaleString()}원`
              : "금액 미입력"}
          </StFooterSummary>
          <StAddButton type="button" onClick={onSubmit}>
            {isEditing ? "수정 저장" : "내역 추가"}
          </StAddButton>
        </StAbFooterActionBar>
      </StModalCard>
    </StModalBackdrop>
  );
}

const StFormField = styled.div<{ $mobileTopSpace?: boolean }>`
  margin-bottom: 0.65rem;

  @media (max-width: 720px) {
    margin-bottom: 0.55rem;
    margin-top: ${({ $mobileTopSpace }) => ($mobileTopSpace ? "0.28rem" : "0")};
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
    color: ${({ theme }) => theme.colors.gray700};
  }

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 0.38rem;
  }
`;

const StCategoryPicker = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.35rem;

  @media (max-width: 1080px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.35rem;
  }

  @media (max-width: 400px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const StCategoryButton = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#ced0d3" : "#e9eaec")};
  background: ${({ $active }) =>
    $active
      ? "#f6f6f7"
      : "#ffffff"};
  border-radius: 12px;
  padding: 0.52rem 0.6rem;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  text-align: left;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.colors.gray700};

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
    min-height: 42px;
    padding: 0.42rem 0.48rem;
    align-items: center;

    .icon {
      font-size: 0.8rem;
    }

    span:last-child {
      font-size: 0.75rem;
      line-height: 1.2;
    }
  }
`;

const StCategoryDescription = styled.p`
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #7d828a;
`;

const StTypeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
`;

const StMemberSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
`;

const StPaymentSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 0.4rem;
`;

const StSubCategorySelector = styled.div<{ $mobileWrap?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.45rem;

  @media (max-width: 720px) {
    flex-wrap: wrap;
    margin-bottom: 0.35rem;
    padding-bottom: 0.1rem;
  }
`;


const StInput = styled.input<{ $large?: boolean }>`
  ${abInputBase}
  ${({ $large }) =>
    $large
      ? `
    min-height: 52px;
    font-size: 1rem;
    padding: 0.72rem 0.78rem;
  `
      : ""}

  &[type="date"] {
    -webkit-appearance: none;
    appearance: none;
    display: block;
  }

  &[type="date"]::-webkit-date-and-time-value {
    text-align: left;
  }

  @media (max-width: 720px) {
    padding: 0.56rem 0.65rem;
    font-size: 0.88rem;

    ${({ $large }) =>
      $large
        ? `
      min-height: 46px;
      font-size: 0.94rem;
      padding: 0.62rem 0.72rem;
    `
        : ""}
  }
`;

const StAmountPreview = styled.p<{ $invalid?: boolean }>`
  margin-top: 0.3rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ $invalid }) => ($invalid ? "#e0554f" : "#7c8088")};

  @media (max-width: 720px) {
    font-size: 0.76rem;
  }
`;

const StRecurringRow = styled.button<{ $active: boolean }>`
  width: 100%;
  margin-top: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e2e3e5")};
  border-radius: 14px;
  background: ${({ $active }) => ($active ? "#eef5fe" : "#ffffff")};
  padding: 0.65rem 0.8rem;
  cursor: pointer;
  text-align: left;
`;

const StRecurringText = styled.div`
  display: grid;
  gap: 0.15rem;

  strong {
    font-size: 0.84rem;
    font-weight: 800;
    color: #2b3441;
  }

  span {
    font-size: 0.72rem;
    color: #8a8e95;
  }
`;

const StRecurringSwitch = styled.span<{ $active: boolean }>`
  flex-shrink: 0;
  width: 2.4rem;
  height: 1.4rem;
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#3182f6" : "#d3d5d9")};
  position: relative;
  transition: background 0.18s ease;

  span {
    position: absolute;
    top: 0.15rem;
    left: ${({ $active }) => ($active ? "1.15rem" : "0.15rem")};
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 999px;
    background: #ffffff;
    transition: left 0.18s ease;
  }
`;

const StInlineSubInput = styled.input`
  ${abInputBase}
  margin-top: 0.35rem;

  @media (max-width: 720px) {
    margin-top: 0.28rem;
    padding: 0.54rem 0.65rem;
    font-size: 0.86rem;
  }
`;

const StInlineTextarea = styled.textarea`
  ${abInputBase}
  margin-top: 0.1rem;
  min-height: 92px;
  resize: vertical;

  @media (max-width: 720px) {
    min-height: 72px;
    padding: 0.56rem 0.65rem;
    font-size: 0.86rem;
  }
`;

const StAddButton = styled.button`
  width: 100%;
  border: 1px solid #7c8088;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.white};
  background: #888c94;
  box-shadow: 0 16px 30px rgba(151, 155, 161, 0.22);

  @media (max-width: 720px) {
    border-radius: 14px;
    padding: 0.76rem 0.9rem;
    font-size: 0.88rem;
  }
`;

const StModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(23, 24, 26, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
  padding: 0.9rem;
  z-index: 120;

  @media (max-width: 720px) {
    align-items: stretch;
    padding: 0;
  }
`;

const StModalCard = styled.div`
  width: min(480px, 100%);
  height: calc(100vh - 1.8rem);
  max-height: calc(100vh - 1.8rem);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.97);
  border-radius: 28px;
  border: 1px solid #e5e6e8;
  box-shadow: -18px 0 40px rgba(66, 69, 74, 0.14);

  @media (max-width: 720px) {
    width: 100vw;
    height: 100dvh;
    max-height: 100dvh;
    border-radius: 0;
    border: none;
    box-shadow: none;
  }
`;

const StSheetHandle = styled.div`
  display: none;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0;
  padding: 0.92rem 1.05rem 0.8rem;
  border-bottom: 1px solid #f2f2f3;
  background: rgba(255, 255, 255, 0.96);

  strong {
    font-size: 1.18rem;
    font-weight: 900;
    color: ${({ theme }) => theme.colors.gray900};
  }

  @media (max-width: 720px) {
    padding: calc(0.85rem + env(safe-area-inset-top)) 0.85rem 0.7rem;
    background: rgba(255, 255, 255, 0.98);

    strong {
      font-size: 1rem;
    }
  }
`;

const StModalScrollBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 1rem 1rem;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 720px) {
    padding: 0 0 0.6rem;
  }
`;

const StModalTitleWrap = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.16rem;
`;

const StModalDescription = styled.p`
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #84888f;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StFooterSummary = styled.p`
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #70747b;

  @media (max-width: 720px) {
    display: none;
  }
`;
