"use client";

import styled from "styled-components";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
}

export default function Switch({
  checked,
  onChange,
  label = "스위치",
  className,
}: SwitchProps) {
  return (
    <StSwitchButton
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      $checked={checked}
      className={className}
    >
      <StSwitchKnob $checked={checked} />
    </StSwitchButton>
  );
}


const StSwitchButton = styled.button<{ $checked: boolean }>`
  position: relative;
  display: inline-flex;
  align-items: center;
  height: 1.5rem; /* h-6 (24px) */
  width: 2.75rem; /* w-11 (44px) */
  border-radius: 9999px;
  transition: background-color 0.15s ease;
  outline: none;
  cursor: pointer;
  border: none;

  background-color: ${({ theme, $checked }) =>
    $checked ? theme.semantic.primary : theme.colors.gray300};

  &:focus-visible {
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.blue100};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StSwitchKnob = styled.span<{ $checked: boolean }>`
  display: inline-block;
  height: 1rem; /* h-4 (16px) */
  width: 1rem; /* w-4 (16px) */
  border-radius: 9999px;
  background-color: #ffffff;
  transition: transform 0.15s ease-in-out;

  transform: ${({ $checked }) =>
    $checked ? "translateX(1.5rem)" : "translateX(0.25rem)"};

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
