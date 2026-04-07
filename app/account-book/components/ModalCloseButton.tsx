"use client";

import styled from "styled-components";

type Props = {
  onClick: () => void;
  ariaLabel?: string;
  size?: string;
  iconSize?: string;
  mobileSize?: string;
  mobileIconSize?: string;
  className?: string;
};

export default function ModalCloseButton({
  onClick,
  ariaLabel = "닫기",
  size = "2.5rem",
  iconSize = "1.5rem",
  mobileSize,
  mobileIconSize,
  className,
}: Props) {
  return (
    <StButton
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={className}
      $size={size}
      $iconSize={iconSize}
      $mobileSize={mobileSize ?? size}
      $mobileIconSize={mobileIconSize ?? iconSize}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18.3 5.71 12 12.01l-6.3-6.3-1.41 1.41 6.3 6.3-6.3 6.3 1.41 1.41 6.3-6.3 6.3 6.3 1.41-1.41-6.3-6.3 6.3-6.3z" />
      </svg>
    </StButton>
  );
}

const StButton = styled.button<{
  $size: string;
  $iconSize: string;
  $mobileSize: string;
  $mobileIconSize: string;
}>`
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #53657f;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;

  &:hover {
    background: #eef2f7;
    color: #344257;
  }

  &:focus-visible {
    outline: none;
    background: #eef2f7;
    box-shadow: 0 0 0 0.1875rem rgba(124, 156, 243, 0.2);
  }

  svg {
    width: ${({ $iconSize }) => $iconSize};
    height: ${({ $iconSize }) => $iconSize};
    fill: currentColor;
  }

  @media (max-width: 720px) {
    width: ${({ $mobileSize }) => $mobileSize};
    height: ${({ $mobileSize }) => $mobileSize};

    svg {
      width: ${({ $mobileIconSize }) => $mobileIconSize};
      height: ${({ $mobileIconSize }) => $mobileIconSize};
    }
  }
`;
