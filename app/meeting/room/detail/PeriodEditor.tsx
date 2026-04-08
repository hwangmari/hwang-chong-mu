"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { format, parseISO } from "date-fns";

interface PeriodEditorProps {
  startDate: string;
  endDate: string;
  onSave: (start: string, end: string) => void;
}

export default function PeriodEditor({
  startDate,
  endDate,
  onSave,
}: PeriodEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [start, setStart] = useState(startDate);
  const [end, setEnd] = useState(endDate);

  useEffect(() => {
    setStart(startDate);
    setEnd(endDate);
  }, [startDate, endDate]);

  const handleOpen = () => {
    setStart(startDate);
    setEnd(endDate);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!start || !end || start > end) return;
    onSave(start, end);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <StToggleButton onClick={handleOpen}>
        <span className="emoji">📅</span>
        <span>
          {format(parseISO(startDate), "M.d")} ~{" "}
          {format(parseISO(endDate), "M.d")}
        </span>
      </StToggleButton>

      {isOpen && (
        <StOverlay onClick={handleCancel}>
          <StModal onClick={(e) => e.stopPropagation()}>
            <StIcon>📅</StIcon>
            <StTitle>투표 기간 변경</StTitle>

            <StDateColumn>
              <StDateBox>
                <StDateLabel>시작일</StDateLabel>
                <StDateInput
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </StDateBox>
              <StDateBox>
                <StDateLabel>종료일</StDateLabel>
                <StDateInput
                  type="date"
                  value={end}
                  min={start}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </StDateBox>
            </StDateColumn>

            <StButtonGroup>
              <StCancelButton onClick={handleCancel}>취소</StCancelButton>
              <StConfirmButton
                onClick={handleSave}
                disabled={!start || !end || start > end}
              >
                적용하기
              </StConfirmButton>
            </StButtonGroup>
          </StModal>
        </StOverlay>
      )}
    </>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const popIn = keyframes`
  0% { transform: scale(0.95); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

const StToggleButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 36px;
  padding: 0 0.9rem;
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  .emoji {
    font-size: 0.9rem;
  }

  &:hover {
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    background-color: ${({ theme }) => theme.colors.gray50};
    color: ${({ theme }) => theme.colors.gray800};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  animation: ${fadeIn} 0.2s ease-out;
`;

const StModal = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  width: 100%;
  max-width: 20rem;
  padding: 1.5rem;
  border-radius: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${popIn} 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  text-align: center;
`;

const StIcon = styled.div`
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
`;

const StTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 1.25rem;
`;

const StDateColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
`;

const StDateBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StDateLabel = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray400};
  padding-left: 0.25rem;
`;

const StDateInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.75rem;
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  background-color: ${({ theme }) => theme.colors.white};
  transition: border-color 0.2s, box-shadow 0.2s;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.gray400};
    box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.2);
  }
`;

const StButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const StButtonBase = styled.button`
  flex: 1;
  padding: 0.75rem 0;
  font-weight: 700;
  border-radius: 0.75rem;
  transition: all 0.2s;
`;

const StCancelButton = styled(StButtonBase)`
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};

  &:hover {
    background-color: ${({ theme }) => theme.colors.gray200};
  }
`;

const StConfirmButton = styled(StButtonBase)`
  background-color: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: ${({ theme }) => theme.colors.black};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
