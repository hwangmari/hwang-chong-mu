"use client";

import styled from "styled-components";

export type EntryCategoryFilter =
  | "all"
  | "income"
  | "living"
  | "gathering"
  | "fixed"
  | "move"
  | "exercise"
  | "shopping"
  | "special"
  | "asset";

export const ENTRY_CATEGORY_FILTERS: Array<{
  id: EntryCategoryFilter;
  label: string;
}> = [
  { id: "all", label: "전체" },
  { id: "income", label: "수입" },
  { id: "living", label: "생활비" },
  { id: "gathering", label: "모임비" },
  { id: "fixed", label: "고정비" },
  { id: "move", label: "이동/차량" },
  { id: "exercise", label: "운동" },
  { id: "shopping", label: "쇼핑/여가" },
  { id: "special", label: "특별/기타" },
  { id: "asset", label: "자산/저축" },
];

type Props = {
  query: string;
  onChangeQuery: (value: string) => void;
  category: EntryCategoryFilter;
  onChangeCategory: (value: EntryCategoryFilter) => void;
  matchCount: number;
  totalAmount: number;
  isFiltering: boolean;
  onClear: () => void;
  formatAmount: (value: number) => string;
};

export default function EntrySearchBar({
  query,
  onChangeQuery,
  category,
  onChangeCategory,
  matchCount,
  totalAmount,
  isFiltering,
  onClear,
  formatAmount,
}: Props) {
  return (
    <StWrap>
      <StSearchField>
        <StSearchIcon viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="9" cy="9" r="6" />
          <path d="m13.5 13.5 4 4" />
        </StSearchIcon>
        <StInput
          type="search"
          placeholder="가맹점·품목·메모·카드사 검색"
          value={query}
          onChange={(event) => onChangeQuery(event.target.value)}
          aria-label="내역 검색"
        />
        {query ? (
          <StClearInputBtn
            type="button"
            onClick={() => onChangeQuery("")}
            aria-label="검색어 지우기"
          >
            ✕
          </StClearInputBtn>
        ) : null}
      </StSearchField>
      <StChipRow>
        {ENTRY_CATEGORY_FILTERS.map((option) => (
          <StChip
            key={option.id}
            type="button"
            $active={category === option.id}
            onClick={() => onChangeCategory(option.id)}
          >
            {option.label}
          </StChip>
        ))}
      </StChipRow>
      {isFiltering ? (
        <StResult>
          <strong>{matchCount}</strong>건 · {formatAmount(totalAmount)}원
          <StClearAllBtn type="button" onClick={onClear}>
            필터 초기화
          </StClearAllBtn>
        </StResult>
      ) : null}
    </StWrap>
  );
}

const StWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.85rem;

  @media (max-width: 767px) {
    flex-wrap: wrap;
  }
`;

const StSearchField = styled.label`
  flex: 0 1 420px;
  min-width: 0;
  position: relative;
  display: flex;
  align-items: center;
  border: 1px solid #e2e3e4;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.white};
  padding: 0 0.55rem 0 0.85rem;
  height: 2.4rem;

  &:focus-within {
    border-color: #bcbec2;
    box-shadow: 0 0 0 3px rgba(163, 166, 171, 0.1);
  }

  @media (max-width: 767px) {
    flex: 1 1 100%;
  }
`;

const StSearchIcon = styled.svg`
  width: 1.05rem;
  height: 1.05rem;
  fill: none;
  stroke: #84888f;
  stroke-width: 1.8;
  stroke-linecap: round;
  flex-shrink: 0;
`;

const StInput = styled.input`
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 0.55rem;
  font-size: 0.86rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray800};

  &::-webkit-search-cancel-button {
    appearance: none;
  }
`;

const StClearInputBtn = styled.button`
  border: none;
  background: transparent;
  color: #a0a3a9;
  font-size: 0.78rem;
  font-weight: 800;
  width: 1.6rem;
  height: 1.6rem;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.gray700};
    background: ${({ theme }) => theme.colors.gray100};
  }
`;

const StResult = styled.div`
  flex: 0 0 auto;
  font-size: 0.78rem;
  font-weight: 700;
  color: #2e518a;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  white-space: nowrap;

  strong {
    font-weight: 900;
    color: #2f5695;
  }
`;

const StClearAllBtn = styled.button`
  border: 1px solid #dadcde;
  background: ${({ theme }) => theme.colors.white};
  color: #868a92;
  border-radius: 999px;
  padding: 0.28rem 0.65rem;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

const StChipRow = styled.div`
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;

  @media (max-width: 767px) {
    flex: 1 1 100%;
  }
`;

const StChip = styled.button<{ $active: boolean }>`
  flex: 0 0 auto;
  white-space: nowrap;
  border-radius: 999px;
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e6e7e8")};
  background: ${({ $active, theme }) =>
    $active ? "#e8f2fe" : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? "#3182f6" : theme.colors.gray500};
  font-size: 0.76rem;
  font-weight: ${({ $active }) => ($active ? 900 : 700)};
  padding: 0.32rem 0.7rem;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: #bcbec2;
    color: #2f5695;
  }
`;
