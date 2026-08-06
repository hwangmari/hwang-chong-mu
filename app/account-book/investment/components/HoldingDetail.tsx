"use client";

import { useState } from "react";

import type { Holding } from "../holdings";
import { estimateSellCosts } from "../holdings";
import {
  StCalcBody,
  StCalcHint,
  StCalcInputs,
  StCalcToggle,
  StDetail,
  StDetailDivider,
  StDetailRow,
  StFormField,
  StInput,
} from "../page.styles";
import {
  formatQuantity,
  formatSignedPercent,
  formatSignedWon,
  formatWon,
  toneColor,
} from "../format";

// ── 보유 종목 토스식 상세(수수료·세금 예상) ──────────────────────────────────
export function HoldingDetail({
  holding,
  valuation,
  pnl,
  pnlRate,
  currentPrice,
  hidden,
}: {
  holding: Holding;
  valuation: number | null;
  pnl: number | null;
  pnlRate: number | null;
  currentPrice: number | null;
  hidden: boolean;
}) {
  const costs = valuation === null ? null : estimateSellCosts(valuation);
  const netReceive =
    valuation === null || costs === null
      ? null
      : valuation - costs.fee - costs.tax;
  const won = (value: number) => (hidden ? "•••••" : formatWon(value));

  // 물타기 계산기 — 저장 없는 시뮬레이션. 단가 기본값은 현재가.
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [addQty, setAddQty] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const openCalc = () => {
    setIsCalcOpen((prev) => {
      if (!prev && !addPrice && currentPrice) {
        setAddPrice(currentPrice.toLocaleString("ko-KR"));
      }
      return !prev;
    });
  };
  const addQtyNum = Number(addQty.replace(/[^\d]/g, ""));
  const addPriceNum = Number(addPrice.replace(/[^\d]/g, ""));
  const calcValid =
    Number.isFinite(addQtyNum) &&
    addQtyNum > 0 &&
    Number.isFinite(addPriceNum) &&
    addPriceNum > 0;
  const newQty = calcValid ? holding.quantity + addQtyNum : 0;
  const newAvg = calcValid
    ? (holding.quantity * holding.avgPrice + addQtyNum * addPriceNum) / newQty
    : 0;
  const newRate =
    calcValid && currentPrice !== null && newAvg > 0
      ? ((currentPrice - newAvg) / newAvg) * 100
      : null;
  return (
    <StDetail>
      <StDetailRow>
        <span>1주 평균</span>
        <strong>{won(holding.avgPrice)}</strong>
      </StDetailRow>
      <StDetailRow>
        <span>보유 수량</span>
        <strong>{formatQuantity(holding.quantity)}주</strong>
      </StDetailRow>
      <StDetailRow>
        <span>총 금액</span>
        <strong>{valuation === null ? "—" : won(valuation)}</strong>
      </StDetailRow>
      <StDetailRow>
        <span>평가손익</span>
        <strong style={{ color: toneColor(pnl ?? 0) }}>
          {pnl === null
            ? "—"
            : `${hidden ? "•••••" : formatSignedWon(pnl)}${
                pnlRate !== null ? ` (${formatSignedPercent(pnlRate)})` : ""
              }`}
        </strong>
      </StDetailRow>
      <StDetailDivider />
      <StDetailRow>
        <span>거래 수수료 예상</span>
        <strong>{costs === null ? "—" : won(costs.fee)}</strong>
      </StDetailRow>
      <StDetailRow>
        <span>팔 때 낼 세금 예상</span>
        <strong>{costs === null ? "—" : won(costs.tax)}</strong>
      </StDetailRow>
      <StDetailRow $emphasis>
        <span>실수령 예상</span>
        <strong>{netReceive === null ? "—" : won(netReceive)}</strong>
      </StDetailRow>

      <StDetailDivider />
      <StCalcToggle
        type="button"
        onClick={openCalc}
        aria-expanded={isCalcOpen}
      >
        <span>🧮 물타기 계산기</span>
        <em>{isCalcOpen ? "접기" : "열기"}</em>
      </StCalcToggle>
      {isCalcOpen ? (
        <StCalcBody>
          <StCalcInputs>
            <StFormField>
              <label>추가 수량</label>
              <StInput
                inputMode="numeric"
                value={addQty}
                placeholder="예: 10"
                onChange={(event) =>
                  setAddQty(event.target.value.replace(/[^\d]/g, ""))
                }
              />
            </StFormField>
            <StFormField>
              <label>매수 단가</label>
              <StInput
                inputMode="numeric"
                value={addPrice}
                placeholder="현재가"
                onChange={(event) => {
                  const digits = event.target.value.replace(/[^\d]/g, "");
                  setAddPrice(
                    digits ? Number(digits).toLocaleString("ko-KR") : "",
                  );
                }}
              />
            </StFormField>
          </StCalcInputs>
          {calcValid ? (
            <>
              <StDetailRow>
                <span>필요 금액</span>
                <strong>{won(addQtyNum * addPriceNum)}</strong>
              </StDetailRow>
              <StDetailRow>
                <span>새 평단 ({formatQuantity(newQty)}주)</span>
                <strong>{won(Math.round(newAvg))}</strong>
              </StDetailRow>
              <StDetailRow>
                <span>평단 변화</span>
                <strong
                  style={{ color: toneColor(newAvg - holding.avgPrice) }}
                >
                  {hidden
                    ? "•••••"
                    : formatSignedWon(Math.round(newAvg - holding.avgPrice))}
                </strong>
              </StDetailRow>
              <StDetailRow $emphasis>
                <span>새 수익률 (현재가 기준)</span>
                <strong style={{ color: toneColor(newRate ?? 0) }}>
                  {newRate === null ? "—" : formatSignedPercent(newRate)}
                </strong>
              </StDetailRow>
            </>
          ) : (
            <StCalcHint>
              추가 수량과 단가를 입력하면 새 평단을 계산해요.
            </StCalcHint>
          )}
        </StCalcBody>
      ) : null}
    </StDetail>
  );
}
