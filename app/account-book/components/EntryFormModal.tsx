"use client";

import styled from "styled-components";
import ModalCloseButton from "./ModalCloseButton";
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
  onSubmit,
}: Props) {
  if (!isOpen) return null;

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
          <StSectionCard>
            <StSectionHeader>
              <div>
                <StSectionTitle>핵심 입력</StSectionTitle>
                <StSectionDescription>
                  금액, 날짜, 작성자, 결제수단만 먼저 잡으면 등록 흐름이
                  빨라져요.
                </StSectionDescription>
              </div>
            </StSectionHeader>

            <StFormRow $columns={2}>
              <StFormField>
                <StLabel>금액</StLabel>
                <StInput
                  type="number"
                  value={amount}
                  onChange={(e) => onSetAmount(e.target.value)}
                  placeholder="예: 15000"
                />
              </StFormField>
              <StFormField>
                <StLabel>날짜</StLabel>
                <StInput
                  type="date"
                  value={selectedDate}
                  onChange={(e) => onSetDate(e.target.value)}
                />
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

            <StFormField $mobileTopSpace>
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
                  <StSubLabel>{cardCompanyLabel}</StSubLabel>
                  <StSubCategorySelector $mobileWrap>
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
                    placeholder={cardCompanyPlaceholder}
                  />
                </>
              ) : null}
            </StFormField>
          </StSectionCard>

          <StSectionCard>
            <StSectionHeader>
              <div>
                <StSectionTitle>카테고리</StSectionTitle>
                <StSectionDescription>
                  지금 소비 성격에 가장 가까운 항목을 먼저 선택해주세요.
                </StSectionDescription>
              </div>
            </StSectionHeader>
            <StFormField>
              <StSelectedCategory>
                <span
                  className="dot"
                  style={{
                    background:
                      categoryOptions.find((o) => o.label === category)
                        ?.color || "#94a3b8",
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
                  <StSubLabel>세부 태그</StSubLabel>
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
                  <StInlineSubInput
                    value={subCategory}
                    onChange={(e) => onSetSubCategory(e.target.value)}
                    placeholder="세부 카테고리 직접 입력"
                  />
                </>
              ) : null}
            </StFormField>
          </StSectionCard>

          <StSectionCard>
            <StSectionHeader>
              <div>
                <StSectionTitle>상세 메모</StSectionTitle>
                <StSectionDescription>
                  가맹점, 항목, 메모를 적어두면 나중에 검색하거나 비교하기
                  쉬워져요.
                </StSectionDescription>
              </div>
            </StSectionHeader>
            <StFormRow $columns={1}>
              <StFormField>
                <StLabel>가맹점</StLabel>
                <StInput
                  value={merchant}
                  onChange={(e) => onSetMerchant(e.target.value)}
                  placeholder="예: 올리브영 성수점"
                />
              </StFormField>
            </StFormRow>
            <StFormRow $columns={1}>
              <StFormField>
                <StLabel>항목</StLabel>
                <StInput
                  value={item}
                  onChange={(e) => onSetItem(e.target.value)}
                  placeholder="예: 샴푸, 영양제, 점심 식사"
                />
              </StFormField>
            </StFormRow>
            <StFormRow $columns={1}>
              <StFormField>
                <StLabel>메모</StLabel>
                <StInlineTextarea
                  value={memo}
                  onChange={(e) => onSetMemo(e.target.value)}
                  placeholder="공유 전 확인할 내용이나 메모를 남겨보세요."
                />
              </StFormField>
            </StFormRow>
          </StSectionCard>
        </StModalScrollBody>

        <StFooterActionBar>
          <StFooterSummary>
            {type === "expense" ? "지출" : "수입"} · {member} ·{" "}
            {amount ? `${amount}원` : "금액 미입력"}
          </StFooterSummary>
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
    gap: 0.45rem;
  }
`;

const StSectionCard = styled.section`
  padding: 1.05rem 0 1rem;

  & + & {
    border-top: 1px solid #ecf1f7;
  }

  @media (max-width: 720px) {
    padding: 0.9rem 0.9rem 1rem;

    & + & {
      border-top: 1px solid #ecf1f7;
    }
  }
`;

const StSectionHeader = styled.div`
  margin-bottom: 0.75rem;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;

  @media (max-width: 720px) {
    margin-bottom: 0.68rem;
    padding-bottom: 0.48rem;
    border-bottom: 1px solid #ecf1f7;
  }
`;

const StSectionTitle = styled.h4`
  margin: 0;
  font-size: 0.95rem;
  font-weight: 900;
  line-height: 1.2;
  color: #223147;

  @media (max-width: 720px) {
    font-size: 0.92rem;
  }
