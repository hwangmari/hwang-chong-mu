"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import styled from "styled-components";
import ModalCloseButton from "../ModalCloseButton";
import {
  StAbModalBackdrop,
  StAbModalCard,
  StAbModalHeader,
  StAbModalTitleBlock,
  StAbModalTitle,
  StAbModalDescription,
  StAbPrimaryButton,
  StAbSecondaryButton,
  media,
} from "../shared";
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
    <StAbModalBackdrop onClick={onCloseModal}>
      <StAbModalCard onClick={(event) => event.stopPropagation()}>
        <StAbModalHeader>
          <StAbModalTitleBlock>
            <StAbModalTitle>
              {mode === "natural" ? "문장등록" : "이미지등록"}
            </StAbModalTitle>
            <StAbModalDescription>
              {mode === "natural"
                ? "언제, 어디서, 무엇을(카테고리), 어떤 결제방법으로, 얼마나 사용했는지 순서로 적어주세요."
                : "캡처 이미지를 올려 OCR 결과를 수정한 뒤 저장할 수 있어요."}
            </StAbModalDescription>
          </StAbModalTitleBlock>
          <StHeaderCloseButton onClick={onCloseModal} />
        </StAbModalHeader>

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
              <StAbSecondaryButton type="button" onClick={onCloseModal}>
                닫기
              </StAbSecondaryButton>
              <StAbPrimaryButton type="button" onClick={onSubmit} style={{ minWidth: "9.5rem" }}>
                기록하기
              </StAbPrimaryButton>
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
      </StAbModalCard>
    </StAbModalBackdrop>
  );
}

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
  background: ${({ theme }) => theme.colors.white};

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

  ${media.mobile} {
    position: sticky;
    bottom: calc(-0.95rem - env(safe-area-inset-bottom));
    margin: 0 -0.1rem -0.2rem;
    padding: 0.95rem 0.1rem calc(0.1rem + env(safe-area-inset-bottom));
  }
`;
