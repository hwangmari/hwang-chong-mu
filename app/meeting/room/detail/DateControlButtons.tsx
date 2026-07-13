"use client";

import styled, { css, keyframes } from "styled-components";

interface Props {
  onReset: () => void;
  onSelectAll: () => void;
}

export default function DateControlButtons({ onReset, onSelectAll }: Props) {
  return (
    <StActionButtonsWrapper>
      <StActionButton $variant="blue" onClick={onReset}>
        <span className="emoji">🙆‍♂️</span> 다 돼요
      </StActionButton>
      <StActionButton $variant="red" onClick={onSelectAll}>
        <span className="emoji">🙅‍♂️</span> 다 안돼요
      </StActionButton>
    </StActionButtonsWrapper>
  );
}

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const StActionButtonsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0;
  animation: ${fadeIn} 0.3s ease-out;
  flex-wrap: nowrap;
  white-space: nowrap;
`;

const StActionButton = styled.button<{ $variant: "blue" | "red" }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 44px;
  padding: 0 0.9rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 800;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.2s;

  &:active {
    transform: scale(0.95);
  }

  .emoji {
    font-size: 1rem;
  }

  ${({ $variant, theme }) =>
    $variant === "blue"
      ? css`
          border-color: ${theme.colors.blue100};
          color: ${theme.colors.blue600};
          &:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            background-color: ${theme.colors.blue50};
          }
        `
      : css`
          border-color: ${({ theme }) => theme.colors.rose100};
          color: ${({ theme }) => theme.colors.rose500};
          &:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            background-color: ${({ theme }) => theme.colors.rose50};
          }
        `}
`;
