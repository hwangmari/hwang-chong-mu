"use client";

import { useEffect, useState } from "react";
import { useModal } from "@/components/common/ModalProvider";
import { buildTravelIcs, buildTravelText, downloadTextFile } from "../../lib/export";
import type { TravelPlan } from "../../types";
import {
  StCopiedTag,
  StExportText,
  StModal,
  StModalActions,
  StModalBtn,
  StModalTitle,
  StOverlay,
} from "../page.styles";

// 일정 내보내기. 세 가지 길 — 글자로 복사 / 달력 파일(.ics) / 링크 공유.
// 링크를 못 여는 사람에게도 통째로 보낼 수 있게 글자 칸을 맨 위에 둔다. (2026-09-16)

type ExportModalProps = {
  plan: TravelPlan;
  onClose: () => void;
};

export default function ExportModal({ plan, onClose }: ExportModalProps) {
  const { openAlert } = useModal();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const text = buildTravelText(plan);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!shared) return;
    const timer = window.setTimeout(() => setShared(false), 1500);
    return () => window.clearTimeout(timer);
  }, [shared]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
      // 아무 일도 안 일어난 것처럼 보이면 사람은 계속 누르기만 한다 — 직접 복사하는 길을 알려 준다 (리뷰 반영 2026-09-16)
      await openAlert("복사에 실패했어요. 아래 글을 직접 선택해 복사해 주세요.");
    }
  };

  const handleIcs = () => {
    downloadTextFile(`${plan.title}.ics`, buildTravelIcs(plan), "text/calendar;charset=utf-8");
  };

  // 휴대폰은 기기의 공유 창을, 컴퓨터는 링크 복사를 쓴다 (KakaoCalendarShare 와 같은 방식)
  const handleShare = async () => {
    const url = window.location.href;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title: plan.title, text: "여행 플랜 같이 볼래요?", url });
      } catch {
        // 공유 창을 그냥 닫은 경우 — 아무 일도 하지 않는다
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
    } catch {
      await openAlert("링크 복사에 실패했어요.");
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
          <StModalBtn type="button" onClick={handleIcs}>
            .ics 달력 파일
          </StModalBtn>
          <StModalBtn type="button" onClick={() => void handleShare()}>
            링크 공유
          </StModalBtn>
        </StModalActions>

        {shared && <StCopiedTag>복사됐어요</StCopiedTag>}
      </StModal>
    </StOverlay>
  );
}
