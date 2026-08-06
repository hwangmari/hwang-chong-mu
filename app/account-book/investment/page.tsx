"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  StPage,
  StCenterCard,
  StBackTextButton,
  StHeader,
  StBackButton,
  StHeaderTitle,
  StRefresh,
  StSummaryGrid,
  StSummaryCard,
  StCard,
  StCardTitle,
  StCardHead,
  StSortChips,
  StSortChip,
  StEmpty,
  StTable,
  StTableHead,
  StHoldingGroup,
  StTableRow,
  StNameCell,
  StPriceCell,
  StPnlCell,
  StSplit,
  StInput,
  StTradeList,
  StTradeGroup,
  StTradeDateHeaderRow,
  StDateChangeButton,
  StDateEditBar,
  StEditSave,
  StEditCancel,
  StTradeDateHeader,
  StTradeCaret,
  StTradeMore,
  StTradeRow,
  StTradeMeta,
  StSideBadge,
  StTradeRight,
  StDeleteButton,
} from "./page.styles";
import { useModal } from "@/components/common/ModalProvider";
import { fetchAccountBookStore } from "../repository";
import AccountBookLockGate from "../components/AccountBookLockGate";
import { useAssetData } from "../hooks/useAssetData";
import { useStockTrades } from "../hooks/useStockTrades";
import { getWorkspaceById } from "../storage";
import type { AccountBookStore } from "../types";
import { computeHoldings, estimateSellCosts, heldQuantity } from "./holdings";
import { useStockQuotes } from "./useStockQuotes";
import {
  formatClock,
  formatDateLabel,
  formatQuantity,
  formatSignedPercent,
  formatSignedWon,
  formatWon,
  todayIso,
  toneColor,
} from "./format";
import { ClosedSection } from "./components/ClosedSection";
import { HoldingDetail } from "./components/HoldingDetail";
import { TradeForm } from "./components/TradeForm";

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

  // 헤더 주식 메뉴로 진입한 경우(back=board)엔 가계부 보드로, 그 외엔 연간 자산으로 돌아간다.
  const backUrl =
    searchParams.get("back") === "board"
      ? `/account-book?workspaceId=${workspaceId}&view=board`
      : `/account-book/annual?kind=asset&workspaceId=${workspaceId}`;

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

export default function AccountBookInvestmentPage() {
  return (
    <Suspense fallback={<StPage>투자 화면을 준비하는 중...</StPage>}>
      <AccountBookInvestmentContent />
    </Suspense>
  );
}
