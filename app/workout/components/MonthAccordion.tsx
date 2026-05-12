"use client";

import { type ReactNode, useCallback, useState } from "react";
import styled from "styled-components";
import { currentMonthKey, type MonthGroup } from "../helpers";

export function useExpandedMonths(initialKeys?: string[]) {
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(
    () => new Set(initialKeys ?? [currentMonthKey()]),
  );

  const toggleMonth = useCallback((key: string) => {
    setExpandedMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return { expandedMonths, toggleMonth };
}

type MonthAccordionProps<T> = {
  groups: MonthGroup<T>[];
  expandedMonths: Set<string>;
  onToggle: (key: string) => void;
  renderItems: (items: T[]) => ReactNode;
};

export function MonthAccordion<T>({
  groups,
  expandedMonths,
  onToggle,
  renderItems,
}: MonthAccordionProps<T>) {
  return (
    <StMonthList>
      {groups.map((group) => {
        const isOpen = expandedMonths.has(group.key);
        return (
          <StMonthGroup key={group.key}>
            <StMonthHeader
              type="button"
              onClick={() => onToggle(group.key)}
              aria-expanded={isOpen}
            >
              <StMonthLabel>{group.label}</StMonthLabel>
              <StMonthCount>{group.items.length}회</StMonthCount>
              <StMonthCaret $open={isOpen} aria-hidden>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="9 6 15 12 9 18" />
                </svg>
              </StMonthCaret>
            </StMonthHeader>
            {isOpen ? renderItems(group.items) : null}
          </StMonthGroup>
        );
      })}
    </StMonthList>
  );
}

const StMonthList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const StMonthGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const StMonthHeader = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 0.6rem;
  padding: 0.6rem 0.8rem;
  cursor: pointer;
  text-align: left;
  transition: background 0.12s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
  }
`;

const StMonthLabel = styled.span`
  font-size: 0.88rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StMonthCount = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  background: ${({ theme }) => theme.colors.white};
  padding: 0.15rem 0.45rem;
  border-radius: 0.35rem;
`;

const StMonthCaret = styled.span<{ $open: boolean }>`
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.gray500};
  transition: transform 0.15s;
  transform: rotate(${({ $open }) => ($open ? "90deg" : "0deg")});
`;
