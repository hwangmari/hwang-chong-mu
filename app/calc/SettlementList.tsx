"use client";

import styled, { css } from "styled-components";

// 데이터 타입 정의 (필요시 types.ts로 이동 가능)
export interface SettlementItem {
  from: string;
  to: string;
  amount: number;
}

interface SettlementListProps {
  settlements: SettlementItem[];
}

export default function SettlementList({ settlements }: SettlementListProps) {
  // 1. 정산 내역이 없을 때 (Empty State)
  if (settlements.length === 0) {
    return (
      <StEmptyState>
        정산할 내역이 없습니다.
        <br />
        모두 똑같이 냈거나 지출이 없네요! 🎉
      </StEmptyState>
    );
  }

  // 2. 정산 내역 리스트 렌더링
  return (
    <StListContainer>
      {settlements.map((s, idx) => (
        <StTransferCard key={idx}>
          {/* 보낸 사람 (Sender) */}
          <div className="user-column">
            <StAvatar $type="SENDER">{s.from.slice(0, 1)}</StAvatar>
            <span className="name sender">{s.from}</span>
          </div>

          {/* 금액 및 화살표 흐름 */}
          <div className="flow-column">
            <span className="amount">{s.amount.toLocaleString()}원</span>
            <div className="arrow-wrapper">
              <div className="line"></div>
              <span className="arrow-head">▶</span>
            </div>
            <span className="action-text">보내주세요</span>
          </div>

          {/* 받는 사람 (Receiver) */}
          <div className="user-column">
            <StAvatar $type="RECEIVER">{s.to.slice(0, 1)}</StAvatar>
            <span className="name receiver">{s.to}</span>
          </div>
        </StTransferCard>
      ))}
    </StListContainer>
  );
}

// ✨ 스타일 정의

const StListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem; /* 카드 간 간격 */
`;

const StTransferCard = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200}; /* 라인 스타일 */
  border-radius: 1rem;
  padding: 1.25rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);

  /* 유저 컬럼 (좌/우) */
  .user-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 3.5rem; /* 고정 너비로 정렬 유지 */
    flex-shrink: 0;
  }

  .name {
    font-size: 0.875rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.gray700};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  /* 중앙 흐름 컬럼 */
  .flow-column {
    flex: 1; /* 남은 공간 차지 */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 0.5rem;
  }

  .amount {
    font-size: 1.125rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray900};
    margin-bottom: 0.25rem;
  }

  .arrow-wrapper {
    display: flex;
    align-items: center;
    width: 100%;
    color: ${({ theme }) => theme.colors.gray300};
    margin-bottom: 0.25rem;
  }

  .line {
    flex: 1;
    height: 1px;
    background-color: currentColor;
  }

  .arrow-head {
    font-size: 0.75rem;
    margin-left: -4px; /* 선과 자연스럽게 연결 */
  }

  .action-text {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray400};
  }
`;

const StAvatar = styled.div<{ $type: "SENDER" | "RECEIVER" }>`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;

  /* 타입에 따른 색상 분기 */
  ${({ $type, theme }) =>
    $type === "SENDER"
      ? css`
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray500};
        `
      : css`
          background-color: #dbeafe; /* blue-100 느낌 */
          color: #2563eb; /* blue-600 느낌 */
        `}
`;

const StEmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 1rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.95rem;
  line-height: 1.6;
`;