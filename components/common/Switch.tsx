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
  transition: background-color 0.2s;
  outline: none;
  cursor: pointer;

  /* 색상 로직: indigo-500 대신 테마의 blue600 사용 (일관성 유지) */
  background-color: ${({ theme, $checked }) =>
    $checked ? theme.colors.blue600 : theme.colors.gray300};
`;

const StSwitchKnob = styled.span<{ $checked: boolean }>`
  display: inline-block;
  height: 1rem; /* h-4 (16px) */
  width: 1rem; /* w-4 (16px) */
  border-radius: 9999px;
  background-color: ${({ theme }) => theme.colors.white};
  transition: transform 0.2s ease-in-out;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  /* 위치 이동 로직 */
  transform: ${({ $checked }) =>
    $checked ? "translateX(1.5rem)" : "translateX(0.25rem)"};
`;