`;

const StSectionDescription = styled.p`
  margin: 0.22rem 0 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: #7a8798;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StFormField = styled.div<{ $mobileTopSpace?: boolean }>`
  margin-bottom: 0.65rem;

  @media (max-width: 720px) {
    margin-bottom: 0;
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
    color: #374151;
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
  border: 1px solid ${({ $active }) => ($active ? "#b8ccf6" : "#e5eaf0")};
  background: ${({ $active }) =>
    $active
      ? "linear-gradient(180deg, #eef4ff 0%, #e8f0ff 100%)"
      : "linear-gradient(180deg, #ffffff 0%, #fbfdff 100%)"};
  border-radius: 12px;
  padding: 0.52rem 0.6rem;
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
  color: #708197;
`;

const StLabel = styled.label`
  display: block;
  margin-bottom: 0.38rem;
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 700;

  @media (max-width: 720px) {
    margin-bottom: 0.4rem;
    font-size: 0.72rem;
    color: #556274;
  }
`;

const StSubLabel = styled.label`
  display: block;
  margin: 0.65rem 0 0.3rem;
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
  border: 1px solid ${({ $active }) => ($active ? "#b8ccf6" : "#dce3eb")};
  background: ${({ $active }) =>
    $active ? "linear-gradient(180deg, #eef4ff 0%, #e7efff 100%)" : "#fff"};
  color: ${({ $active }) => ($active ? "#355cb1" : "#5b6475")};
  border-radius: 12px;
  padding: 0.66rem 0.55rem;
  font-size: 0.85rem;
  font-weight: 700;

  @media (max-width: 720px) {
    min-height: 38px;
    padding: 0.5rem 0.4rem;
    font-size: 0.78rem;
  }
`;

const StMemberSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem;
`;

const StMemberOption = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#b8ccf6" : "#dce3eb")};
  background: ${({ $active }) =>
    $active ? "linear-gradient(180deg, #eef4ff 0%, #e7efff 100%)" : "#fff"};
  color: ${({ $active }) => ($active ? "#355cb1" : "#5b6475")};
  border-radius: 12px;
  padding: 0.66rem 0.55rem;
  font-size: 0.82rem;
  font-weight: 700;

  @media (max-width: 720px) {
    min-height: 38px;
    padding: 0.5rem 0.4rem;
    font-size: 0.76rem;
  }
`;

const StPaymentSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
  gap: 0.4rem;
`;

const StPaymentOption = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#b8ccf6" : "#dce3eb")};
  background: ${({ $active }) =>
    $active ? "linear-gradient(180deg, #eef4ff 0%, #e7efff 100%)" : "#fff"};
  color: ${({ $active }) => ($active ? "#355cb1" : "#5b6475")};
  border-radius: 12px;
  padding: 0.62rem 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;

  @media (max-width: 720px) {
    min-height: 38px;
    padding: 0.5rem 0.35rem;
    font-size: 0.74rem;
  }
`;

const StSubCategorySelector = styled.div<{ $mobileWrap?: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.45rem;

  @media (max-width: 720px) {
    flex-wrap: ${({ $mobileWrap }) => ($mobileWrap ? "wrap" : "nowrap")};
    overflow-x: ${({ $mobileWrap }) => ($mobileWrap ? "visible" : "auto")};
    margin-bottom: 0.35rem;
    padding-bottom: 0.1rem;
  }
`;

const StSubCategoryOption = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#b8ccf6" : "#dce3eb")};
  background: ${({ $active }) =>
    $active ? "linear-gradient(180deg, #eef4ff 0%, #e7efff 100%)" : "#fff"};
  color: ${({ $active }) => ($active ? "#355cb1" : "#5b6475")};
  border-radius: 999px;
  padding: 0.38rem 0.68rem;
  font-size: 0.76rem;
  font-weight: 700;

  @media (max-width: 720px) {
    flex-shrink: 0;
    padding: 0.38rem 0.62rem;
    font-size: 0.72rem;
  }
`;

const inputBase = `
  width: 100%;
  min-height: 40px;
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

const StInlineSubInput = styled.input`
  ${inputBase}
  margin-top: 0.35rem;

  @media (max-width: 720px) {
    margin-top: 0.28rem;
    padding: 0.54rem 0.65rem;
    font-size: 0.86rem;
  }
`;

const StInlineTextarea = styled.textarea`
  ${inputBase}
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
  border: 1px solid #4e67d0;
  border-radius: 16px;
  padding: 0.9rem 1rem;
  font-size: 0.95rem;
  font-weight: 800;
  color: #fff;
  background: #5f73d9;
  box-shadow: 0 16px 30px rgba(95, 115, 217, 0.22);

  @media (max-width: 720px) {
    border-radius: 14px;
    padding: 0.76rem 0.9rem;
    font-size: 0.88rem;
  }
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
  border: 1px solid #dde5f0;
  box-shadow: -18px 0 40px rgba(49, 67, 110, 0.14);

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
  border-bottom: 1px solid #edf2f8;
  background: rgba(255, 255, 255, 0.96);

  strong {
    font-size: 1.18rem;
    font-weight: 900;
    color: #111827;
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
  color: #7b8798;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StFooterActionBar = styled.div`
  padding: 0.45rem 1rem calc(1rem + env(safe-area-inset-bottom));
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.94) 0%,
    rgba(255, 255, 255, 0.98) 100%
  );
  border-top: 1px solid #e5ecf5;

  @media (max-width: 720px) {
    padding: 0.6rem 0.74rem calc(1rem + env(safe-area-inset-bottom));
  }
`;

const StFooterSummary = styled.p`
  margin-bottom: 0.45rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #627389;

  @media (max-width: 720px) {
    display: none;
  }
`;
