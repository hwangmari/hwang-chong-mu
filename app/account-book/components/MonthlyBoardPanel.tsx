"use client";

import styled from "styled-components";

type BoardCard = {
  amount: number;
};

type BoardColumn = {
  id: string;
  title: string;
  description: string;
  totalAmount: number;
  cards: BoardCard[];
};

type Props = {
  monthLabel: string;
  columns: BoardColumn[];
  selectedColumnId: string;
  formatAmount: (value: number) => string;
  onSelectColumn: (columnId: string) => void;
};

export default function MonthlyBoardPanel({
  monthLabel,
  columns,
  selectedColumnId,
  formatAmount,
  onSelectColumn,
}: Props) {
  return (
    <StBoardWrap>
      <StBoardIntro>
        <div>
          <StEyebrow>Monthly Board</StEyebrow>
          <StTitle>{monthLabel} 보드</StTitle>
        </div>
        <StDescription>
          생활비와 사용내역 성격별로 묶어서 보고, 카드를 누르면 해당 날짜 상세를
          오른쪽 패널에서 바로 이어서 확인합니다.
        </StDescription>
      </StBoardIntro>

      <StColumns>
        {columns.map((column) => (
          <StColumn
            key={column.id}
            type="button"
            $active={selectedColumnId === column.id}
            onClick={() => onSelectColumn(column.id)}
          >
            <StColumnHeader>
              <div>
                <strong>{column.title}</strong>
                <span>{column.description}</span>
              </div>
              <em>{formatAmount(column.totalAmount)}</em>
            </StColumnHeader>

            <StColumnBody>
              {column.cards.length === 0 ? (
                <StColumnEmpty>이번 달 내역이 없습니다.</StColumnEmpty>
              ) : (
                <>
                  <StTotalValue>{formatAmount(column.totalAmount)}</StTotalValue>
                  <StColumnMeta>
                    총 {column.cards.length}건의 내역이 이 항목에 포함됩니다.
                  </StColumnMeta>
                  <StColumnHint>
                    날짜를 선택하면 오른쪽에서 상세 내역을 확인할 수 있습니다.
                  </StColumnHint>
                </>
              )}
            </StColumnBody>
          </StColumn>
        ))}
      </StColumns>
    </StBoardWrap>
  );
}

const StBoardWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const StBoardIntro = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: flex-end;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StEyebrow = styled.p`
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7083a1;
`;

const StTitle = styled.h3`
  margin-top: 0.2rem;
  font-size: 1.15rem;
  font-weight: 900;
  color: #1f2937;
`;

const StDescription = styled.p`
  max-width: 30rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #728095;
`;

const StColumns = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
  align-items: start;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  @media (max-width: 1000px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const StColumn = styled.button<{ $active: boolean }>`
  text-align: left;
  border: 1px solid #dce4ef;
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(242, 247, 253, 0.98));
  min-height: 100%;
  box-shadow: ${({ $active }) =>
    $active ? "0 14px 28px rgba(84, 111, 194, 0.16)" : "none"};
  border-color: ${({ $active }) => ($active ? "#9cb5f6" : "#dce4ef")};
`;

const StColumnHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  align-items: flex-start;
  padding: 0.9rem 0.95rem 0.75rem;
  border-bottom: 1px solid #e5ebf3;

  strong {
    display: block;
    font-size: 0.98rem;
    color: #1f2937;
  }

  span {
    display: block;
    margin-top: 0.18rem;
    font-size: 0.75rem;
    color: #8190a5;
  }

  em {
    font-style: normal;
    font-size: 0.75rem;
    font-weight: 800;
    color: #5172bf;
    white-space: nowrap;
  }
`;

const StColumnBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.8rem;
`;

const StColumnEmpty = styled.p`
  padding: 0.2rem 0.1rem;
  font-size: 0.78rem;
  color: #8d99ab;
`;

const StTotalValue = styled.strong`
  font-size: 1.8rem;
  font-weight: 900;
  color: #2b4d96;
  line-height: 1.1;
`;

const StColumnMeta = styled.p`
  font-size: 0.78rem;
  color: #6f7f96;
`;

const StColumnHint = styled.p`
  font-size: 0.72rem;
  color: #9aa6b7;
`;
