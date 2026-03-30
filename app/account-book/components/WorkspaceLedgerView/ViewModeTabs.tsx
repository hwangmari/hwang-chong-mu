"use client";

import styled from "styled-components";
import type { ViewMode } from "../../types";

type Props = {
  viewMode: ViewMode;
  onChangeViewMode: (viewMode: ViewMode) => void;
};

const VIEW_MODES: Array<{ id: ViewMode; label: string }> = [
  { id: "ledger", label: "리스트" },
  { id: "calendar", label: "캘린더" },
  { id: "board", label: "보드" },
];

export default function ViewModeTabs({ viewMode, onChangeViewMode }: Props) {
  return (
    <StViewModeSwitch aria-label="가계부 화면 전환">
      {VIEW_MODES.map((item) => (
        <StViewModeButton
          key={item.id}
          type="button"
          $active={viewMode === item.id}
          onClick={() => onChangeViewMode(item.id)}
        >
          {item.label}
        </StViewModeButton>
      ))}
    </StViewModeSwitch>
  );
}

const StViewModeSwitch = styled.div`
  display: inline-flex;
  gap: 0.45rem;
`;

const StViewModeButton = styled.button<{ $active: boolean }>`
  min-width: 5rem;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? "#90abf6" : "#d8e2ee")};
  background: ${({ $active }) => ($active ? "#eaf1ff" : "#fff")};
  color: ${({ $active }) => ($active ? "#3d5fbf" : "#6d7b8d")};
  padding: 0.45rem 0.95rem;
  font-size: 0.84rem;
  font-weight: 800;
`;
