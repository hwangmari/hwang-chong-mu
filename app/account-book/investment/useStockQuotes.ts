"use client";

import { useCallback, useEffect, useState } from "react";

export type StockQuote = {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  marketState: string;
};

export type QuoteMap = Record<string, StockQuote>;

const POLL_INTERVAL_MS = 30_000;
// 프록시(stock-quote)의 MAX_CODES와 동일 — 보유 종목이 이를 넘으면 나눠서 요청한다
const CHUNK_SIZE = 20;

// 보유 종목 코드 배열로 /api/stock-quote를 폴링한다.
// 초기 1회 + 30초 간격, 탭 비활성(visibilityState !== "visible") 시 스킵,
// 실패 시 기존 시세를 유지하고 error 플래그만 세운다. 수동 refresh() 노출.
export function useStockQuotes(codes: string[]) {
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState(false);

  // codes 배열은 매 렌더 새 참조라 정렬된 문자열 키로 안정화한다.
  const codesKey = codes.slice().sort().join(",");

  const fetchQuotes = useCallback(async () => {
    if (!codesKey) {
      setQuotes({});
      return;
    }
    // 종목이 CHUNK_SIZE를 넘으면 여러 요청으로 분할 (프록시가 20개 초과를 400으로 거부)
    const allCodes = codesKey.split(",");
    const chunks: string[][] = [];
    for (let i = 0; i < allCodes.length; i += CHUNK_SIZE) {
      chunks.push(allCodes.slice(i, i + CHUNK_SIZE));
    }
    try {
      const results = await Promise.all(
        chunks.map(async (chunk) => {
          const res = await fetch(
            `/api/stock-quote?codes=${encodeURIComponent(chunk.join(","))}`,
          );
          if (!res.ok) return null;
          const data = (await res.json()) as { quotes?: StockQuote[] };
          return data.quotes || [];
        }),
      );
      const map: QuoteMap = {};
      let anyFailed = false;
      let anySucceeded = false;
      for (const result of results) {
        if (result === null) {
          anyFailed = true;
          continue;
        }
        anySucceeded = true;
        for (const quote of result) {
          map[quote.code] = quote;
        }
      }
      // 일부 청크만 실패해도 성공분은 반영하고 error 플래그로만 알린다
      if (anySucceeded) {
        setQuotes(map);
        setLastUpdated(new Date());
      }
      setError(anyFailed);
    } catch (fetchError) {
      console.error("시세 조회 실패:", fetchError);
      setError(true);
    }
  }, [codesKey]);

  useEffect(() => {
    // 초기 1회 로드. async IIFE로 감싸 effect 본문에서 직접 setState하지 않는다.
    void (async () => {
      await fetchQuotes();
    })();
    if (!codesKey) return;

    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
      void fetchQuotes();
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [codesKey, fetchQuotes]);

  return { quotes, lastUpdated, error, refresh: fetchQuotes };
}
