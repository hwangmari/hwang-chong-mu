"use client";

import styled from "styled-components";
import { useThemeMode } from "@/lib/themeMode";

export default function ThemeToggleButton() {
  const { mode, toggleMode } = useThemeMode();
  const isDark = mode === "dark";

  return (
    <StButton
      type="button"
      onClick={toggleMode}
      aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      title={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
    >
      <span aria-hidden>{isDark ? "🌙" : "☀️"}</span>
    </StButton>
  );
}

const StButton = styled.button`
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 9999px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 10px -2px rgba(0, 0, 0, 0.12);
  }
  &:active {
    transform: scale(0.95);
  }
`;
