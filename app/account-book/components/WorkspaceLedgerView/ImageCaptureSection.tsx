"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import styled from "styled-components";
import type { PaymentType } from "../../types";
import type { ExtractedImageEntryCandidate } from "./types";
import { getExtractedImageCandidateDuplicateKey } from "./utils";

type Props = {
  embedded?: boolean;
  isExtracting: boolean;
  errorMessage: string;
  fileName: string;
  extractedEntries: ExtractedImageEntryCandidate[];
  existingEntryDuplicateKeys: Set<string>;
  formatAmount: (value: number) => string;
  paymentLabel: (payment: PaymentType) => string;
  onSelectFile: (file: File) => void;
  onSaveEntries: (entries: ExtractedImageEntryCandidate[]) => void;
  onClear: () => void;
};

export default function ImageCaptureSection({
  embedded = false,
  isExtracting,
  errorMessage,
  fileName,
  extractedEntries,
  existingEntryDuplicateKeys,
  formatAmount,
  paymentLabel,
  onSelectFile,
  onSaveEntries,
  onClear,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [draftEntries, setDraftEntries] = useState<ExtractedImageEntryCandidate[]>(
    extractedEntries,
  );
  const [confirmedExistingDuplicateIds, setConfirmedExistingDuplicateIds] =
    useState<Set<string>>(new Set());

  const onClickUpload = () => {
    inputRef.current?.click();
  };

  const onChangeFile = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];
    if (nextFile) onSelectFile(nextFile);
    event.target.value = "";
  };

  const updateDraftEntry = (
    id: string,
    patch: Partial<ExtractedImageEntryCandidate>,
  ) => {
    setDraftEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)),
    );
  };

  const removeDraftEntry = (id: string) => {
    setDraftEntries((current) => current.filter((entry) => entry.id !== id));
    setConfirmedExistingDuplicateIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const duplicateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    draftEntries.forEach((entry) => {
      const key = getExtractedImageCandidateDuplicateKey(entry);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [draftEntries]);

  const duplicateGroupCount = useMemo(
    () => Array.from(duplicateCounts.values()).filter((count) => count > 1).length,
    [duplicateCounts],
  );
  const existingDuplicateCount = useMemo(
    () =>
      draftEntries.filter((entry) =>
        existingEntryDuplicateKeys.has(
          getExtractedImageCandidateDuplicateKey(entry),
        ),
      ).length,
    [draftEntries, existingEntryDuplicateKeys],
  );

  const sortedDraftEntries = useMemo(() => {
    return [...draftEntries].sort((left, right) => {
      const leftKey = getExtractedImageCandidateDuplicateKey(left);
      const rightKey = getExtractedImageCandidateDuplicateKey(right);
      const leftCount = duplicateCounts.get(leftKey) || 0;
      const rightCount = duplicateCounts.get(rightKey) || 0;
      const leftExistingDuplicate = existingEntryDuplicateKeys.has(leftKey);
      const rightExistingDuplicate = existingEntryDuplicateKeys.has(rightKey);

      if (leftExistingDuplicate !== rightExistingDuplicate) {
        return leftExistingDuplicate ? -1 : 1;
      }

      if ((leftCount > 1) !== (rightCount > 1)) {
        return leftCount > 1 ? -1 : 1;
      }

      if (leftKey !== rightKey) {
        return leftKey.localeCompare(rightKey, "ko");
      }

      return right.id.localeCompare(left.id, "ko");
    });
  }, [draftEntries, duplicateCounts, existingEntryDuplicateKeys]);

  const keepOnlyDuplicateEntry = (entryId: string, duplicateKey: string) => {
    setDraftEntries((current) =>
      current.filter(
        (entry) =>
          getExtractedImageCandidateDuplicateKey(entry) !== duplicateKey ||
          entry.id === entryId,
      ),
    );
  };

  const toggleConfirmExistingDuplicate = (entryId: string) => {
    setConfirmedExistingDuplicateIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) {
        next.delete(entryId);
      } else {
        next.add(entryId);
      }
      return next;
    });
  };

  const handleSaveEntries = (entries: ExtractedImageEntryCandidate[]) => {
    const unresolvedExistingDuplicates = entries.filter((entry) => {
      const duplicateKey = getExtractedImageCandidateDuplicateKey(entry);
      return (
        existingEntryDuplicateKeys.has(duplicateKey) &&
        !confirmedExistingDuplicateIds.has(entry.id)
      );
    });

    if (unresolvedExistingDuplicates.length > 0) {
      setIsConfirmOpen(true);
      alert(
        `이미 등록된 내역으로 보이는 후보가 ${unresolvedExistingDuplicates.length}건 있어요. 삭제하거나 '중복이어도 저장'을 체크해주세요.`,
      );
      return;
    }

    onSaveEntries(entries);
  };

  const content = (
    <>
      <StCaptureHeader>
        <div>
          <StCaptureEyebrow>Image OCR</StCaptureEyebrow>
          <StCaptureTitle>카드 캡처로 자동 입력</StCaptureTitle>
        </div>
        {fileName ? <StCaptureFileName>{fileName}</StCaptureFileName> : null}
      </StCaptureHeader>

      <StCaptureDescription>
        카드 승인내역이나 사용내역 캡처를 올리면 브라우저에서 무료 OCR로 거래
        후보를 추출하고, 확인 후 폼에 바로 채워 넣습니다.
      </StCaptureDescription>

      <StCaptureActions>
        <StPrimaryButton
          type="button"
          onClick={onClickUpload}
          disabled={isExtracting}
        >
          {isExtracting ? "텍스트 추출 중..." : "이미지 올리기"}
        </StPrimaryButton>
        <StSecondaryButton
          type="button"
          onClick={onClear}
          disabled={isExtracting && extractedEntries.length === 0}
        >
          결과 지우기
        </StSecondaryButton>
      </StCaptureActions>

      <StHiddenInput
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onChangeFile}
      />

      <StCaptureHints>
        <span>카드사 사용내역 캡처</span>
        <span>승인 문자 캡처</span>
        <span>거래가 여러 건이어도 추출 가능</span>
      </StCaptureHints>

      {errorMessage ? <StErrorText>{errorMessage}</StErrorText> : null}

      {extractedEntries.length > 0 ? (
        <StResultSummary>
          <span>{extractedEntries.length}건의 후보를 찾았어요.</span>
          <StSummaryActions>
            <StSecondaryButton
              type="button"
              onClick={() => setIsConfirmOpen(true)}
            >
              확인하고 수정
            </StSecondaryButton>
            <StPrimaryButton
              type="button"
              onClick={() => handleSaveEntries(extractedEntries)}
            >
              저장하기
            </StPrimaryButton>
          </StSummaryActions>
        </StResultSummary>
      ) : null}

      {isConfirmOpen && extractedEntries.length > 0 ? (
        <StConfirmBackdrop onClick={() => setIsConfirmOpen(false)}>
          <StConfirmCard onClick={(event) => event.stopPropagation()}>
            <StConfirmHeader>
              <div>
                <StCaptureEyebrow>Image OCR</StCaptureEyebrow>
                <StConfirmTitle>추출 결과 수정</StConfirmTitle>
              </div>
              <StCloseButton
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                aria-label="닫기"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z" />
                </svg>
              </StCloseButton>
            </StConfirmHeader>

            {duplicateGroupCount > 0 ? (
              <StDuplicateNotice>
                같은 이미지에서 중복으로 추출된 것으로 보이는 묶음이 {duplicateGroupCount}개 있어요. 확인 후
                `이것만 남기기` 또는 `삭제`로 정리해주세요.
              </StDuplicateNotice>
            ) : null}

            {existingDuplicateCount > 0 ? (
              <StExistingDuplicateNotice>
                이미 같은 날짜와 금액, 내역으로 등록된 후보가 {existingDuplicateCount}건 있어요. 저장하려면
                각 항목에서 `중복이어도 저장`을 체크하거나, 삭제로 제외해주세요.
              </StExistingDuplicateNotice>
            ) : null}

            <StResultList>
              {sortedDraftEntries.map((entry) => {
                const duplicateKey = getExtractedImageCandidateDuplicateKey(entry);
                const duplicateCount = duplicateCounts.get(duplicateKey) || 0;
                const isExistingDuplicate =
                  existingEntryDuplicateKeys.has(duplicateKey);
                const isConfirmedExistingDuplicate =
                  confirmedExistingDuplicateIds.has(entry.id);

                return (
                  <StResultCard
                    key={entry.id}
                    $duplicate={duplicateCount > 1 || isExistingDuplicate}
                  >
                    <StResultTop>
                      <StResultMeta>
                        <span>{entry.date || "날짜 미확인"}</span>
                        <strong>{entry.merchant || entry.item || "가맹점 미확인"}</strong>
                      </StResultMeta>
                      <StResultSide>
                        <StAmountBadge>
                          {entry.amount > 0 ? formatAmount(entry.amount) : "금액 미확인"}
                        </StAmountBadge>
                        <StConfidenceBadge $confidence={entry.confidence}>
                          {entry.confidence === "high"
                            ? "높음"
                            : entry.confidence === "low"
                              ? "낮음"
                              : "보통"}
                        </StConfidenceBadge>
                        {duplicateCount > 1 ? (
                          <>
                            <StDuplicateBadge>중복 {duplicateCount}건</StDuplicateBadge>
                            <StKeepOnlyButton
                              type="button"
                              onClick={() => keepOnlyDuplicateEntry(entry.id, duplicateKey)}
                            >
                              이것만 남기기
                            </StKeepOnlyButton>
                          </>
                        ) : null}
                        {isExistingDuplicate ? (
                          <>
                            <StExistingDuplicateBadge>이미 등록됨</StExistingDuplicateBadge>
                            <StDuplicateCheckboxLabel>
                              <input
                                type="checkbox"
                                checked={isConfirmedExistingDuplicate}
                                onChange={() =>
                                  toggleConfirmExistingDuplicate(entry.id)
                                }
                              />
                              <span>중복이어도 저장</span>
                            </StDuplicateCheckboxLabel>
                          </>
                        ) : null}
                        <StDeleteButton
                          type="button"
                          onClick={() => removeDraftEntry(entry.id)}
                          aria-label="이 후보 삭제"
                        >
                          삭제
                        </StDeleteButton>
                      </StResultSide>
                    </StResultTop>

                    <StCompactRow>
                      <StCompactInput
                        value={entry.date}
                        onChange={(event) =>
                          updateDraftEntry(entry.id, { date: event.target.value })
                        }
                        placeholder="날짜"
                        aria-label="날짜"
                      />
                      <StCompactInput
                        value={entry.merchant}
                        onChange={(event) =>
                          updateDraftEntry(entry.id, { merchant: event.target.value })
                        }
                        placeholder="가맹점"
                        aria-label="가맹점"
                      />
                      <StCompactInput
                        value={entry.item}
                        onChange={(event) =>
                          updateDraftEntry(entry.id, { item: event.target.value })
                        }
                        placeholder="항목"
                        aria-label="항목"
                      />
                      <StCompactNumberInput
                        type="number"
                        min="0"
                        value={entry.amount > 0 ? String(entry.amount) : ""}
                        onChange={(event) =>
                          updateDraftEntry(entry.id, {
                            amount: Number(event.target.value) || 0,
                          })
                        }
                        placeholder="금액"
                        aria-label="금액"
                      />
                    </StCompactRow>

                    <StCompactRow>
                      <StCompactInput
                        value={entry.category}
                        onChange={(event) =>
                          updateDraftEntry(entry.id, { category: event.target.value })
                        }
                        placeholder="카테고리"
                        aria-label="카테고리"
                      />
                      <StCompactSelect
                        value={entry.type}
                        onChange={(event) =>
                          updateDraftEntry(entry.id, {
                            type: event.target.value as ExtractedImageEntryCandidate["type"],
                          })
                        }
                        aria-label="구분"
                      >
                        <option value="">구분</option>
                        <option value="expense">지출</option>
                        <option value="income">수입</option>
                      </StCompactSelect>
                      <StCompactSelect
                        value={entry.payment}
                        onChange={(event) =>
                          updateDraftEntry(entry.id, {
                            payment: event.target.value as ExtractedImageEntryCandidate["payment"],
                          })
                        }
                        aria-label="결제수단"
                      >
                        <option value="">결제수단</option>
                        <option value="cash">{paymentLabel("cash")}</option>
                        <option value="card">{paymentLabel("card")}</option>
                        <option value="check_card">{paymentLabel("check_card")}</option>
                      </StCompactSelect>
                      <StCompactInput
                        value={entry.memo}
                        onChange={(event) =>
                          updateDraftEntry(entry.id, { memo: event.target.value })
                        }
                        placeholder="메모"
                        aria-label="메모"
                      />
                    </StCompactRow>

                    {entry.rawText ? <StRawText>{entry.rawText}</StRawText> : null}
                  </StResultCard>
                );
              })}
            </StResultList>

            <StConfirmActions>
              <StSecondaryButton
                type="button"
                onClick={() => setIsConfirmOpen(false)}
              >
                닫기
              </StSecondaryButton>
              <StPrimaryButton
                type="button"
                onClick={() => {
                  const unresolvedExistingDuplicates = draftEntries.filter((entry) => {
                    const duplicateKey =
                      getExtractedImageCandidateDuplicateKey(entry);
                    return (
                      existingEntryDuplicateKeys.has(duplicateKey) &&
                      !confirmedExistingDuplicateIds.has(entry.id)
                    );
                  });

                  if (unresolvedExistingDuplicates.length > 0) {
                    alert(
                      `이미 등록된 내역으로 보이는 후보가 ${unresolvedExistingDuplicates.length}건 있어요. 삭제하거나 '중복이어도 저장'을 체크해주세요.`,
                    );
                    return;
                  }

                  onSaveEntries(draftEntries);
                  setIsConfirmOpen(false);
                }}
              >
                수정 후 저장하기
              </StPrimaryButton>
            </StConfirmActions>
          </StConfirmCard>
        </StConfirmBackdrop>
      ) : null}
    </>
  );

  if (embedded) {
    return <StEmbeddedCapture>{content}</StEmbeddedCapture>;
  }

  return <StCaptureCard>{content}</StCaptureCard>;
}

