"use client";

import styled, { keyframes } from "styled-components";

interface AnalysisCardProps {
  overnightDiff: number | null;
  daytimeDiff: number | null;
  totalDiff: number | null;
}

export default function AnalysisCard({
  overnightDiff,
  daytimeDiff,
  totalDiff,
}: AnalysisCardProps) {
  if (overnightDiff === null) return null;

  const toGram = (kg: number) => {
    const grams = Math.round(kg * 1000);
    return grams.toLocaleString(); // 예: 1200
  };

  return (
    <CardContainer>
      <div className="content">
        <div className="title">
          <span className="icon">📊</span> 오늘의 체중 변화
        </div>

        <div className="calc-container">
          {/* 1. 밤사이 변화 */}
          <div className="calc-row">
            <span className="label">밤사이 (어제 대비)</span>
            <span className="value">
              {overnightDiff > 0 ? "+" : ""}
              {toGram(overnightDiff)}g
            </span>
          </div>

          {/* 2. 낮동안 변화 */}
          {daytimeDiff !== null && (
            <div className="calc-row">
              <span className="label">낮동안 (아침 대비)</span>
              <span className="value">
                {daytimeDiff > 0 ? "+" : ""}
                {toGram(daytimeDiff)}g
              </span>
            </div>
          )}

          {/* 3. 최종 결과 */}
          {totalDiff !== null && (
            <>
              <div className="divider" />
              <div className="calc-row total">
                <span className="label">최종 (어제 대비)</span>
                <span className={`value ${totalDiff < 0 ? "loss" : "gain"}`}>
                  {totalDiff > 0 ? "+" : ""}
                  {toGram(totalDiff)}g
                </span>
              </div>

              {/* 상황별 가이드 메시지 박스 */}
              <MessageBox $isLoss={totalDiff < 0}>
                {totalDiff < 0 ? (
                  <>
                    <div className="msg-title">잘하고 있어요! 🎉</div>
                    <div className="msg-desc">
                      살이 빠지고 있어요. 이대로 꾸준히 유지해봐요!
                    </div>
                  </>
                ) : (
                  <>
                    <div className="msg-title">잠깐! 방심은 금물 🥲</div>
                    <div className="msg-desc">
                      저녁을 든든히 먹었거나 활동량이 부족했나 봐요.
                      <br />
                      내일은 좀 더 <b>클린하게</b> 먹어볼까요?
                    </div>
                  </>
                )}
              </MessageBox>
            </>
          )}
        </div>
      </div>
    </CardContainer>
  );
}

const popIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const CardContainer = styled.div`
  margin-top: 1.5rem;
  padding: 1.5rem;
  border-radius: 16px;
  background-color: #fff;
  border: 1px solid #e5e7eb;
  color: #374151;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  animation: ${popIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  .content {
    width: 100%;
  }

  .title {
    font-weight: 700;
    font-size: 1rem;
    color: #111827;
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .icon {
    font-size: 1.1rem;
    opacity: 0.8;
  }

  .calc-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .calc-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.95rem;
  }

  .label {
    color: #6b7280;
  }

  .value {
    color: #1f2937;
    font-family: "Roboto Mono", monospace, sans-serif;
  }

  .divider {
    height: 1px;
    background-color: #e5e7eb;
    margin: 0.25rem 0;
    width: 100%;
  }

  .calc-row.total .label {
    color: #111827;
    font-weight: 700;
  }

  .calc-row.total .value {
    font-weight: 800;
    font-size: 1.2rem;
  }

  .calc-row.total .value.loss {
    color: #10b981; /* 감량 시 초록색 (Green-500) */
  }

  .calc-row.total .value.gain {
    color: #dc2626; /* 증량 시 빨간색 (Red-600) */
  }
`;

const MessageBox = styled.div<{ $isLoss: boolean }>`
  margin-top: 0.25rem;
  text-align: left;
  border: 1px dashed #ddd;
  background: #fcfcfc;
  padding: 1rem;
  border-radius: 12px;

  .msg-title {
    font-weight: 700;
    font-size: 0.95rem;
    color: #111827;
    margin-bottom: 0.25rem;
  }

  .msg-desc {
    font-size: 0.85rem;
    color: #4b5563;
    line-height: 1.4;
  }

  b {
    font-weight: 600;
    color: #111827;
  }
`;
