"use client";

import { useEffect, useState } from "react";
import { buildTravelText } from "../../lib/export";
import type { TravelPlan } from "../../types";
import {
  StExportText,
  StHint,
  StModal,
  StModalActions,
  StModalBtn,
  StModalTitle,
  StOverlay,
} from "../page.styles";

// 일정 내보내기. 링크를 못 여는 사람에게도 통째로 보낼 수 있게 글자만 남긴다.
// 달력 파일(.ics)과 링크 공유는 다음 단계에서 열린다. (2026-09-16)

type ExportModalProps = {
  plan: TravelPlan;
  onClose: () => void;
};

export default function ExportModal({ plan, onClose }: ExportModalProps) {
  const [copied, setCopied] = useState(false);
  const text = buildTravelText(plan);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <StOverlay onClick={onClose}>
      <StModal $wide onClick={(event) => event.stopPropagation()}>
        <StModalTitle>📤 일정 내보내기</StModalTitle>

        <StExportText readOnly value={text} aria-label="여행 일정 글" />

        <StModalActions>
          <StModalBtn type="button" $variant="primary" onClick={handleCopy}>
            {copied ? "복사 완료" : "복사"}
          </StModalBtn>
          <StModalBtn type="button" onClick={onClose}>
            닫기
          </StModalBtn>
        </StModalActions>

        <StModalActions>
          <StModalBtn type="button" disabled>
            .ics 달력 파일
          </StModalBtn>
          <StModalBtn type="button" disabled>
            링크 공유
          </StModalBtn>
        </StModalActions>
        <StHint>다음 단계에서 열려요.</StHint>
      </StModal>
    </StOverlay>
  );
}