const StCaptureCard = styled.section`
  border: 1px solid #d6e1ee;
  border-radius: 24px;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 20px 45px rgba(87, 108, 146, 0.08);
`;

const StEmbeddedCapture = styled.section`
  border: 1px solid #dbe7df;
  border-radius: 22px;
  padding: 1rem;
  background: linear-gradient(180deg, rgba(245, 251, 247, 0.95), rgba(255, 255, 255, 0.98));
`;

const StCaptureHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;

  @media (max-width: 720px) {
    flex-direction: column;
  }
`;

const StCaptureEyebrow = styled.p`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #4a8d72;
`;

const StCaptureTitle = styled.h2`
  margin-top: 0.24rem;
  font-size: 1.35rem;
  font-weight: 900;
  color: #1f2937;
`;

const StCaptureFileName = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d7e2ef;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #56708e;
`;

const StCaptureDescription = styled.p`
  margin-top: 0.5rem;
  font-size: 0.9rem;
  line-height: 1.6;
  color: #617186;
`;

const StCaptureActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 0.9rem;
`;

const StPrimaryButton = styled.button`
  border: 1px solid #2f7d59;
  border-radius: 16px;
  background: #3b9a6f;
  color: #fff;
  font-size: 0.94rem;
  font-weight: 900;
  padding: 0.92rem 1.1rem;
  box-shadow: 0 8px 20px rgba(52, 125, 95, 0.14);

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
`;

const StSecondaryButton = styled.button`
  border: 1px solid #cedbeb;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.95);
  color: #506683;
  font-size: 0.9rem;
  font-weight: 800;
  padding: 0.92rem 1rem;
