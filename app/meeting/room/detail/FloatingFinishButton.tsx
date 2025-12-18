"use client";

import styled from "styled-components";

interface Props {
  onFinish: () => void;
}

export default function FloatingFinishButton({ onFinish }: Props) {
  return (
    <StFloatingContainer>
      <StFloatingGradient />
      <StFinishButton onClick={onFinish} className="group">
        <span>투표 마감하기</span>
        <span className="icon">🐰</span>
      </StFinishButton>
    </StFloatingContainer>
  );
}

const StFloatingContainer = styled.div`
  position: fixed;
  bottom: 1.25rem;
  padding: 0 1.5rem;
  display: flex;
  justify-content: center;
  pointer-events: none;
  width: 100%;
  max-width: 540px;
`;

const StFloatingGradient = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 5rem;
  background: linear-gradient(to top, #f3f4f6, #f3f4f6, transparent);
  z-index: -1;
`;

const StFinishButton = styled.button`
  pointer-events: auto;
  width: 100%;
  max-width: 500px;
  padding: 1rem 1.5rem;
  background-color: #454545;
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  font-size: 1.125rem;
  border-radius: 9999px;
  box-shadow: 0 20px 25px -5px rgba(209, 213, 219, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.black};
    transform: scale(1.02);
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  }
  &:active {
    transform: scale(0.95);
  }
  .icon {
    transition: transform 0.2s;
  }
  &:hover .icon {
    transform: translateY(-4px);
  }
`;
