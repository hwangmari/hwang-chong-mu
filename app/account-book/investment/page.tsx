"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { useModal } from "@/components/common/ModalProvider";
import { fetchAccountBookStore } from "../repository";
import AccountBookLockGate from "../components/AccountBookLockGate";
import { useAssetData } from "../hooks/useAssetData";
import { useStockTrades } from "../hooks/useStockTrades";
import { getWorkspaceById } from "../storage";
import type { AccountBookStore, StockTradeSide } from "../types";
import type { Holding } from "./holdings";
import { computeHoldings, estimateSellCosts, heldQuantity } from "./holdings";
import { useStockQuotes } from "./useStockQuotes";

// 등락·손익 색상 (국내 관례): 상승/이익 빨강, 하락/손실 파랑
const GAIN_COLOR = "#d64c4c";
const LOSS_COLOR = "#3182f6";

function toneColor(value: number) {
  if (value > 0) return GAIN_COLOR;
  if (value < 0) return LOSS_COLOR;
  return "#4a515c";
}

function formatWon(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatSignedWon(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(Math.round(value)).toLocaleString("ko-KR")}원`;
}

function formatSignedPercent(value: number) {
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

function formatQuantity(value: number) {
  return value.toLocaleString("ko-KR", { maximumFractionDigits: 4 });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDateLabel(iso: string) {
  const date = new Date(`${iso}T00:00:00`);
  const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekday})`;
}

