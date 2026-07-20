import type { StockTrade } from "../types";

// 보유 종목 계산 유틸.
// 평단가는 이동평균법(국내 증권사 표준)으로 산출한다. 수수료는 산입하지 않는다:
//   - 매수 시: 평단 = (기존수량 × 기존평단 + 매수수량 × 매수가) / (기존수량 + 매수수량)
//   - 매도 시: 수량만 차감하고 평단은 유지, 실현손익 += 매도수량 × (매도가 − 평단)
//   - investedAmount(현재 보유분 매입금) = 보유수량 × 평단
//   - 예상 수수료·세금(estimateSellCosts)은 표시 전용 참고값

export type Holding = {
  code: string;
  name: string;
  quantity: number;
  avgPrice: number;
  investedAmount: number; // 현재 보유분 매입금 (quantity × avgPrice)
  realizedPnl: number;
};

export type ClosedPosition = {
  code: string;
  name: string;
  realizedPnl: number;
};

// 매도 1건이 만든 실현손익 — 기간별(월/년) 집계용
export type RealizedEvent = {
  date: string; // YYYY-MM-DD (매도일)
  code: string;
  amount: number;
};

export type HoldingsResult = {
  holdings: Holding[]; // 현재 보유수량 > 0
  closedPositions: ClosedPosition[]; // 보유수량 0 (청산), 실현손익만 유지
  realizedEvents: RealizedEvent[]; // 매도별 실현손익 (날짜 포함)
};

type Position = {
  code: string;
  name: string;
  quantity: number;
  avgPrice: number;
  realizedPnl: number;
};

export function computeHoldings(
  trades: StockTrade[],
  accountId: string,
): HoldingsResult {
  // 해당 계좌 거래만 날짜순으로 정렬. 같은 날짜에서는 매수를 매도보다 먼저
  // 처리한다 — id(랜덤) 순서로 매도가 앞서면 "보유 0에서 매도"로 클램프되어
  // 같은 날 매수·매도한 수량이 증발하는 버그가 있었다.
  const scoped = trades
    .filter((trade) => trade.accountId === accountId)
    .slice()
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      if (a.side !== b.side) return a.side === "buy" ? -1 : 1;
      return a.id.localeCompare(b.id);
    });

  const positions = new Map<string, Position>();
  const realizedEvents: RealizedEvent[] = [];

  for (const trade of scoped) {
    let position = positions.get(trade.stockCode);
    if (!position) {
      position = {
        code: trade.stockCode,
        name: trade.stockName,
        quantity: 0,
        avgPrice: 0,
        realizedPnl: 0,
      };
      positions.set(trade.stockCode, position);
    }
    // 최신 이름으로 갱신(리네이밍/오타 수정 반영)
    if (trade.stockName) position.name = trade.stockName;

    // 수수료는 평단·손익에 산입하지 않는다 — 예상 수수료·세금은 표시 전용(estimateSellCosts)
    if (trade.side === "buy") {
      const totalCost =
        position.quantity * position.avgPrice + trade.quantity * trade.price;
      const nextQuantity = position.quantity + trade.quantity;
      position.avgPrice = nextQuantity > 0 ? totalCost / nextQuantity : 0;
      position.quantity = nextQuantity;
    } else {
      const sellQuantity = Math.min(trade.quantity, position.quantity);
      const realized = sellQuantity * (trade.price - position.avgPrice);
      position.realizedPnl += realized;
      if (sellQuantity > 0) {
        realizedEvents.push({
          date: trade.date,
          code: trade.stockCode,
          amount: realized,
        });
      }
      position.quantity -= sellQuantity;
      if (position.quantity <= 0) {
        position.quantity = 0;
        // 평단은 유지(청산 후 재매수 시 새로 계산됨)
      }
    }
  }

  const holdings: Holding[] = [];
  const closedPositions: ClosedPosition[] = [];

  for (const position of positions.values()) {
    if (position.quantity > 0) {
      holdings.push({
        code: position.code,
        name: position.name,
        quantity: position.quantity,
        avgPrice: position.avgPrice,
        investedAmount: position.quantity * position.avgPrice,
        realizedPnl: position.realizedPnl,
      });
    } else if (position.realizedPnl !== 0) {
      closedPositions.push({
        code: position.code,
        name: position.name,
        realizedPnl: position.realizedPnl,
      });
    }
  }

  return { holdings, closedPositions, realizedEvents };
}

// 수수료·세금 비율(참고용 근사치, 실제 체결가·정책에 따라 달라질 수 있다).
export const FEE_RATE = 0.00015; // 증권사 수수료 0.015% (토스 기준)
export const TAX_RATE = 0.0015; // 코스피 농특세 0.15% (2026 거래세 0% + 농특세)

// 매도 예상 비용(수수료·세금) 추정 — 보유 종목 상세 박스·요약 카드에서 사용.
export function estimateSellCosts(valuation: number) {
  return {
    fee: Math.round(valuation * FEE_RATE),
    tax: Math.round(valuation * TAX_RATE),
  };
}

// 매매 기록 저장 시 자동 계산되는 수수료(원).
// 매수: 거래대금 × 수수료율. 매도: 거래대금 × (수수료율 + 세율).
// 해당 계좌·종목의 현재 보유수량(매도 검증용).
export function heldQuantity(
  trades: StockTrade[],
  accountId: string,
  stockCode: string,
): number {
  return trades
    .filter(
      (trade) =>
        trade.accountId === accountId && trade.stockCode === stockCode,
    )
    .reduce(
      (sum, trade) =>
        sum + (trade.side === "buy" ? trade.quantity : -trade.quantity),
      0,
    );
}
