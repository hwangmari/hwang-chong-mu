"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styled from "styled-components";
import type { AccountEntry } from "../../types";
import ImageCaptureSection from "./ImageCaptureSection";
import type { ExtractedImageEntryCandidate } from "./types";

type RegisterMode = "natural" | "image";

type Props = {
  mode: RegisterMode;
  currentMonth: Date;
  monthEntriesCount: number;
  naturalInput: string;
  naturalPreview: AccountEntry | null;
  isExtractingImage: boolean;
  ocrErrorMessage: string;
  ocrFileName: string;
  extractedImageEntries: ExtractedImageEntryCandidate[];
  existingEntryDuplicateKeys: Set<string>;
  formatAmount: (value: number) => string;
  formatPreviewDate: (date: string) => string;
  paymentLabel: (payment: AccountEntry["payment"]) => string;
  onCloseModal: () => void;
  onChangeInput: (value: string) => void;
  onSelectImageFile: (file: File) => void;
  onSaveImageEntries: (entries: ExtractedImageEntryCandidate[]) => void;
  onClearImageEntries: () => void;
  onSubmit: () => void;
};

export default function NaturalInputSection({
  mode,
  currentMonth,
  monthEntriesCount,
  naturalInput,
  naturalPreview,
  isExtractingImage,
  ocrErrorMessage,
  ocrFileName,
  extractedImageEntries,
  existingEntryDuplicateKeys,
  formatAmount,
  formatPreviewDate,
  paymentLabel,
  onCloseModal,
  onChangeInput,
  onSelectImageFile,
  onSaveImageEntries,
  onClearImageEntries,
  onSubmit,
}: Props) {
  const naturalInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (mode !== "natural") return;
    naturalInputRef.current?.focus();
  }, [mode]);

  const handleNaturalKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return;
    if (event.key !== "Enter") return;
    event.preventDefault();
    onSubmit();
  };

  return (
    <StModalBackdrop onClick={onCloseModal}>
      <StModalCard onClick={(event) => event.stopPropagation()}>
        <StModalHeader>
          <div>
            <StModalEyebrow>Register</StModalEyebrow>
            <StModalTitle>
              {mode === "natural" ? "문장등록" : "이미지등록"}
            </StModalTitle>
            <StModalDescription>
              {mode === "natural"
                ? "한 줄 문장으로 빠르게 내역을 기록할 수 있어요."
                : "캡처 이미지를 올려 OCR 결과를 수정한 뒤 저장할 수 있어요."}
            </StModalDescription>
          </div>
          <StCloseButton type="button" onClick={onCloseModal} aria-label="닫기">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z" />
            </svg>
          </StCloseButton>
        </StModalHeader>

        {mode === "natural" ? (
          <StContentSection>
            <StNaturalHeader>
              <div>
                <StSectionEyebrow>Simple Input</StSectionEyebrow>
                <StSectionTitle>문장 한 줄로 바로 기록</StSectionTitle>
              </div>
              <StMetaBadge>
                {format(currentMonth, "yyyy년 M월", { locale: ko })} · {monthEntriesCount}건
              </StMetaBadge>
            </StNaturalHeader>

            <StSectionDescription>
              언제, 어디서, 무엇을, 어떻게, 얼마를 썼는지만 자연스럽게 적으면 월별 가계부 리스트에 바로 들어갑니다.
            </StSectionDescription>

            <StInputGuide>
              한 줄로 입력한 뒤 Enter를 누르면 바로 기록됩니다.
            </StInputGuide>

            <StNaturalInput
              ref={naturalInputRef}
              value={naturalInput}
              onChange={(event) => onChangeInput(event.target.value)}
              onKeyDown={handleNaturalKeyDown}
              placeholder="예: 3월 17일 네이버쇼핑 마라샹궈 구매 16만원"
            />

            <StHints>
              <span>예: 오늘 스타벅스 라떼 카드 6100원</span>
              <span>예: 오늘 우아한형제들 배민 삼성카드 1만8천원</span>
              <span>예: 3월 17일 네이버쇼핑 마라샹궈 구매 16만원</span>
            </StHints>

            {naturalInput.trim() ? (
              <StPreview $valid={Boolean(naturalPreview)}>
                {naturalPreview ? (
                  <>
                    <strong>{formatPreviewDate(naturalPreview.date)}</strong>
                    <span>{naturalPreview.merchant || "가맹점 미입력"}</span>
                    <span>{naturalPreview.item}</span>
                    {naturalPreview.subCategory ? (
                      <span>{naturalPreview.subCategory}</span>
                    ) : null}
                    <span>{paymentLabel(naturalPreview.payment)}</span>
                    {naturalPreview.payment !== "cash" && naturalPreview.cardCompany ? (
                      <span>{naturalPreview.cardCompany}</span>
                    ) : null}
                    <em>{formatAmount(naturalPreview.amount)}</em>
                  </>
                ) : (
                  <span>날짜와 금액이 포함된 문장으로 적어주시면 더 정확하게 기록돼요.</span>
                )}
              </StPreview>
            ) : null}

            <StActions>
              <StSecondaryButton type="button" onClick={onCloseModal}>
                닫기
              </StSecondaryButton>
              <StPrimaryButton type="button" onClick={onSubmit}>
                기록하기
              </StPrimaryButton>
            </StActions>
          </StContentSection>
        ) : null}

        {mode === "image" ? (
          <StContentSection>
            <ImageCaptureSection
              key={`${ocrFileName}-${extractedImageEntries.length}`}
              embedded
              isExtracting={isExtractingImage}
              errorMessage={ocrErrorMessage}
              fileName={ocrFileName}
              extractedEntries={extractedImageEntries}
              existingEntryDuplicateKeys={existingEntryDuplicateKeys}
              formatAmount={formatAmount}
              paymentLabel={paymentLabel}
              onSelectFile={onSelectImageFile}
              onSaveEntries={onSaveImageEntries}
              onClear={onClearImageEntries}
            />
          </StContentSection>
        ) : null}
      </StModalCard>
    </StModalBackdrop>
  );
}

const StModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.2);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 121;
`;

const StModalCard = styled.div`
  width: min(760px, 100%);
  max-height: min(84vh, 920px);
  overflow: auto;
  border: 1px solid #d9e3ef;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.98);
  padding: 1rem;
  box-shadow: 0 24px 48px rgba(45, 62, 100, 0.14);

  @media (max-width: 720px) {
    max-height: min(88vh, 920px);
    padding: 0.9rem 0.85rem;
    border-radius: 22px;
  }
`;

const StModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
`;

const StModalEyebrow = styled.p`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b82a8;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StModalTitle = styled.h3`
  margin-top: 0.24rem;
  font-size: 1.2rem;
  font-weight: 900;
  color: #1f2937;
`;

const StModalDescription = styled.p`
  margin-top: 0.38rem;
  font-size: 0.84rem;
  line-height: 1.55;
  color: #617186;

  @media (max-width: 720px) {
    font-size: 0.78rem;
  }
`;

const StCloseButton = styled.button`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: #eef2f7;
  color: #53657f;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 1.15rem;
    height: 1.15rem;
    fill: currentColor;
  }
`;

const StContentSection = styled.section`
  margin-top: 1rem;
`;

const StNaturalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: flex-start;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const StSectionEyebrow = styled.p`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6b82a8;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StSectionTitle = styled.h4`
  margin-top: 0.24rem;
  font-size: 1.3rem;
  font-weight: 900;
  color: #1f2937;
`;

const StMetaBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d7e2ef;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #56708e;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StSectionDescription = styled.p`
  margin-top: 0.55rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #617186;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StInputGuide = styled.p`
  margin-top: 0.8rem;
  font-size: 0.8rem;
  font-weight: 800;
  color: #4b65a0;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StNaturalInput = styled.input`
  width: 100%;
  margin-top: 0.6rem;
  border: 1px solid #d5dfec;
  border-radius: 18px;
  padding: 1rem 1.05rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #142132;
  background: rgba(255, 255, 255, 0.94);

  &:focus {
    outline: none;
    border-color: #7c9cf3;
    box-shadow: 0 0 0 4px rgba(124, 156, 243, 0.16);
  }
`;

const StHints = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.75rem;

  span {
    border-radius: 999px;
    background: #edf4ff;
    color: #4a689d;
    padding: 0.3rem 0.6rem;
    font-size: 0.74rem;
    font-weight: 700;
  }

  @media (max-width: 720px) {
    display: none;
  }
`;

const StPreview = styled.div<{ $valid: boolean }>`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  align-items: center;
  margin-top: 0.8rem;
  padding: 0.72rem 0.82rem;
  border-radius: 16px;
  border: 1px solid ${({ $valid }) => ($valid ? "#cfe0ba" : "#e2d3b8")};
  background: ${({ $valid }) => ($valid ? "#f4fbef" : "#fff8ec")};

  strong,
  span,
  em {
    font-size: 0.8rem;
    font-style: normal;
  }

  strong {
    color: #315d33;
    font-weight: 900;
  }

  span {
    color: #607186;
    font-weight: 700;
  }

  em {
    color: #274e9a;
    font-weight: 900;
  }
`;

const StActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 1rem;

  @media (max-width: 720px) {
    flex-direction: column-reverse;
  }
`;

const StButtonBase = styled.button`
  border-radius: 16px;
  font-size: 0.92rem;
  font-weight: 900;
  padding: 0.92rem 1rem;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const StPrimaryButton = styled(StButtonBase)`
  border: 1px solid #4e67d0;
  background: #5f73d9;
  color: #fff;
  box-shadow: 0 8px 20px rgba(74, 103, 204, 0.14);
`;

const StSecondaryButton = styled(StButtonBase)`
  border: 1px solid #cedbeb;
  background: rgba(255, 255, 255, 0.95);
  color: #506683;
`;
