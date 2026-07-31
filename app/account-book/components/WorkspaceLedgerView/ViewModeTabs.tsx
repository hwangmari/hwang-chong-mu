"use client";

import type { ElementType } from "react";
import styled from "styled-components";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import FormatListBulletedRoundedIcon from "@mui/icons-material/FormatListBulletedRounded";
import SpaceDashboardRoundedIcon from "@mui/icons-material/SpaceDashboardRounded";
import type { ViewMode } from "../../types";

type Props = {
  viewMode: ViewMode;
  onChangeViewMode: (viewMode: ViewMode) => void;
};

const VIEW_MODES: Array<{ id: ViewMode; label: string; Icon: ElementType }> = [
  { id: "calendar", label: "캘린더", Icon: CalendarMonthRoundedIcon },
  { id: "ledger", label: "리스트", Icon: FormatListBulletedRoundedIcon },
  { id: "board", label: "보드", Icon: SpaceDashboardRoundedIcon },
];

export default function ViewModeTabs({ viewMode, onChangeViewMode }: Props) {
  return (
    <StViewModeSwitch aria-label="가계부 화면 전환">
      {VIEW_MODES.map(({ id, label, Icon }) => {
        const active = viewMode === id;
        return (
          <StViewModeButton
            key={id}
            type="button"
            $active={active}
            onClick={() => onChangeViewMode(id)}
          >
            <StTabIcon $active={active}>
              <Icon fontSize="inherit" />
            </StTabIcon>
            {label}
          </StViewModeButton>
        );
      })}
    </StViewModeSwitch>
  );
}

const StViewModeSwitch = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 1.1rem;

  @media (max-width: 720px) {
    gap: 0.85rem;
    justify-content: flex-end;
    width: 100%;
  }
`;

// 아이콘 + 컬러로 활성 표시 (테두리·밑줄 없음)
const StViewModeButton = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: none;
  background: transparent;
  padding: 0.3rem 0.1rem;
  font-size: 0.95rem;
  font-weight: ${({ $active }) => ($active ? 800 : 700)};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.gray900 : theme.colors.gray400};
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.16s ease;

  &:hover {
    color: ${({ $active, theme }) =>
      $active ? theme.colors.gray900 : theme.colors.gray600};
  }
`;

const StTabIcon = styled.span<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  font-size: 1.25rem;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray300};
  transition: color 0.16s ease;
`;
