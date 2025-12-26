"use client";

import styled from "styled-components";

interface Props {
  onFinish: () => void;
}

export default function FloatingFinishButton({ onFinish }: Props) {
  return (
    <StFloatingContainer>
      <StFinishButton onClick={onFinish} className="group">
        <span>투표 마감하기</span>
        <span className="icon">🐰</span>
      </StFinishButton>
    </StFloatingContainer>
  );
}

const StFloatingContainer = styled.div`
  position: sticky;
  bottom: 0;
  display: flex;
  justify-content: center;
  pointer-events: none;
  width: 100%;
  max-width: ${({ theme }) => theme.layout.narrowWidth};
  z-index: 10;
`;

const StFinishButton = styled.button`
  pointer-events: auto;
  width: 100%;
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
