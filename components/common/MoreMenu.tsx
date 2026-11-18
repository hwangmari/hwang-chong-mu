"use client";

import { useState } from "react";
import styled from "styled-components";

/**
 * 줄 끝의 "⋯" 더보기 버튼 + 펼침 메뉴.
 * 가계부 상세 내역(DetailEntriesPanel)에 있던 것을 여행 경비 계산기와 함께 쓰려고 옮겼다.
 * 바깥(투명 배경)을 누르면 닫히고, 항목을 누르면 실행 후 닫힌다.
 */
export interface MoreMenuItem {
  key: string;
  label: string;
  onClick: () => void;
  /** 삭제처럼 되돌리기 어려운 동작 — 빨간 글씨 */
  danger?: boolean;
  /** 지금 선택된 상태 — 체크 표시 */
  active?: boolean;
}

interface MoreMenuProps {
  items: MoreMenuItem[];
  /** 스크린리더용 이름. 기본 "더보기" */
  label?: string;
}

export default function MoreMenu({ items, label = "더보기" }: MoreMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <StMenuAnchor>
      <StKebabButton
        type="button"
        aria-label={label}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        ⋯
      </StKebabButton>
      {isOpen ? (
        <>
          <StMenuBackdrop
            type="button"
            aria-label="메뉴 닫기"
            onClick={() => setIsOpen(false)}
          />
          <StMenuPopover role="menu">
            {items.map((item) => (
              <StMenuItem
                key={item.key}
                type="button"
                role="menuitem"
                $danger={item.danger}
                $active={item.active}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
              >
                <span>{item.label}</span>
                {item.active ? <StMenuCheck aria-hidden>✓</StMenuCheck> : null}
              </StMenuItem>
            ))}
          </StMenuPopover>
        </>
      ) : null}
    </StMenuAnchor>
  );
}

// 다크 모드에선 gray100 이 카드 표면과 같은 색이라 한 단계 밝은 gray200 으로 눌림 표시
const hoverBg = (mode: string) =>
  mode === "dark" ? "oklch(0.34 0 0)" : "#f4f5f7";

const StMenuAnchor = styled.div`
  position: relative;
  display: flex;
  justify-content: flex-end;
`;

const StKebabButton = styled.button`
  width: 1.65rem;
  height: 1.65rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  border-radius: 999px;
  font-size: 0.95rem;
  line-height: 1;
  font-weight: 900;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;

  &:hover {
    background: ${({ theme }) => hoverBg(theme.mode)};
  }
`;

const StMenuBackdrop = styled.button`
  position: fixed;
  inset: 0;
  z-index: 40;
  border: none;
  background: transparent;
  cursor: default;
`;

const StMenuPopover = styled.div`
  position: absolute;
  top: calc(100% + 0.35rem);
  right: 0;
  z-index: 41;
  min-width: 9.5rem;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 12px 28px rgba(26, 34, 49, 0.14);
`;

const StMenuItem = styled.button<{ $danger?: boolean; $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  border: none;
  background: ${({ $active, theme }) =>
    $active ? hoverBg(theme.mode) : "transparent"};
  color: ${({ $danger, theme }) =>
    $danger ? theme.semantic.danger : theme.colors.gray800};
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: left;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${({ theme }) => hoverBg(theme.mode)};
  }
`;

const StMenuCheck = styled.span`
  color: ${({ theme }) => theme.semantic.primary};
  font-size: 0.78rem;
  font-weight: 900;
`;
