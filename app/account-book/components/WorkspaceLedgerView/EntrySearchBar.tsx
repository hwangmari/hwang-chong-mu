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

/** 전체 기간에서 찾은 내역 한 줄 */
export type EntrySearchResult = {
  id: string;
  date: string; // yyyy-MM-dd
  title: string;
  detail: string;
  amount: number;
  isIncome: boolean;
};

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
  /** 검색어가 있을 때 전체 기간에서 찾은 내역. 누르면 그 날짜로 이동 */
  results: EntrySearchResult[];
  activeDate: string;
  onPickResult: (date: string) => void;
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
  results,
  activeDate,
  onPickResult,
}: Props) {
  const hasQuery = query.trim().length > 0;
  return (
    <StOuter>
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
            이번 달 <strong>{matchCount}</strong>건 ·{" "}
            {formatAmount(totalAmount)}원
            <StClearAllBtn type="button" onClick={onClear}>
              필터 초기화
            </StClearAllBtn>
          </StResult>
        ) : null}
      </StWrap>
      {hasQuery ? (
        <StResultPanel aria-label="전체 기간 검색 결과">
          <StResultHead>
            전체 기간 <strong>{results.length}</strong>건 · 누르면 그 날짜로
            이동해요
          </StResultHead>
          {results.length === 0 ? (
            <StEmpty>찾는 내역이 없어요.</StEmpty>
          ) : (
            <StResultList>
              {results.map((result) => (
                <li key={result.id}>
                  <StResultRow
                    type="button"
                    $active={result.date === activeDate}
                    onClick={() => onPickResult(result.date)}
                  >
                    <StResultDate>
                      {result.date.replace(/-/g, ".")}
                    </StResultDate>
                    <StResultText>
                      <b>{result.title}</b>
                      {result.detail ? <span>{result.detail}</span> : null}
                    </StResultText>
                    <StResultAmount $income={result.isIncome}>
                      {result.isIncome ? "+" : ""}
                      {formatAmount(result.amount)}원
                    </StResultAmount>
                  </StResultRow>
                </li>
              ))}
            </StResultList>
          )}
        </StResultPanel>
      ) : null}
    </StOuter>
  );
}

const StOuter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const StResultPanel = styled.section`
  border: 1px solid #e2e3e4;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.white};
  overflow: hidden;
`;

const StResultHead = styled.p`
  padding: 0.55rem 0.9rem;
  background: ${({ theme }) => theme.semantic.bg};
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};

  strong {
    font-weight: 900;
    color: #2f5695;
  }
`;

const StEmpty = styled.p`
  padding: 0.9rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StResultList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
  max-height: 16rem;
  overflow-y: auto;
`;

const StResultRow = styled.button<{ $active: boolean }>`
  width: 100%;
  display: grid;
  grid-template-columns: 5.6rem minmax(0, 1fr) 7.5rem;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0.9rem;
  border: none;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.blue50 : "transparent"};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }

  @media (max-width: 767px) {
    grid-template-columns: 4.9rem minmax(0, 1fr) 6.2rem;
    gap: 0.45rem;
    padding: 0.5rem 0.7rem;
  }
`;

const StResultDate = styled.span`
  font-size: 0.8rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StResultText = styled.span`
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: ${({ theme }) => theme.semantic.text};

  b,
  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  b {
    font-weight: 800;
    flex-shrink: 0;
    max-width: 60%;
  }

  span {
    font-size: 0.78rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;

const StResultAmount = styled.span<{ $income: boolean }>`
  text-align: right;
  font-size: 0.85rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: ${({ $income, theme }) =>
    $income ? theme.colors.blue600 : theme.semantic.text};
`;

const StWrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;

  @media (max-width: 767px) {
    flex-wrap: wrap;
    gap: 0.45rem;
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
