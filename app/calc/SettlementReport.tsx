"use client";
import React from "react";
import styled from "styled-components";

interface Props {
  result: {
    totalCommonSpend: number;
    perPersonShare: number;
    settlements: { from: string; to: string; amount: number }[];
  };
  hasData: boolean;
}

export default function SettlementReport({ result, hasData }: Props) {
  if (!hasData) return null;

  return (
    <StResultContainer>
      <StSectionTitle>📊 정산 리포트</StSectionTitle>

      <StSummaryCard>
        <div className="row">
          <span className="label">총 지출 금액</span>
          <span className="value">
            {result.totalCommonSpend.toLocaleString()}원
          </span>
        </div>
        <div className="divider" />
        <div className="row highlight">
          <span className="label">1인당 부담금</span>
          <span className="value">
            {Math.round(result.perPersonShare).toLocaleString()}원
          </span>
        </div>
      </StSummaryCard>

      <StSettlementList>
        {result.settlements.length > 0 ? (
          result.settlements.map((s, idx) => (
            <StTransferCard key={idx}>
              <div className="user-column">
                <StAvatar $type="SENDER">{s.from.slice(0, 1)}</StAvatar>
                <span className="name sender">{s.from}</span>
              </div>
              <div className="flow-column">
                <span className="amount">{s.amount.toLocaleString()}원</span>
                <div className="arrow-wrapper">
                  <div className="line"></div>
                  <span className="arrow-head">▶</span>
                </div>
                <span className="action-text">보내주세요</span>
              </div>
              <div className="user-column">
                <StAvatar $type="RECEIVER">{s.to.slice(0, 1)}</StAvatar>
                <span className="name receiver">{s.to}</span>
              </div>
            </StTransferCard>
          ))
        ) : (
          <StEmptyState>
            정산할 내역이 없습니다.
            <br />
            모두 똑같이 냈거나 지출이 없네요! 🎉
          </StEmptyState>
        )}
      </StSettlementList>
    </StResultContainer>
  );
}

const StSectionTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  margin-bottom: 1.25rem;
`;
const StResultContainer = styled.section`
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px dashed ${({ theme }) => theme.colors.gray200};
`;

const StSummaryCard = styled.div`
  /* ✅ [변경] 쨍한 파란색 대신 -> 차분하고 고급스러운 다크 그레이 */
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.gray800},
    ${({ theme }) => theme.colors.gray900}
  );
  color: white;
  padding: 1.5rem;
  border-radius: 1.25rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.5rem;
  position: relative;
  overflow: hidden;

  /* 배경 데코레이션 (은은하게) */
  &::after {
    content: "";
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200px;
    height: 200px;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.08) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    border-radius: 50%;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .label {
    font-size: 0.95rem;
    opacity: 0.7;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray200}; /* 연한 회색 */
  }

  .value {
    font-size: 1.25rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .divider {
    height: 1px;
    background-color: rgba(255, 255, 255, 0.1);
    margin: 1rem 0;
  }

  /* ✅ [변경] 강조 텍스트: 파란색 대신 따뜻한 웜톤/골드 포인트 */
  .row.highlight {
    margin-bottom: 0;

    .label {
      color: ${({ theme }) => theme.colors.orange200}; /* 살구색/골드 느낌 */
      font-weight: 600;
    }

    .value {
      font-size: 1.5rem;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      font-weight: 800;
    }
  }
`;
const StSettlementList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;
const StTransferCard = styled.div`
  background-color: white;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 1rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  .user-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 60px;
    flex-shrink: 0;
    .name {
      font-size: 0.85rem;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
    }
    .sender {
      color: ${({ theme }) => theme.colors.orange600};
    }
    .receiver {
      color: ${({ theme }) => theme.semantic.success};
    }
  }
  .flow-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1rem;
    .amount {
      font-size: 1.1rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.gray900};
      margin-bottom: 0.25rem;
    }
    .arrow-wrapper {
      width: 100%;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      .line {
        width: 100%;
        height: 2px;
        background-color: ${({ theme }) => theme.colors.gray300};
        border-radius: 2px;
      }
      .arrow-head {
        position: absolute;
        right: -2px;
        color: ${({ theme }) => theme.colors.gray300};
        font-size: 0.8rem;
        top: 50%;
        transform: translateY(-50%);
      }
    }
    .action-text {
      font-size: 0.75rem;
      color: ${({ theme }) => theme.colors.gray400};
      margin-top: 0.25rem;
    }
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
  margin-bottom: 0.5rem;
  background-color: ${({ theme, $type }) =>
    $type === "SENDER" ? theme.colors.orange50 : theme.semantic.successBg};

  color: ${({ theme, $type }) =>
    $type === "SENDER" ? theme.colors.orange500 : theme.semantic.success};

  border: 1px solid
    ${({ theme, $type }) =>
      $type === "SENDER" ? theme.colors.orange200 : theme.colors.teal200};
`;
const StEmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  background-color: white;
  border-radius: 1rem;
  border: 1px dashed ${({ theme }) => theme.colors.gray300};
  color: ${({ theme }) => theme.colors.gray500};
  white-space: pre-wrap;
  line-height: 1.6;
`;
