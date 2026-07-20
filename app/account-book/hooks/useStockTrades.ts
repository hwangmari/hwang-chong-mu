"use client";

import { useCallback, useEffect, useState } from "react";
import {
  deleteStockTrade,
  fetchStockTrades,
  upsertStockTrade,
} from "../repository";
import type { StockTrade, StockTradeSide } from "../types";

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 12)}`;
}

export type AddTradeInput = {
  accountId: string;
  date: string;
  side: StockTradeSide;
  stockCode: string;
  stockName: string;
  quantity: number;
  price: number;
  memo?: string;
};

export function useStockTrades(
  workspaceId: string | null,
  actorUserId: string | null,
) {
  const [trades, setTrades] = useState<StockTrade[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!workspaceId) {
      setTrades([]);
      return;
    }
    let active = true;
    setIsLoading(true);
    void (async () => {
      try {
        const data = await fetchStockTrades(workspaceId);
        if (!active) return;
        setTrades(data);
      } catch (loadError) {
        // DB 함수가 아직 없으면 RPC가 404일 수 있다. 페이지가 깨지지 않도록
        // 빈 배열을 유지하고 throw하지 않는다(시세 폴링·일지 입력만 동작).
        if (!active) return;
        console.error("매매일지 불러오기 실패:", loadError);
        setTrades([]);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const addTrade = useCallback(
    async (input: AddTradeInput) => {
      if (!workspaceId || !actorUserId) return false;
      const quantity = Math.max(input.quantity, 0);
      const price = Math.max(input.price, 0);
      const trade: StockTrade = {
        id: createId("stock-trade"),
        workspaceId,
        accountId: input.accountId,
        date: input.date,
        side: input.side,
        stockCode: input.stockCode,
        stockName: input.stockName,
        quantity,
        price,
        memo: input.memo || undefined,
        createdByUserId: actorUserId,
      };
      try {
        setTrades(await upsertStockTrade(trade, actorUserId));
        return true;
      } catch (error) {
        console.error("매매 기록 저장 실패:", error);
        return false;
      }
    },
    [actorUserId, workspaceId],
  );

  const removeTrade = useCallback(
    async (tradeId: string) => {
      if (!actorUserId) return;
      try {
        setTrades(await deleteStockTrade(tradeId, actorUserId));
      } catch (error) {
        console.error("매매 기록 삭제 실패:", error);
      }
    },
    [actorUserId],
  );

  // 여러 거래의 날짜를 한 번에 변경(기존 보유분을 실제 취득일로 옮길 때).
  const changeTradesDate = useCallback(
    async (tradeList: StockTrade[], newDate: string) => {
      if (!actorUserId || tradeList.length === 0) return false;
      try {
        let latest: StockTrade[] | null = null;
        for (const trade of tradeList) {
          latest = await upsertStockTrade(
            { ...trade, date: newDate },
            actorUserId,
          );
        }
        if (latest) setTrades(latest);
        return true;
      } catch (error) {
        console.error("매매 날짜 변경 실패:", error);
        return false;
      }
    },
    [actorUserId],
  );

  return { trades, isLoading, addTrade, removeTrade, changeTradesDate };
}
