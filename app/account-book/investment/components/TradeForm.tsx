"use client";

import { useEffect, useState } from "react";

import type { StockTradeSide } from "../../types";
import {
  StForm,
  StFormBottomRow,
  StFormField,
  StFormTopRow,
  StInput,
  StSearchDropdown,
  StSearchOption,
  StSearchWrap,
  StSelectedStock,
  StSideOption,
  StSideToggle,
  StSubmitButton,
} from "../page.styles";
import { todayIso } from "../format";

// ── 매매 입력 폼 (종목 자동완성 포함) ────────────────────────────────────────
type SearchItem = { code: string; name: string; market: string };

export function TradeForm({
  onSubmit,
}: {
  onSubmit: (input: {
    date: string;
    side: StockTradeSide;
    stockCode: string;
    stockName: string;
    quantity: number;
    price: number;
  }) => Promise<boolean>;
}) {
  const [date, setDate] = useState(todayIso());
  const [side, setSide] = useState<StockTradeSide>("buy");
  const [stockCode, setStockCode] = useState("");
  const [stockName, setStockName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 종목명 자동완성 디바운스(300ms)
  useEffect(() => {
    const keyword = query.trim();
    let active = true;
    const timer = setTimeout(() => {
      if (!keyword || keyword.length < 2 || stockCode) {
        setResults([]);
        return;
      }
      void (async () => {
        try {
          const res = await fetch(
            `/api/stock-search?q=${encodeURIComponent(keyword)}`,
          );
          if (!res.ok) return;
          const data = (await res.json()) as { items?: SearchItem[] };
          if (!active) return;
          setResults(data.items || []);
          setShowResults(true);
        } catch (error) {
          console.error("종목 검색 실패:", error);
        }
      })();
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, stockCode]);

  const quantityNum = Number(quantity.replace(/,/g, ""));
  const priceNum = Number(price.replace(/,/g, ""));
  const valid =
    !!stockCode &&
    !!stockName &&
    Number.isFinite(quantityNum) &&
    quantityNum > 0 &&
    Number.isFinite(priceNum) &&
    priceNum > 0;

  const resetStock = () => {
    setStockCode("");
    setStockName("");
    setQuery("");
    setResults([]);
    setShowResults(false);
  };

  const handleSubmit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    const ok = await onSubmit({
      date,
      side,
      stockCode,
      stockName,
      quantity: quantityNum,
      price: priceNum,
    });
    setSubmitting(false);
    if (ok) {
      resetStock();
      setQuantity("");
      setPrice("");
    }
  };

  return (
    <StForm>
      <StFormTopRow>
        <StFormField>
          <label>날짜</label>
          <StInput
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </StFormField>
        <StSideToggle>
          <StSideOption
            type="button"
            $active={side === "buy"}
            $side="buy"
            onClick={() => setSide("buy")}
          >
            매수
          </StSideOption>
          <StSideOption
            type="button"
            $active={side === "sell"}
            $side="sell"
            onClick={() => setSide("sell")}
          >
            매도
          </StSideOption>
        </StSideToggle>
      </StFormTopRow>

      <StFormField>
        <label>종목</label>
        {stockCode ? (
          <StSelectedStock>
            <strong>{stockName}</strong>
            <span>{stockCode}</span>
            <button type="button" onClick={resetStock}>
              변경
            </button>
          </StSelectedStock>
        ) : (
          <StSearchWrap>
            <StInput
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onFocus={() => results.length > 0 && setShowResults(true)}
              placeholder="종목명 검색 (예: 삼성전자)"
            />
            {showResults && results.length > 0 ? (
              <StSearchDropdown>
                {results.map((item) => (
                  <StSearchOption
                    key={item.code}
                    type="button"
                    onClick={() => {
                      setStockCode(item.code);
                      setStockName(item.name);
                      setShowResults(false);
                    }}
                  >
                    <strong>{item.name}</strong>
                    <span>
                      {item.code} · {item.market}
                    </span>
                  </StSearchOption>
                ))}
              </StSearchDropdown>
            ) : null}
          </StSearchWrap>
        )}
      </StFormField>

      <StFormBottomRow>
        <StFormField>
          <label>수량</label>
          <StInput
            inputMode="numeric"
            value={quantity}
            onChange={(event) =>
              setQuantity(event.target.value.replace(/[^\d]/g, ""))
            }
            placeholder="예: 10"
          />
        </StFormField>
        <StFormField>
          <label>단가</label>
          <StInput
            inputMode="numeric"
            value={price}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, "");
              setPrice(digits ? Number(digits).toLocaleString("ko-KR") : "");
            }}
            placeholder="예: 70,000"
          />
        </StFormField>
        <StSubmitButton
          type="button"
          disabled={!valid || submitting}
          $side={side}
          onClick={() => void handleSubmit()}
        >
          {side === "buy" ? "매수 기록" : "매도 기록"}
        </StSubmitButton>
      </StFormBottomRow>
    </StForm>
  );
}
