"use client";

import { useEffect, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { useModal } from "@/components/common/ModalProvider";
import { nightsLabel } from "../../lib/plan";
import type { TravelDay, TravelPlan } from "../../types";
import {
  StCopiedTag,
  StGhostBtn,
  StHeaderActions,
  StHeaderCard,
  StHeaderTop,
  StModal,
  StModalActions,
  StModalBtn,
  StModalField,
  StModalFields,
  StModalLabel,
  StModalTitle,
  StOverlay,
  StRangeChip,
  StTextInput,
  StTitleInput,
  StTitleRow,
  StTitleText,
} from "../page.styles";

// 여행 이름은 눌러서 바로 고친다(따로 "수정" 화면을 두지 않으려고).
// 기간 칩을 누르면 작은 창이 열리고, 날짜를 줄여서 적어 둔 장소가 사라질 때만 한 번 물어본다. (2026-09-16)

type TripHeaderProps = {
  plan: TravelPlan;
  busy: boolean;
  onRename: (title: string) => void;
  onChangeRange: (start: string, end: string) => Promise<boolean>;
  daysThatWouldDrop: (start: string, end: string) => TravelDay[];
  onOpenExport: () => void;
  onDirty: (value: boolean) => void;
};

/** "2026.10.16–10.18" (같은 날이면 하루만) */
function rangeText(start: string, end: string): string {
  const from = parseISO(start);
  const to = parseISO(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return `${start}–${end}`;
  const head = format(from, "yyyy.MM.dd");
  if (start === end) return head;
  // 해를 넘기는 여행은 뒤쪽 연도를 지우면 안 된다 ("2026.12.30–2027.01.02") (리뷰 반영 2026-09-16)
  return `${head}–${format(to, start.slice(0, 4) === end.slice(0, 4) ? "MM.dd" : "yyyy.MM.dd")}`;
}

export default function TripHeader({
  plan,
  busy,
  onRename,
  onChangeRange,
  daysThatWouldDrop,
  onOpenExport,
  onDirty,
}: TripHeaderProps) {
  const { openConfirm, openAlert } = useModal();

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(plan.title);
  const [copied, setCopied] = useState(false);

  const [rangeOpen, setRangeOpen] = useState(false);
  const [start, setStart] = useState(plan.startDate);
  const [end, setEnd] = useState(plan.endDate);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const startEditTitle = () => {
    setDraftTitle(plan.title);
    setEditingTitle(true);
    onDirty(true);
  };

  const finishEditTitle = () => {
    setEditingTitle(false);
    onDirty(false);
    onRename(draftTitle);
  };

  const openRange = () => {
    setStart(plan.startDate);
    setEnd(plan.endDate);
    setRangeOpen(true);
  };

  const saveRange = async () => {
    if (savingRef.current) return;
    const dropped = daysThatWouldDrop(start, end);
    if (dropped.length > 0) {
      const ok = await openConfirm(
        `날짜를 줄이면 ${dropped.length}일치 장소가 지워져요. 계속할까요?`,
      );
      if (!ok) return;
    }
    savingRef.current = true;
    const done = await onChangeRange(start, end);
    savingRef.current = false;
    if (done) setRangeOpen(false);
  };

  const handleShare = async () => {
    const url = decodeURI(window.location.href);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title: plan.title, text: "같이 여행 일정 짜요", url });
      } catch {
        // 공유 창을 닫은 것뿐이라 아무것도 하지 않는다
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      await openAlert("링크 복사에 실패했어요. 주소창의 주소를 직접 복사해 주세요.");
    }
  };

  return (
    <StHeaderCard>
      <StHeaderTop>
        <StTitleRow>
          <span aria-hidden="true">🧳</span>
          {editingTitle ? (
            <StTitleInput
              value={draftTitle}
              autoFocus
              maxLength={40}
              aria-label="여행 이름"
              onChange={(event) => setDraftTitle(event.target.value)}
              onBlur={finishEditTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
                if (event.key === "Escape") {
                  setDraftTitle(plan.title);
                  setEditingTitle(false);
                  onDirty(false);
                }
              }}
            />
          ) : (
            <StTitleText onClick={startEditTitle} title="눌러서 이름 고치기">
              {plan.title}
            </StTitleText>
          )}
        </StTitleRow>

        <StHeaderActions>
          {copied && <StCopiedTag>복사됐어요</StCopiedTag>}
          <StGhostBtn type="button" onClick={handleShare}>
            🔗 링크 공유
          </StGhostBtn>
          <StGhostBtn type="button" onClick={onOpenExport}>
            📤 일정 내보내기
          </StGhostBtn>
        </StHeaderActions>
      </StHeaderTop>

      <StRangeChip type="button" onClick={openRange}>
        📅 {rangeText(plan.startDate, plan.endDate)} · {nightsLabel(plan.startDate, plan.endDate)}
      </StRangeChip>

      {rangeOpen && (
        <StOverlay onClick={() => setRangeOpen(false)}>
          <StModal onClick={(event) => event.stopPropagation()}>
            <StModalTitle>📅 여행 기간 바꾸기</StModalTitle>
            <StModalFields>
              <StModalField>
                <StModalLabel>출발</StModalLabel>
                <StTextInput
                  type="date"
                  value={start}
                  onChange={(event) => setStart(event.target.value)}
                />
              </StModalField>
              <StModalField>
                <StModalLabel>돌아오는 날</StModalLabel>
                <StTextInput
                  type="date"
                  value={end}
                  min={start}
                  onChange={(event) => setEnd(event.target.value)}
                />
              </StModalField>
            </StModalFields>
            <StModalActions>
              <StModalBtn type="button" onClick={() => setRangeOpen(false)}>
                취소
              </StModalBtn>
              <StModalBtn
                type="button"
                $variant="primary"
                disabled={!start || !end || start > end || busy}
                onClick={saveRange}
              >
                적용하기
              </StModalBtn>
            </StModalActions>
          </StModal>
        </StOverlay>
      )}
    </StHeaderCard>
  );
}