function formatClock(date: Date) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function AccountBookInvestmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openAlert, openConfirm } = useModal();

  const workspaceId = searchParams.get("workspace") || "";
  const accountId = searchParams.get("account") || "";

  const [store, setStore] = useState<AccountBookStore | null>(null);
  const [isStoreLoading, setIsStoreLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  // 토스식 상세 아코디언 — 한 번에 한 종목만 펼침
  const [openHoldingCode, setOpenHoldingCode] = useState<string | null>(null);
  // 금액 숨기기 (대시보드와 동일한 ••••• 마스킹, 수량·등락률은 그대로)
  const [isAmountHidden, setIsAmountHidden] = useState(false);
  const hideWon = (value: number) =>
    isAmountHidden ? "•••••" : formatWon(value);
  const hideSignedWon = (value: number) =>
    isAmountHidden ? "•••••" : formatSignedWon(value);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const nextStore = await fetchAccountBookStore();
        if (!active) return;
        setStore(nextStore);
        setLoadError(null);
      } catch (error) {
        console.error("투자 페이지 데이터 불러오기 실패:", error);
        if (!active) return;
        setLoadError("데이터를 불러오지 못했습니다.");
      } finally {
        if (active) setIsStoreLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const workspace = store ? getWorkspaceById(store, workspaceId) : null;
  const actorUserId =
    workspace?.ownerUserId || store?.users[0]?.id || "";

  const asset = useAssetData(workspaceId || null, actorUserId || null);
  // 자산 계좌는 store가 아니라 자산 RPC(useAssetData)에서 온다 — store.assetAccounts는 항상 빈 배열
  const account =
    asset.accounts.find((item) => item.id === accountId) || null;
  const { trades, addTrade, removeTrade, changeTradesDate } = useStockTrades(
    workspaceId || null,
    actorUserId || null,
  );

  const accountTrades = useMemo(
    () => trades.filter((trade) => trade.accountId === accountId),
    [trades, accountId],
  );

  // 매매일지 그룹 접기: 최신 날짜만 기본 펼침, 펼친 그룹도 10건 초과분은 더보기로
  const [tradeGroupToggles, setTradeGroupToggles] = useState<
    Record<string, boolean>
  >({});
  const [tradeShowAll, setTradeShowAll] = useState<Record<string, boolean>>({});
  // 그룹 날짜 일괄 변경 중인 날짜 + 입력값
  const [dateEditGroup, setDateEditGroup] = useState<string | null>(null);
  const [dateEditValue, setDateEditValue] = useState("");
  const TRADE_PREVIEW_COUNT = 10;

  // 매매일지 날짜별 그룹 (최신 날짜부터)
  const tradeGroups = useMemo(() => {
    const sorted = accountTrades.slice().sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    });
    const groups: { date: string; trades: typeof accountTrades }[] = [];
    for (const trade of sorted) {
      const last = groups[groups.length - 1];
      if (last && last.date === trade.date) last.trades.push(trade);
      else groups.push({ date: trade.date, trades: [trade] });
    }
    return groups;
  }, [accountTrades]);

  const { holdings, closedPositions, realizedEvents } = useMemo(
    () => computeHoldings(trades, accountId),
    [trades, accountId],
  );

  // 실현손익 기간별 집계 (이번 달 / 올해 / 전체)
  const realizedByPeriod = useMemo(() => {
    const monthKey = todayIso().slice(0, 7);
    const yearKey = todayIso().slice(0, 4);
    let month = 0;
    let year = 0;
    let all = 0;
    for (const event of realizedEvents) {
      all += event.amount;
      if (event.date.startsWith(yearKey)) year += event.amount;
      if (event.date.startsWith(monthKey)) month += event.amount;
    }
    return { month, year, all };
  }, [realizedEvents]);

  const codes = useMemo(
    () => holdings.map((holding) => holding.code),
    [holdings],
  );
  const { quotes, lastUpdated, error: quoteError, refresh } =
    useStockQuotes(codes);

  // 보유 현황 정렬: 기본(매수 순) / 수익률 높은순 / 수익률 낮은순
  const [holdingSort, setHoldingSort] = useState<
    "default" | "rateDesc" | "rateAsc"
  >("default");
  const holdingRows = useMemo(
    () =>
      holdings.map((holding) => {
        const quote = quotes[holding.code];
        const valuation = quote ? quote.price * holding.quantity : null;
        const pnl =
          valuation === null ? null : valuation - holding.investedAmount;
        const pnlRate =
          pnl === null || holding.investedAmount === 0
            ? null
            : (pnl / holding.investedAmount) * 100;
        return { holding, quote, valuation, pnl, pnlRate };
      }),
    [holdings, quotes],
  );
  const sortedHoldingRows = useMemo(() => {
    if (holdingSort === "default") return holdingRows;
    return holdingRows.slice().sort((a, b) => {
      // 시세 없는 종목은 항상 맨 뒤로
      const missing = Number.MAX_SAFE_INTEGER;
      if (holdingSort === "rateDesc") {
        return (b.pnlRate ?? -missing) - (a.pnlRate ?? -missing);
      }
      return (a.pnlRate ?? missing) - (b.pnlRate ?? missing);
    });
  }, [holdingRows, holdingSort]);

  const accountBalance = asset.balanceByAccount[accountId] || 0;

  const backUrl = `/account-book/annual?kind=asset&workspaceId=${workspaceId}`;

  // 요약 집계
  const summary = useMemo(() => {
    let totalInvested = 0;
    let totalValuation = 0;
    let totalSellCosts = 0;
    let hasAllQuotes = holdings.length > 0;
    let realizedPnl = 0;
    for (const holding of holdings) {
      totalInvested += holding.investedAmount;
      realizedPnl += holding.realizedPnl;
      const quote = quotes[holding.code];
      if (quote) {
        const valuation = quote.price * holding.quantity;
        totalValuation += valuation;
        const { fee, tax } = estimateSellCosts(valuation);
        totalSellCosts += fee + tax;
      } else {
        hasAllQuotes = false;
      }
    }
    for (const closed of closedPositions) {
      realizedPnl += closed.realizedPnl;
    }
    const evalPnl = hasAllQuotes ? totalValuation - totalInvested : null;
    const evalRate =
      evalPnl !== null && totalInvested > 0
        ? (evalPnl / totalInvested) * 100
        : null;
    // 전 종목 시세가 있을 때만 매도비용 반영 순평가손익 제공
    const netEvalPnl =
      evalPnl !== null ? evalPnl - totalSellCosts : null;
    return {
      totalInvested,
      totalValuation: hasAllQuotes ? totalValuation : null,
      evalPnl,
      evalRate,
      netEvalPnl,
      realizedPnl,
    };
  }, [holdings, closedPositions, quotes]);

  if (isStoreLoading || asset.isLoading) {
    return (
      <StPage>
        <StCenterCard>불러오는 중…</StCenterCard>
      </StPage>
    );
  }

  if (loadError || !store) {
    return (
      <StPage>
        <StCenterCard>
          <p>{loadError || "데이터를 불러오지 못했습니다."}</p>
          <StBackTextButton type="button" onClick={() => router.push(backUrl)}>
            자산 보드로 돌아가기
          </StBackTextButton>
        </StCenterCard>
      </StPage>
    );
  }

  if (!workspace || !account) {
    return (
      <StPage>
        <StCenterCard>
          <p>계좌 정보를 찾을 수 없어요. 자산 보드에서 다시 선택해주세요.</p>
          <StBackTextButton type="button" onClick={() => router.push(backUrl)}>
            자산 보드로 돌아가기
          </StBackTextButton>
        </StCenterCard>
      </StPage>
    );
  }

  return (
    <AccountBookLockGate
      password={workspace.password}
      accessKey={`hwang-account-book-access-${workspace.id}`}
      title={`${workspace.name} 비밀번호`}
      description="투자 포트폴리오도 같은 비밀번호로 확인합니다."
      backToHome={false}
      onBack={() => router.push(backUrl)}
    >
      <StPage>
        <StHeader>
          <StBackButton
            type="button"
            aria-label="뒤로 가기"
            onClick={() => router.push(backUrl)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m14.71 6.71-1.42-1.42L6.59 12l6.7 6.71 1.42-1.42L9.41 12z" />
            </svg>
          </StBackButton>
          <StHeaderTitle>
            <strong>{account.name}</strong>
            <span>주식 포트폴리오</span>
          </StHeaderTitle>
          <StRefresh>
            <span>
              {quoteError
                ? "시세 불러오기 실패"
                : lastUpdated
                  ? `시세 ${formatClock(lastUpdated)} 기준`
                  : "시세 대기 중"}
            </span>
            <button
              type="button"
              onClick={() => setIsAmountHidden((prev) => !prev)}
              aria-pressed={isAmountHidden}
            >
              {isAmountHidden ? "금액 보기" : "금액 숨기기"}
            </button>
            <button type="button" onClick={() => void refresh()}>
              새로고침
            </button>
          </StRefresh>
        </StHeader>

        <StSummaryGrid>
          <StSummaryCard>
            <span>총 평가액</span>
            <strong>
              {summary.totalValuation === null
                ? "—"
                : hideWon(summary.totalValuation)}
            </strong>
            <em>통장 잔액 {hideWon(accountBalance)}</em>
          </StSummaryCard>
          <StSummaryCard>
            <span>총 매입금</span>
            <strong>{hideWon(summary.totalInvested)}</strong>
          </StSummaryCard>
          <StSummaryCard>
            <span>평가손익</span>
            <strong style={{ color: toneColor(summary.evalPnl ?? 0) }}>
              {summary.evalPnl === null
                ? "—"
                : hideSignedWon(summary.evalPnl)}
            </strong>
            <em style={{ color: toneColor(summary.evalRate ?? 0) }}>
              {summary.evalRate === null
                ? "시세 없음"
                : formatSignedPercent(summary.evalRate)}
            </em>
            {summary.netEvalPnl !== null ? (
              <em>매도비용 반영 시 {hideSignedWon(summary.netEvalPnl)}</em>
            ) : null}
          </StSummaryCard>
          <StSummaryCard>
            <span>실현손익 (이번 달)</span>
            <strong style={{ color: toneColor(realizedByPeriod.month) }}>
              {hideSignedWon(realizedByPeriod.month)}
            </strong>
            <em style={{ color: toneColor(realizedByPeriod.year) }}>
              올해 {hideSignedWon(realizedByPeriod.year)}
            </em>
            <em style={{ color: toneColor(realizedByPeriod.all) }}>
              전체 {hideSignedWon(realizedByPeriod.all)}
            </em>
          </StSummaryCard>
        </StSummaryGrid>

        <StSplit>
        <StCard>
          <StCardHead>
            <StCardTitle>보유 현황</StCardTitle>
            {holdings.length > 1 ? (
              <StSortChips>
                {(
                  [
                    ["default", "기본"],
                    ["rateDesc", "수익률 높은순"],
                    ["rateAsc", "낮은순"],
                  ] as const
                ).map(([key, label]) => (
                  <StSortChip
                    key={key}
                    type="button"
                    $active={holdingSort === key}
                    onClick={() => setHoldingSort(key)}
                  >
                    {label}
                  </StSortChip>
                ))}
              </StSortChips>
            ) : null}
          </StCardHead>
          {holdings.length === 0 ? (
            <StEmpty>
              보유 종목이 없어요. 아래 매매일지에서 매수를 기록해보세요.
            </StEmpty>
          ) : (
            <StTable>
              <StTableHead>
                <span>종목</span>
                <span>수량</span>
                <span>평단가</span>
                <span>현재가</span>
                <span>평가액</span>
                <span>평가손익</span>
              </StTableHead>
              {sortedHoldingRows.map(({ holding, quote, valuation, pnl, pnlRate }) => {
                const isOpen = openHoldingCode === holding.code;
                return (
                  <StHoldingGroup key={holding.code}>
                  <StTableRow
                    $clickable
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenHoldingCode((prev) =>
                        prev === holding.code ? null : holding.code,
                      )
                    }
                  >
                    <StNameCell>
                      <strong>{holding.name}</strong>
                      <span>{holding.code}</span>
                    </StNameCell>
                    <span>{formatQuantity(holding.quantity)}</span>
                    <span>{hideWon(holding.avgPrice)}</span>
                    <StPriceCell>
                      {quote ? (
                        <>
                          <strong>{formatWon(quote.price)}</strong>
                          <em style={{ color: toneColor(quote.change) }}>
                            {formatSignedPercent(quote.changeRate)}
                          </em>
                        </>
                      ) : (
                        <strong>—</strong>
                      )}
                    </StPriceCell>
                    <span>{valuation === null ? "—" : hideWon(valuation)}</span>
                    <StPnlCell>
                      {pnl === null ? (
                        <strong>—</strong>
                      ) : (
                        <>
                          <strong style={{ color: toneColor(pnl) }}>
                            {hideSignedWon(pnl)}
                          </strong>
                          {pnlRate !== null ? (
                            <em style={{ color: toneColor(pnlRate) }}>
                              {formatSignedPercent(pnlRate)}
                            </em>
                          ) : null}
                        </>
                      )}
                    </StPnlCell>
                  </StTableRow>
                  {isOpen ? (
                    <HoldingDetail
                      holding={holding}
                      valuation={valuation}
                      pnl={pnl}
                      pnlRate={pnlRate}
                      currentPrice={quote?.price ?? null}
                      hidden={isAmountHidden}
                    />
                  ) : null}
                  </StHoldingGroup>
                );
              })}
            </StTable>
          )}

          {closedPositions.length > 0 ? (
            <ClosedSection positions={closedPositions} hidden={isAmountHidden} />
          ) : null}
        </StCard>

        <StCard>
          <StCardTitle>매매일지</StCardTitle>
          <TradeForm
            onSubmit={async (input) => {
              if (input.side === "sell") {
                const held = heldQuantity(trades, accountId, input.stockCode);
                if (input.quantity > held) {
                  await openAlert(
                    `보유 수량(${formatQuantity(held)}주)보다 많이 매도할 수 없어요.`,
                  );
                  return false;
                }
              }
              const saved = await addTrade({ ...input, accountId });
              if (!saved) {
                await openAlert(
                  "매매 기록 저장에 실패했어요. 잠시 후 다시 시도해주세요.",
                );
                return false;
              }
              return true;
            }}
          />

          <StTradeList>
            {accountTrades.length === 0 ? (
              <StEmpty>아직 기록된 매매가 없어요.</StEmpty>
            ) : (
              tradeGroups.map((group, groupIndex) => {
                const isExpanded =
                  tradeGroupToggles[group.date] ?? groupIndex === 0;
                const showAll = tradeShowAll[group.date] ?? false;
                const visibleTrades = showAll
                  ? group.trades
                  : group.trades.slice(0, TRADE_PREVIEW_COUNT);
                return (
                <StTradeGroup key={group.date}>
                  <StTradeDateHeaderRow>
                    <StTradeDateHeader
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() =>
                        setTradeGroupToggles((prev) => ({
                          ...prev,
                          [group.date]: !isExpanded,
                        }))
                      }
                    >
                      <span>{formatDateLabel(group.date)}</span>
                      <em>
                        {group.trades.length}건
                        <StTradeCaret
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                          $open={isExpanded}
                        >
                          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" />
                        </StTradeCaret>
                      </em>
                    </StTradeDateHeader>
                    <StDateChangeButton
                      type="button"
                      title="이 날짜의 거래 전체를 다른 날짜로 옮겨요"
                      onClick={() => {
                        setDateEditGroup(group.date);
                        setDateEditValue(group.date);
                      }}
                    >
                      날짜 변경
                    </StDateChangeButton>
                  </StTradeDateHeaderRow>
                  {dateEditGroup === group.date ? (
                    <StDateEditBar>
                      <StInput
                        type="date"
                        value={dateEditValue}
                        onChange={(event) =>
                          setDateEditValue(event.target.value)
                        }
                      />
                      <StEditSave
                        type="button"
                        onClick={async () => {
                          if (
                            !dateEditValue ||
                            dateEditValue === group.date
                          ) {
                            setDateEditGroup(null);
                            return;
                          }
                          const ok = await changeTradesDate(
                            group.trades,
                            dateEditValue,
                          );
                          if (!ok) {
                            await openAlert("날짜 변경에 실패했어요.");
                          }
                          setDateEditGroup(null);
                        }}
                      >
                        {group.trades.length}건 이동
                      </StEditSave>
                      <StEditCancel
                        type="button"
                        onClick={() => setDateEditGroup(null)}
                      >
                        취소
                      </StEditCancel>
                    </StDateEditBar>
                  ) : null}
                  {isExpanded ? (
                    <>
                  {visibleTrades.map((trade) => (
                    <StTradeRow key={trade.id}>
                      <StTradeMeta>
                        <StSideBadge $side={trade.side}>
                          {trade.side === "buy" ? "매수" : "매도"}
                        </StSideBadge>
                        <div>
                          <strong>{trade.stockName}</strong>
                          <span>
                            {formatQuantity(trade.quantity)}주 ·{" "}
                            {hideWon(trade.price)}
                            {trade.memo ? ` · ${trade.memo}` : ""}
                          </span>
                        </div>
                      </StTradeMeta>
                      <StTradeRight>
                        <em>{hideWon(trade.price * trade.quantity)}</em>
                        <StDeleteButton
                          type="button"
                          aria-label="매매 기록 삭제"
                          onClick={async () => {
                            if (
                              await openConfirm("이 매매 기록을 삭제할까요?")
                            ) {
                              void removeTrade(trade.id);
                            }
                          }}
                        >
                          ×
                        </StDeleteButton>
                      </StTradeRight>
                    </StTradeRow>
                  ))}
                  {!showAll &&
                  group.trades.length > TRADE_PREVIEW_COUNT ? (
                    <StTradeMore
                      type="button"
                      onClick={() =>
                        setTradeShowAll((prev) => ({
                          ...prev,
                          [group.date]: true,
                        }))
                      }
                    >
                      더보기 ({group.trades.length - TRADE_PREVIEW_COUNT}건)
                    </StTradeMore>
                  ) : null}
                    </>
                  ) : null}
                </StTradeGroup>
                );
              })
            )}
          </StTradeList>
        </StCard>
        </StSplit>
      </StPage>
    </AccountBookLockGate>
  );
}

