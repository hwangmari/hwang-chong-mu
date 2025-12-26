"use client";

import styled, { keyframes } from "styled-components";

interface Props {
  isEditing: boolean;
  onSubmitVote: () => void;
  onSubmitAbsent: () => void;
}

export default function VoteSubmitButtons({
  isEditing,
  onSubmitVote,
  onSubmitAbsent,
}: Props) {
  return (
    <StSubmitSection>
      <StSubmitButton onClick={onSubmitVote}>
        <span>{isEditing ? "수정 완료" : "일정 저장하기"}</span>
        <span className="text-xl">💾</span>
      </StSubmitButton>

      <StAbsentButton onClick={onSubmitAbsent}>
        혹시 이번 모임은 어려우신가요?
        <span className="underline">불참 알리기 🥲</span>
      </StAbsentButton>
    </StSubmitSection>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const StSubmitSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 2.5rem;
  animation: ${fadeIn} 0.3s ease-out;
`;

const StSubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.gray400};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;

  &:hover {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const StAbsentButton = styled.button`
  width: 100%;
  padding: 0.75rem 0;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 500;
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.gray600};
  }

  .underline {
    text-decoration: underline;
    text-decoration-color: ${({ theme }) => theme.colors.gray300};
    text-underline-offset: 4px;
  }
`;
