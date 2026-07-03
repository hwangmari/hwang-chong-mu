"use client";

import { useState } from "react";
import styled from "styled-components";

type Props = {
  memo: string;
  onChangeMemo: (value: string) => void;
  onSaveMemo: () => void;
  // 팝오버가 열리는 방향. 버튼이 화면 하단에 있으면 "top"으로 위로 펼친다.
  placement?: "bottom" | "top";
};

export default function MonthlyIssueMemo({
  memo,
  onChangeMemo,
  onSaveMemo,
  placement = "bottom",
}: Props) {
  const [isMemoOpen, setIsMemoOpen] = useState(false);
  const hasMemo = memo.trim().length > 0;

  const handleSaveMemo = () => {
    onSaveMemo();
    setIsMemoOpen(false);
  };

  return (
    <StMemoAnchor>
      <StMemoTriggerButton
        type="button"
        $active={isMemoOpen}
        onClick={() => setIsMemoOpen((prev) => !prev)}
        aria-expanded={isMemoOpen}
      >
        <span aria-hidden>📝</span>
        이번 달 이슈
        {hasMemo ? <StMemoDot aria-label="작성된 메모 있음" /> : null}
      </StMemoTriggerButton>
      {isMemoOpen ? (
        <>
          <StMemoBackdrop
            type="button"
            aria-label="메모 닫기"
            onClick={() => setIsMemoOpen(false)}
          />
          <StMemoPopover
            role="dialog"
            aria-label="이번 달 이슈 메모"
            $placement={placement}
          >
            <StMemoPopoverTitle>이번 달 이슈 · 체크</StMemoPopoverTitle>
            <StMemoTextarea
              value={memo}
              onChange={(event) => onChangeMemo(event.target.value)}
              placeholder="이번 달 챙길 이슈, 예산 메모, 공유 전 확인할 항목을 적어두세요."
              autoFocus
            />
            <StMemoSaveButton type="button" onClick={handleSaveMemo}>
              저장
            </StMemoSaveButton>
          </StMemoPopover>
        </>
      ) : null}
    </StMemoAnchor>
  );
}

const StMemoAnchor = styled.div`
  position: relative;
  flex-shrink: 0;
`;

const StMemoTriggerButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid ${({ $active }) => ($active ? "#cdced1" : "#dadcde")};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? "#f6f6f7" : "#ffffff")};
  padding: 0.42rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #2e5290;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease;

  &:hover {
    border-color: #cdcfd2;
    background: #f6f6f7;
  }
`;

const StMemoDot = styled.span`
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 999px;
  background: #f0803c;
`;

const StMemoBackdrop = styled.button`
  position: fixed;
  inset: 0;
  z-index: 40;
  border: none;
  background: transparent;
  cursor: default;
`;

const StMemoPopover = styled.div<{ $placement: "bottom" | "top" }>`
  position: absolute;
  ${({ $placement }) =>
    $placement === "top"
      ? "bottom: calc(100% + 0.5rem);"
      : "top: calc(100% + 0.5rem);"}
  right: 0;
  z-index: 41;
  width: min(320px, 78vw);
  display: grid;
  gap: 0.55rem;
  border: 1px solid #e5e6e7;
  border-radius: 16px;
  background: #ffffff;
  padding: 0.85rem;
  box-shadow: 0 14px 30px rgba(93, 97, 103, 0.16);

  @media (max-width: 900px) {
    right: auto;
    left: 0;
  }
`;

const StMemoPopoverTitle = styled.strong`
  font-size: 0.84rem;
  font-weight: 900;
  color: #1f375f;
`;

const StMemoTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  border: 1px solid #e4e5e7;
  border-radius: 12px;
  background: #fdfdfd;
  padding: 0.7rem 0.75rem;
  resize: vertical;
  font-size: 0.82rem;
  line-height: 1.5;
  color: #1f375f;
  outline: none;

  &:focus {
    border-color: #cdced1;
  }
`;

const StMemoSaveButton = styled.button`
  justify-self: end;
  border: 1px solid #cdced1;
  border-radius: 999px;
  background: #f6f6f7;
  padding: 0.42rem 1.1rem;
  font-size: 0.78rem;
  font-weight: 800;
  color: #2e5290;
  cursor: pointer;

  &:hover {
    background: #f0f0f1;
  }
`;
