"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styled from "styled-components";
import ModalCloseButton from "../ModalCloseButton";
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
  monthEntriesCount: _monthEntriesCount,
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
          <StModalTitleBlock>
            <StModalTitle>
              {mode === "natural" ? "문장등록" : "이미지등록"}
            </StModalTitle>
            <StModalDescription>
              {mode === "natural"
                ? "언제, 어디서, 무엇을(카테고리), 어떤 결제방법으로, 얼마나 사용했는지 순서로 적어주세요."
                : "캡처 이미지를 올려 OCR 결과를 수정한 뒤 저장할 수 있어요."}
            </StModalDescription>
          </StModalTitleBlock>
          <StHeaderCloseButton onClick={onCloseModal} />
        </StModalHeader>

        {mode === "natural" ? (
          <StContentSection>
            <StComposerCard>
              <StNaturalInput
                ref={naturalInputRef}
                value={naturalInput}
                onChange={(event) => onChangeInput(event.target.value)}
                onKeyDown={handleNaturalKeyDown}
                placeholder="예: 오늘 스타벅스 카페 네이버현대카드 6000원"
              />
            </StComposerCard>

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
                    {naturalPreview.payment !== "cash" &&
                    naturalPreview.cardCompany ? (
                      <span>{naturalPreview.cardCompany}</span>
                    ) : null}
                    <em>{formatAmount(naturalPreview.amount)}</em>
                  </>
                ) : (
                  <span>
                    날짜와 금액이 포함된 문장으로 적어주시면 더 정확하게
                    기록돼요.
                  </span>
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

  @media (max-width: 720px) {
    align-items: flex-end;
    padding: 0.75rem;
  }
`;

const StModalCard = styled.div`
  width: min(660px, 100%);
  max-height: min(84vh, 920px);
  overflow: auto;
  border: 1px solid #d9e3ef;
  border-radius: 26px;
  background: #ffffff;
  padding: 1.6rem 1.2rem 1.05rem;
  box-shadow: 0 24px 48px rgba(45, 62, 100, 0.14);

  @media (max-width: 720px) {
    width: 100%;
    max-height: min(92vh, 920px);
    padding: 1.2rem 0.9rem calc(0.95rem + env(safe-area-inset-bottom));
    border-radius: 28px 28px 22px 22px;
  }
`;

const StModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
`;

const StModalTitleBlock = styled.div`
  min-width: 0;
  display: grid;
  gap: 0.4rem;
`;

const StModalTitle = styled.h3`
  font-size: 1.55rem;
  line-height: 1.15;
  font-weight: 900;
  color: #1f2937;

  @media (max-width: 720px) {
    font-size: 1.35rem;
  }
`;

const StModalDescription = styled.p`
  max-width: 38rem;
  font-size: 0.88rem;
  line-height: 1.5;
  color: #617186;

  @media (max-width: 720px) {
    font-size: 0.84rem;
    line-height: 1.45;
  }
`;

const StHeaderCloseButton = styled(ModalCloseButton).attrs({
  size: "2.5rem",
  iconSize: "1.5rem",
  mobileSize: "2.25rem",
  mobileIconSize: "1.35rem",
})`
  margin-top: -0.65rem;
`;

const StContentSection = styled.section`
  margin-top: 0.85rem;
`;

const StComposerCard = styled.section`
  margin-top: 0.1rem;
  padding: 0;

  @media (max-width: 720px) {
    margin-top: 0.1rem;
  }
`;

const StNaturalInput = styled.input`
  width: 100%;
  border: 1px solid #d5dfec;
  border-radius: 1.1rem;
  height: 3.5rem;
  padding: 0 1rem;
  font-size: 1rem;
  line-height: 1.4;
  color: #142132;
  background: #ffffff;

  &:focus {
    outline: none;
    border-color: #7c9cf3;
    box-shadow: 0 0 0 4px rgba(124, 156, 243, 0.16);
  }

  &::placeholder {
    color: #8a99ad;
  }

  @media (max-width: 720px) {
    font-size: 0.96rem;
    height: 3.2rem;
    padding: 0 0.95rem;
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

  @media (max-width: 720px) {
    margin-top: 0.75rem;
    gap: 0.4rem;
    padding: 0.82rem 0.85rem;
    border-radius: 18px;
  }
`;

const StActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.65rem;
  margin-top: 1rem;

  @media (max-width: 720px) {
    position: sticky;
    bottom: calc(-0.95rem - env(safe-area-inset-bottom));
    margin: 0 -0.1rem -0.2rem;
    padding: 0.95rem 0.1rem calc(0.1rem + env(safe-area-inset-bottom));
  }
`;

const StButtonBase = styled.button`
  border-radius: 16px;
  font-size: 0.9rem;
  font-weight: 900;
  min-width: 7rem;
  min-height: 3rem;
  padding: 0.82rem 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 720px) {
    width: 100%;
    min-height: 3rem;
  }
`;

const StPrimaryButton = styled(StButtonBase)`
  border: 1px solid #4e67d0;
  background: #5f73d9;
  color: #fff;
  box-shadow: 0 8px 20px rgba(74, 103, 204, 0.14);
  min-width: 9.5rem;
`;

const StSecondaryButton = styled(StButtonBase)`
  border: 1px solid #cedbeb;
  background: rgba(255, 255, 255, 0.95);
  color: #506683;
`;
