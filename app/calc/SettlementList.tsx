"use client";

import styled from "styled-components";
import Card from "./components/ui/Card";
import SectionTitle from "./components/ui/SectionTitle";

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

interface SettlementListProps {
  settlements: Settlement[];
}

export default function SettlementList({ settlements }: SettlementListProps) {
  if (settlements.length === 0) return null;

  return (
    <StContainer>
      <StTitle>
        <SectionTitle as="h3" size="1.1rem">
          💸 송금해 주세요
        </SectionTitle>
      </StTitle>
      <StList>
        {settlements.map((s, idx) => (
          <Card
            key={`${s.from}-${s.to}-${idx}`}
            padding="1.25rem"
            radius="1rem"
            shadow="0 2px 4px rgba(0, 0, 0, 0.02)"
          >
            <StSettlementCardContent>
              <div className="transfer-info">
                <span className="from">{s.from}</span>
                <span className="arrow">➔</span>
                <span className="to">{s.to}</span>
              </div>
              <div className="amount-info">
                <span className="amount">{s.amount.toLocaleString()}원</span>
              </div>
            </StSettlementCardContent>
          </Card>
        ))}
      </StList>
    </StContainer>
  );
}

const StContainer = styled.div`
  margin-bottom: 1.5rem;
`;

const StTitle = styled.div`
  margin-bottom: 0.75rem;
`;

const StList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StSettlementCardContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  .transfer-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;

    .from {
      color: ${({ theme }) => theme.colors.gray700};
    }
    .arrow {
      color: ${({ theme }) => theme.colors.gray400};
      font-size: 0.9rem;
    }
    .to {
      color: #3b82f6; // 받는 사람은 강조!
    }
  }

  .amount-info {
    .amount {
      font-size: 1.2rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.gray900};
    }
  }
`;