// ── 청산(보유 0) 종목 실현손익 접이식 섹션 ──────────────────────────────────
function ClosedSection({
  positions,
  hidden,
}: {
  positions: { code: string; name: string; realizedPnl: number }[];
  hidden: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <StClosed>
      <StClosedHeader
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span>청산 종목 실현손익 ({positions.length})</span>
        <em>{open ? "접기" : "펼치기"}</em>
      </StClosedHeader>
      {open ? (
        <StClosedList>
          {positions.map((position) => (
            <StClosedRow key={position.code}>
              <strong>{position.name}</strong>
              <em style={{ color: toneColor(position.realizedPnl) }}>
                {hidden ? "•••••" : formatSignedWon(position.realizedPnl)}
              </em>
            </StClosedRow>
          ))}
        </StClosedList>
      ) : null}
    </StClosed>
  );
}

// ── 보유 종목 토스식 상세(수수료·세금 예상) ──────────────────────────────────
function HoldingDetail({
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

// ── 매매 입력 폼 (종목 자동완성 포함) ────────────────────────────────────────
type SearchItem = { code: string; name: string; market: string };

function TradeForm({
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

export default function AccountBookInvestmentPage() {
  return (
    <Suspense fallback={<StPage>투자 화면을 준비하는 중...</StPage>}>
      <AccountBookInvestmentContent />
    </Suspense>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────
const StPage = styled.main`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 200;
  overflow: auto;
  overscroll-behavior: none;
  min-height: 100dvh;
  background: ${({ theme }) => theme.colors.gray100};
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;

  @media (max-width: 720px) {
    padding: 0.75rem;
  }
`;

const StCenterCard = styled.div`
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  border-radius: 20px;
  border: 1px solid #e4e5e6;
  background: #ffffff;
  padding: 1.6rem;
  font-size: 0.9rem;
  color: #5a606a;
`;

const StBackTextButton = styled.button`
  border: 1px solid #dfe1e4;
  border-radius: 999px;
  background: #ffffff;
  color: #3182f6;
  padding: 0.5rem 1rem;
  font-size: 0.8rem;
  font-weight: 800;
  cursor: pointer;
`;

const StHeader = styled.header`
  display: flex;
  align-items: center;
  gap: 0.6rem;
`;

const StBackButton = styled.button`
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #595c62;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;

  svg {
    width: 2rem;
    height: 2rem;
    fill: currentColor;
  }
`;

const StHeaderTitle = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;

  strong {
    font-size: 1.05rem;
    font-weight: 900;
    color: #222b36;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 0.74rem;
    color: #868a92;
    font-weight: 700;
  }
`;

const StRefresh = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;

  span {
    font-size: 0.72rem;
    color: #868a92;
    font-weight: 700;
    white-space: nowrap;
  }

  button {
    border: 1px solid #dfe1e4;
    border-radius: 999px;
    background: #ffffff;
    color: #5a606a;
    padding: 0.4rem 0.75rem;
    font-size: 0.74rem;
    font-weight: 800;
    cursor: pointer;
  }
`;

const StSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.7rem;

  @media (max-width: 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const StSummaryCard = styled.div`
  border: 1px solid #e8e9ea;
  border-radius: 18px;
  background: #ffffff;
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  span {
    font-size: 0.74rem;
    color: #82868d;
    font-weight: 700;
  }

  strong {
    font-size: 1.05rem;
    font-weight: 900;
    color: #222b36;
    letter-spacing: -0.01em;
  }

  em {
    font-style: normal;
    font-size: 0.72rem;
    color: #8a8e95;
    font-weight: 700;
  }
`;

const StCard = styled.section`
  border-radius: 20px;
  border: 1px solid #e4e5e6;
  background: #ffffff;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const StCardTitle = styled.h2`
  font-size: 1rem;
  font-weight: 900;
  color: #2b3441;
`;

const StCardHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const StSortChips = styled.div`
  display: flex;
  gap: 0.3rem;
`;

const StSortChip = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e2e3e5")};
  background: ${({ $active }) => ($active ? "#eef4fe" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#8a8e95")};
  border-radius: 999px;
  padding: 0.22rem 0.6rem;
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
`;

const StEmpty = styled.p`
  font-size: 0.82rem;
  color: #8a8e95;
  line-height: 1.5;
  padding: 0.6rem 0.1rem;
`;

const TABLE_COLUMNS =
  "minmax(84px, 1.4fr) 0.7fr 0.9fr 1fr 1fr 1.1fr";

const StTable = styled.div`
  max-width: 100%;
  overflow-x: auto;
`;

const StTableHead = styled.div`
  display: grid;
  grid-template-columns: ${TABLE_COLUMNS};
  min-width: 520px;
  padding: 0 0.35rem 0.5rem;
  border-bottom: 1px solid #ededef;

  span {
    font-size: 0.7rem;
    font-weight: 800;
    color: #a3a7ad;
    text-align: right;
  }

  span:first-child {
    text-align: left;
  }
`;

const StHoldingGroup = styled.div`
  min-width: 520px;
  border-bottom: 1px solid #f4f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const StTableRow = styled.div<{ $clickable?: boolean }>`
  display: grid;
  grid-template-columns: ${TABLE_COLUMNS};
  min-width: 520px;
  align-items: center;
  padding: 0.6rem 0.35rem;
  cursor: ${({ $clickable }) => ($clickable ? "pointer" : "default")};

  &:hover {
    background: ${({ $clickable }) => ($clickable ? "#fafbfc" : "transparent")};
  }

  > span {
    font-size: 0.82rem;
    font-weight: 700;
    color: #333d4b;
    text-align: right;
    white-space: nowrap;
  }
`;

const StNameCell = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong {
    font-size: 0.84rem;
    font-weight: 800;
    color: #222b36;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 0.68rem;
    color: #a2a6ad;
    font-weight: 700;
  }
`;

const StPriceCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  strong {
    font-size: 0.82rem;
    font-weight: 800;
    color: #333d4b;
    white-space: nowrap;
  }

  em {
    font-style: normal;
    font-size: 0.7rem;
    font-weight: 800;
  }
`;

const StPnlCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  strong {
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
  }

  em {
    font-style: normal;
    font-size: 0.7rem;
    font-weight: 800;
  }
`;

const StDetail = styled.div`
  margin: 0 0.35rem 0.4rem;
  border-radius: 14px;
  background: #f7f8fa;
  border: 1px solid #eceef1;
  padding: 0.75rem 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.05rem;
`;

const StDetailRow = styled.div<{ $emphasis?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.32rem 0;

  span {
    font-size: 0.78rem;
    font-weight: 700;
    color: ${({ $emphasis }) => ($emphasis ? "#2b3441" : "#7a808a")};
  }

  strong {
    font-size: ${({ $emphasis }) => ($emphasis ? "0.95rem" : "0.84rem")};
    font-weight: ${({ $emphasis }) => ($emphasis ? 900 : 800)};
    color: #222b36;
    white-space: nowrap;
  }
`;

const StDetailDivider = styled.div`
  height: 1px;
  background: #e6e8eb;
  margin: 0.35rem 0;
`;

const StCalcToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  border: none;
  background: transparent;
  padding: 0.1rem 0;
  cursor: pointer;

  span {
    font-size: 0.78rem;
    font-weight: 800;
    color: #4a515c;
  }

  em {
    font-style: normal;
    font-size: 0.7rem;
    font-weight: 700;
    color: #3182f6;
  }
`;

const StCalcBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-top: 0.2rem;
`;

const StCalcInputs = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 0.5rem;
  margin-bottom: 0.2rem;
`;

const StCalcHint = styled.p`
  font-size: 0.74rem;
  font-weight: 700;
  color: #979ba1;
`;

const StClosed = styled.div`
  margin-top: 0.4rem;
  border-top: 1px solid #eef0f2;
  padding-top: 0.6rem;
`;

const StClosedHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: none;
  background: transparent;
  padding: 0.3rem 0.15rem;
  cursor: pointer;

  span {
    font-size: 0.82rem;
    font-weight: 800;
    color: #5a606a;
  }

  em {
    font-style: normal;
    font-size: 0.74rem;
    font-weight: 800;
    color: #a2a6ad;
  }
`;

const StClosedList = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.3rem 0.15rem 0;
`;

const StClosedRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.42rem 0;
  border-top: 1px dashed #eef0f2;

  &:first-child {
    border-top: none;
  }

  strong {
    font-size: 0.82rem;
    font-weight: 700;
    color: #3a3f47;
  }

  em {
    font-style: normal;
    font-size: 0.82rem;
    font-weight: 800;
    white-space: nowrap;
  }
`;

const StForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

// 데스크톱 2단: 좌(보유 현황) | 우(매매일지). 좁은 화면은 세로 스택.
const StSplit = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 0.8rem;
  align-items: start;

  @media (max-width: 1023px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const StFormTopRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.6rem;
  align-items: flex-end;
`;

const StFormBottomRow = styled.div`
  display: grid;
  grid-template-columns: 0.8fr 1fr auto;
  gap: 0.6rem;
  align-items: flex-end;

  @media (max-width: 720px) {
    grid-template-columns: 1fr 1fr;

    /* 기록 버튼은 모바일에서 한 줄 전체 사용 */
    & > :nth-child(3) {
      grid-column: 1 / -1;
    }
  }
`;

const StFormField = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.32rem;

  label {
    font-size: 0.74rem;
    font-weight: 700;
    color: #6a6f78;
  }
`;

const StInput = styled.input`
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #e2e3e5;
  border-radius: 12px;
  padding: 0.6rem 0.7rem;
  font-size: 0.9rem;
  color: #222b36;
  outline: none;

  &:focus {
    border-color: #a9c0f5;
  }
`;

const StSideToggle = styled.div`
  display: flex;
  gap: 0.35rem;
  flex-shrink: 0;
`;

const StSideOption = styled.button<{ $active: boolean; $side: StockTradeSide }>`
  border: 1px solid
    ${({ $active, $side }) =>
      $active ? ($side === "buy" ? "#d64c4c" : "#3182f6") : "#e2e3e5"};
  background: ${({ $active, $side }) =>
    $active ? ($side === "buy" ? "#fdecec" : "#e8f2fe") : "#ffffff"};
  color: ${({ $active, $side }) =>
    $active ? ($side === "buy" ? "#d64c4c" : "#3182f6") : "#6a6f78"};
  border-radius: 12px;
  padding: 0.6rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 800;
  cursor: pointer;
`;

const StSearchWrap = styled.div`
  position: relative;
`;

const StSearchDropdown = styled.div`
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  z-index: 30;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  border: 1px solid #e9eaec;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(26, 34, 49, 0.14);
`;

const StSearchOption = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  border: none;
  background: transparent;
  padding: 0.55rem 0.7rem;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: #f4f5f7;
  }

  strong {
    font-size: 0.85rem;
    font-weight: 800;
    color: #2b3441;
  }

  span {
    font-size: 0.72rem;
    color: #a2a6ad;
    font-weight: 700;
  }
`;

const StSelectedStock = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #d3e3fb;
  background: #f4f8ff;
  border-radius: 12px;
  padding: 0.55rem 0.7rem;

  strong {
    font-size: 0.9rem;
    font-weight: 800;
    color: #222b36;
  }

  span {
    font-size: 0.74rem;
    color: #7a8290;
    font-weight: 700;
  }

  button {
    margin-left: auto;
    border: none;
    background: transparent;
    color: #3182f6;
    font-size: 0.76rem;
    font-weight: 800;
    cursor: pointer;
  }
`;

const StSubmitButton = styled.button<{ $side: StockTradeSide }>`
  border: none;
  border-radius: 12px;
  background: ${({ $side }) => ($side === "buy" ? "#d64c4c" : "#3182f6")};
  color: #ffffff;
  padding: 0.7rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    background: #cdd2d9;
    cursor: default;
  }
`;

const StTradeList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.4rem;
`;

const StTradeGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const StTradeDateHeaderRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StDateChangeButton = styled.button`
  flex-shrink: 0;
  border: 1px solid #e2e3e5;
  background: #ffffff;
  color: #6a6f78;
  border-radius: 999px;
  padding: 0.2rem 0.55rem;
  font-size: 0.66rem;
  font-weight: 800;
  cursor: pointer;
`;

const StDateEditBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.15rem;
`;

const StEditSave = styled.button`
  flex-shrink: 0;
  border: none;
  background: #3182f6;
  color: #ffffff;
  border-radius: 8px;
  padding: 0.4rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 800;
  white-space: nowrap;
  cursor: pointer;
`;

const StEditCancel = styled.button`
  flex-shrink: 0;
  border: 1px solid #e2e3e5;
  background: #ffffff;
  color: #6a6f78;
  border-radius: 8px;
  padding: 0.4rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
`;

const StTradeDateHeader = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0.5rem 0.15rem 0.3rem;
  border-bottom: 1px solid #eceef1;

  span {
    font-size: 0.78rem;
    font-weight: 800;
    color: #4a515c;
  }

  em {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-style: normal;
    font-size: 0.72rem;
    font-weight: 700;
    color: #979ba1;
  }
`;

const StTradeCaret = styled.svg<{ $open: boolean }>`
  width: 0.85rem;
  height: 0.85rem;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
  transform: rotate(${({ $open }) => ($open ? "0deg" : "-90deg")});
  transition: transform 0.15s ease;
`;

const StTradeMore = styled.button`
  align-self: center;
  border: 1px solid #e2e3e5;
  background: #ffffff;
  color: #6a6f78;
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  margin-top: 0.35rem;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
`;

const StTradeRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.55rem 0.15rem;
  border-top: 1px solid #f0f1f3;

  &:first-child {
    border-top: none;
  }
`;

const StTradeMeta = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  div {
    min-width: 0;
    display: flex;
    flex-direction: column;
  }

  strong {
    font-size: 0.84rem;
    font-weight: 800;
    color: #2b3441;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 0.72rem;
    color: #8a8e95;
    font-weight: 600;
  }
`;

const StSideBadge = styled.span<{ $side: StockTradeSide }>`
  flex-shrink: 0;
  font-size: 0.7rem;
  font-weight: 800;
  padding: 0.2rem 0.45rem;
  border-radius: 8px;
  color: ${({ $side }) => ($side === "buy" ? "#d64c4c" : "#3182f6")};
  background: ${({ $side }) => ($side === "buy" ? "#fdecec" : "#e8f2fe")};
`;

const StTradeRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;

  em {
    font-style: normal;
    font-size: 0.8rem;
    font-weight: 800;
    color: #333d4b;
    white-space: nowrap;
  }
`;

const StDeleteButton = styled.button`
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  background: transparent;
  color: #b6bac1;
  font-size: 0.95rem;
  line-height: 1;
  cursor: pointer;

  &:hover {
    color: #f04452;
  }
`;