`;

const StHiddenInput = styled.input`
  display: none;
`;

const StCaptureHints = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.75rem;

  span {
    border-radius: 999px;
    background: #edf9f2;
    color: #357458;
    padding: 0.3rem 0.6rem;
    font-size: 0.74rem;
    font-weight: 700;
  }
`;

const StErrorText = styled.p`
  margin-top: 0.8rem;
  font-size: 0.84rem;
  color: #c03b61;
  font-weight: 700;
`;

const StResultSummary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.95rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid #dde6f0;
  border-radius: 18px;
  background: #f8fbff;

  span {
    font-size: 0.86rem;
    font-weight: 800;
    color: #4f627d;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const StSummaryActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
`;

const StConfirmBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.22);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  z-index: 121;
`;

const StConfirmCard = styled.div`
  width: min(720px, 100%);
  max-height: min(82vh, 880px);
  overflow: auto;
  border: 1px solid #d9e3ef;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.98);
  padding: 1rem;
  box-shadow: 0 24px 48px rgba(45, 62, 100, 0.14);
`;

const StConfirmHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
  margin-bottom: 0.95rem;
`;

const StDuplicateNotice = styled.p`
  margin-bottom: 0.9rem;
  border: 1px solid #f0dcc3;
  border-radius: 14px;
  background: #fff8ef;
  padding: 0.72rem 0.82rem;
  font-size: 0.82rem;
  line-height: 1.55;
  color: #8b6843;
  font-weight: 700;
`;

const StExistingDuplicateNotice = styled.p`
  margin-bottom: 0.9rem;
  border: 1px solid #f0d6d9;
  border-radius: 14px;
  background: #fff6f7;
  padding: 0.72rem 0.82rem;
  font-size: 0.82rem;
  line-height: 1.55;
  color: #9d5664;
  font-weight: 700;
`;

const StConfirmTitle = styled.h3`
  margin-top: 0.24rem;
  font-size: 1.2rem;
  font-weight: 900;
  color: #1f2937;
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

const StResultList = styled.div`
  display: grid;
  gap: 0.75rem;
  margin-top: 0.9rem;
`;

const StResultCard = styled.article<{ $duplicate: boolean }>`
  border: 1px solid ${({ $duplicate }) => ($duplicate ? "#f0dcc3" : "#d9e7de")};
  border-radius: 18px;
  background: ${({ $duplicate }) =>
    $duplicate ? "rgba(255, 250, 243, 0.96)" : "rgba(255, 255, 255, 0.94)"};
  padding: 0.9rem;
`;

const StResultTop = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: flex-start;
`;

const StResultMeta = styled.div`
  display: grid;
  gap: 0.18rem;

  span {
    font-size: 0.74rem;
    font-weight: 800;
    color: #69807a;
  }

  strong {
    font-size: 1rem;
    font-weight: 900;
    color: #1d3340;
  }
`;

const StResultSide = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

const StAmountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.28rem 0.58rem;
  font-size: 0.74rem;
  font-weight: 900;
  color: #2d7f5b;
  background: #eff8f2;
`;

const StConfidenceBadge = styled.span<{ $confidence: "high" | "medium" | "low" }>`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 900;
  color: ${({ $confidence }) =>
    $confidence === "high"
      ? "#24604a"
      : $confidence === "low"
        ? "#a6593c"
        : "#4b688f"};
  background: ${({ $confidence }) =>
    $confidence === "high"
      ? "#e6f7ee"
      : $confidence === "low"
        ? "#fff1e8"
        : "#edf4ff"};
`;

const StDeleteButton = styled.button`
  border: 1px solid #e4cfd4;
  border-radius: 999px;
  background: #fff6f7;
  color: #b25467;
  padding: 0.28rem 0.58rem;
  font-size: 0.72rem;
  font-weight: 900;
`;

const StDuplicateBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.28rem 0.58rem;
  font-size: 0.72rem;
  font-weight: 900;
  color: #9a6b2f;
  background: #fff1db;
`;

const StKeepOnlyButton = styled.button`
  border: 1px solid #e7d5b6;
  border-radius: 999px;
  background: #fffaf0;
  color: #8c6a36;
  padding: 0.28rem 0.58rem;
  font-size: 0.72rem;
  font-weight: 900;
`;

const StExistingDuplicateBadge = styled.span`
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 0.28rem 0.58rem;
  font-size: 0.72rem;
  font-weight: 900;
  color: #a84f61;
  background: #ffecee;
`;

const StDuplicateCheckboxLabel = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border-radius: 999px;
  border: 1px solid #ead7db;
  background: #fff;
  padding: 0.24rem 0.52rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #7d5b64;

  input {
    margin: 0;
  }
`;

const StCompactRow = styled.div`
  display: grid;
  grid-template-columns: minmax(112px, 0.9fr) minmax(0, 1.4fr) minmax(0, 1.4fr) minmax(108px, 0.8fr);
  gap: 0.5rem;
  margin-top: 0.55rem;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StRawText = styled.p`
  margin-top: 0.7rem;
  font-size: 0.82rem;
  line-height: 1.55;
  color: #6d7b8d;
`;

const inputBase = `
  width: 100%;
  border: 1px solid #dce5ed;
  border-radius: 10px;
  background: #fff;
  padding: 0.58rem 0.72rem;
  font-size: 0.82rem;
  color: #1d3340;
  min-height: 40px;

  &:focus {
    outline: none;
    border-color: #7a9ed6;
    box-shadow: 0 0 0 3px rgba(122, 158, 214, 0.14);
  }
`;

const StCompactInput = styled.input`
  ${inputBase}
`;

const StCompactNumberInput = styled.input`
  ${inputBase}
`;

const StCompactSelect = styled.select`
  ${inputBase}
`;

const StConfirmActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
  margin-top: 0.95rem;
`;
