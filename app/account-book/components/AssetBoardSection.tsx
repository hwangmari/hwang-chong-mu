"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import styled from "styled-components";
import { useModal } from "@/components/common/ModalProvider";
import type { useAssetData } from "../hooks/useAssetData";
import type { AssetChangeType } from "../types";
import { formatAmount } from "./WorkspaceLedgerView/utils";

type Props = {
  asset: ReturnType<typeof useAssetData>;
  currentYear: number;
  isAmountHidden: boolean;
  // 투자 계좌 목표 진행용 — 계좌별 올해 순매수(매수−매도) 금액
  stockYearBuyByAccount?: Record<string, number>;
};

const KIND_OPTIONS = ["예금", "적금", "투자", "연금", "현금", "기타"];

const CHANGE_TYPE_LABEL: Record<AssetChangeType, string> = {
  initial: "초기잔액",
  deposit: "입금",
  withdraw: "출금",
  transfer_in: "이체 받음",
  transfer_out: "이체 보냄",
  ledger: "가계부",
  adjust: "잔액수정",
};

function signedAmount(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "-" : ""}${Math.abs(value).toLocaleString()}원`;
}

function todayIso() {
  // Date 사용 불가한 환경 회피 없이 실제 today
  return new Date().toISOString().slice(0, 10);
}

type ChangeModalState = {
  accountId: string;
  changeType: AssetChangeType;
} | null;

export default function AssetBoardSection({
  asset,
  currentYear,
  isAmountHidden,
  stockYearBuyByAccount,
}: Props) {
  const { openConfirm } = useModal();
  const router = useRouter();
  const mask = (value: number) =>
    isAmountHidden ? "•••••" : formatAmount(value);
  const maskSigned = (value: number) =>
    isAmountHidden ? "•••••" : signedAmount(value);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [collapsedKinds, setCollapsedKinds] = useState<Record<string, boolean>>(
    {},
  );
  const [menuId, setMenuId] = useState<string | null>(null);

  // 아코디언 접힘 상태를 세션에 저장 — 주식 상세를 다녀와도(리마운트) 유지된다.
  // 새 세션(탭)에서 처음 들어오면 저장값이 없어 전부 닫힘(기본)으로 시작.
  // 복원은 마운트 때 읽기만 하고, 저장은 토글 시점(setCollapsedKinds 내부)에 직접 한다
  // — persist를 effect로 하면 마운트 시 빈 값으로 저장소를 덮어쓰는 레이스가 생긴다.
  const COLLAPSE_STORAGE_KEY = "hwang-asset-collapsed-kinds";
  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(COLLAPSE_STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCollapsedKinds(JSON.parse(raw));
    } catch {
      // 무시
    }
  }, []);
  const toggleKindCollapsed = (kind: string, collapsed: boolean) => {
    setCollapsedKinds((prev) => {
      const next = { ...prev, [kind]: !collapsed };
      try {
        window.sessionStorage.setItem(
          COLLAPSE_STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch {
        // 무시
      }
      return next;
    });
  };
  const [accountModal, setAccountModal] = useState<
    { id?: string; name: string; kind: string; goalAmount: number } | null
  >(null);
  const [changeModal, setChangeModal] = useState<ChangeModalState>(null);
  const [transferOpen, setTransferOpen] = useState(false);

  const yearRows = useMemo(
    () => asset.monthlyAccumulation(currentYear),
    [asset, currentYear],
  );
  const yearNet = useMemo(
    () => yearRows.reduce((sum, row) => sum + row.monthly, 0),
    [yearRows],
  );
  const maxMonthly = useMemo(
    () => Math.max(...yearRows.map((row) => Math.abs(row.monthly)), 1),
    [yearRows],
  );

  // 통장을 종류(예금/적금/투자/연금...)별로 묶어 아코디언으로 보여준다.
  const { activeAccounts, balanceByAccount } = asset;
  const kindGroups = useMemo(() => {
    const map = new Map<
      string,
      { kind: string; accounts: typeof activeAccounts; total: number }
    >();
    for (const account of activeAccounts) {
      const kind = account.kind || "기타";
      if (!map.has(kind)) map.set(kind, { kind, accounts: [], total: 0 });
      const group = map.get(kind)!;
      group.accounts.push(account);
      group.total += balanceByAccount[account.id] || 0;
    }
    const order = [...KIND_OPTIONS, "기타"];
    return [...map.values()].sort(
      (a, b) => order.indexOf(a.kind) - order.indexOf(b.kind),
    );
  }, [activeAccounts, balanceByAccount]);

  const renderAccountBlock = (account: (typeof asset.activeAccounts)[number]) => {
    const balance = asset.balanceByAccount[account.id] || 0;
    const isExpanded = expandedId === account.id;
    const history = asset.changesByAccount(account.id);
    const goal = account.goalAmount || 0;
    // 목표는 연 단위 → 올해 유입액만 반영.
    // 투자 계좌는 자산 입금이 아니라 주식 매매(올해 순매수)를 유입으로 본다.
    // (기존 보유분은 매수 일자를 실제 취득일로 넣으면 올해에서 자동 제외됨)
    const yearPrefix = `${currentYear}-`;
    const yearInflow =
      account.kind === "투자"
        ? stockYearBuyByAccount?.[account.id] || 0
        : history
            .filter((change) => change.date.startsWith(yearPrefix))
            .reduce((sum, change) => sum + change.amount, 0);
    const progress =
      goal > 0 ? Math.min(Math.max((yearInflow / goal) * 100, 0), 100) : 0;
    return (
      <StAccountBlock key={account.id}>
        <StAccountRow
          role="button"
          tabIndex={0}
          onClick={() => setExpandedId(isExpanded ? null : account.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setExpandedId(isExpanded ? null : account.id);
            }
          }}
        >
          <StAccountMain>
            <strong>{account.name}</strong>
            <span>{account.kind}</span>
          </StAccountMain>
          <StAccountRight>
            <StBalance>{mask(balance)}</StBalance>
            <StRowActions>
              {account.kind === "투자" ? (
                <StPortfolioButton
                  type="button"
                  title="주식 포트폴리오"
                  aria-label="주식 포트폴리오"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(
                      `/account-book/investment?workspace=${account.workspaceId}&account=${account.id}`,
                    );
                  }}
                >
                  📈
                </StPortfolioButton>
              ) : null}
              <StRowButton
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setChangeModal({
                    accountId: account.id,
                    changeType: "deposit",
                  });
                }}
              >
                입금
              </StRowButton>
              <StKebab
                type="button"
                aria-label="더보기"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuId(menuId === account.id ? null : account.id);
                }}
              >
                ⋯
              </StKebab>
              {menuId === account.id ? (
                <>
                  <StMenuBackdrop
                    type="button"
                    aria-label="닫기"
                    onClick={(event) => {
                      event.stopPropagation();
                      setMenuId(null);
                    }}
                  />
                  <StMenu role="menu">
                    <StMenuItem
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuId(null);
                        setChangeModal({
                          accountId: account.id,
                          changeType: "withdraw",
                        });
                      }}
                    >
                      출금
                    </StMenuItem>
                    <StMenuItem
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuId(null);
                        setChangeModal({
                          accountId: account.id,
                          changeType: "initial",
                        });
                      }}
                    >
                      초기잔액 설정
                    </StMenuItem>
                    <StMenuItem
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setMenuId(null);
                        setAccountModal({
                          id: account.id,
                          name: account.name,
                          kind: account.kind,
                          goalAmount: account.goalAmount,
                        });
                      }}
                    >
                      통장 수정
                    </StMenuItem>
                    <StMenuItem
                      type="button"
                      $danger
                      onClick={async (event) => {
                        event.stopPropagation();
                        setMenuId(null);
                        if (
                          await openConfirm(
                            `‘${account.name}’ 통장과 모든 변동내역을 삭제할까요?`,
                          )
                        ) {
                          void asset.removeAccount(account.id);
                        }
                      }}
                    >
                      통장 삭제
                    </StMenuItem>
                  </StMenu>
                </>
              ) : null}
            </StRowActions>
          </StAccountRight>
        </StAccountRow>

        {goal > 0 ? (
          <StGoalWrap>
            <StGoalBar>
              <StGoalFill style={{ width: `${progress}%` }} />
            </StGoalBar>
            <StGoalMeta>
              <span>
                올해 {mask(yearInflow)} / 목표 {mask(goal)}
              </span>
              <strong>{progress.toFixed(0)}%</strong>
            </StGoalMeta>
          </StGoalWrap>
        ) : null}

        {isExpanded ? (
          <StHistory>
            {history.length === 0 ? (
              <StHistoryEmpty>변동내역이 없어요.</StHistoryEmpty>
            ) : (
              history.map((change) => (
                <StHistoryRow key={change.id}>
                  <StHistoryMeta>
                    <StHistoryType $type={change.changeType}>
                      {CHANGE_TYPE_LABEL[change.changeType]}
                    </StHistoryType>
                    <span>{change.date}</span>
                    {change.memo ? <em>{change.memo}</em> : null}
                  </StHistoryMeta>
                  <StHistoryRight>
                    <StHistoryAmount $negative={change.amount < 0}>
                      {maskSigned(change.amount)}
                    </StHistoryAmount>
                    <StHistoryDelete
                      type="button"
                      aria-label="변동내역 삭제"
                      onClick={async () => {
                        if (await openConfirm("이 변동내역을 삭제할까요?")) {
                          void asset.removeChange(change.id);
                        }
                      }}
                    >
                      ×
                    </StHistoryDelete>
                  </StHistoryRight>
                </StHistoryRow>
              ))
            )}
          </StHistory>
        ) : null}
      </StAccountBlock>
    );
  };

  return (
    <StWrap>
      <StHeader>
        <div>
          <StTitle>자산</StTitle>
          <StSubTitle>통장별 잔액과 올해 축적 흐름을 관리해요.</StSubTitle>
        </div>
        <StHeaderActions>
          {asset.activeAccounts.length >= 2 ? (
            <StGhostButton type="button" onClick={() => setTransferOpen(true)}>
              이체
            </StGhostButton>
          ) : null}
          <StPrimaryButton
            type="button"
            onClick={() =>
              setAccountModal({ name: "", kind: "예금", goalAmount: 0 })
            }
          >
            + 통장 추가
          </StPrimaryButton>
        </StHeaderActions>
      </StHeader>

      <StTotalRow>
        <div>
          <StTotalLabel>총 자산</StTotalLabel>
          <StTotalValue>{mask(asset.totalBalance)}</StTotalValue>
        </div>
        <StYearNet $positive={yearNet >= 0}>
          올해 {maskSigned(yearNet)} 축적
        </StYearNet>
      </StTotalRow>

      <StMiniChart>
        {yearRows.map((row) => {
          const height =
            row.monthly === 0
              ? 3
              : Math.max((Math.abs(row.monthly) / maxMonthly) * 34, 4);
          return (
            <StMiniBarCol
              key={row.monthNumber}
              title={`${row.monthLabel} ${maskSigned(row.monthly)}`}
            >
              <StMiniBar
                style={{ height: `${height}px` }}
                $negative={row.monthly < 0}
                $current={row.monthNumber === new Date().getMonth() + 1}
              />
              <StMiniBarLabel>{row.monthNumber}</StMiniBarLabel>
            </StMiniBarCol>
          );
        })}
      </StMiniChart>

      <StAccountList>
        {asset.isLoading ? (
          <StEmpty>불러오는 중…</StEmpty>
        ) : asset.activeAccounts.length === 0 ? (
          <StEmpty>
            아직 통장이 없어요. “통장 추가”로 첫 통장을 만들어보세요.
          </StEmpty>
        ) : (
          kindGroups.map((group) => {
            // 통장이 많아 목록이 길어지므로 그룹 아코디언은 기본 닫힘으로 시작한다.
            const collapsed = collapsedKinds[group.kind] ?? true;
            return (
              <StKindSection key={group.kind}>
                <StKindSectionHeader
                  type="button"
                  onClick={() => toggleKindCollapsed(group.kind, collapsed)}
                  aria-expanded={!collapsed}
                >
                  <strong>{group.kind}</strong>
                  <span>{group.accounts.length}개</span>
                  <em>{mask(group.total)}</em>
                  <StKindCaret $open={!collapsed} aria-hidden>
                    <ChevronRightRoundedIcon fontSize="inherit" />
                  </StKindCaret>
                </StKindSectionHeader>
                {!collapsed
                  ? group.accounts.map((account) => renderAccountBlock(account))
                  : null}
              </StKindSection>
            );
          })
        )}
      </StAccountList>

      {accountModal ? (
        <AccountModal
          initial={accountModal}
          onClose={() => setAccountModal(null)}
          onSave={async (name, kind, goalAmount) => {
            await asset.saveAccount({
              id: accountModal.id,
              name,
              kind,
              goalAmount,
            });
            setAccountModal(null);
          }}
        />
      ) : null}

      {changeModal ? (
        <ChangeModal
          accountName={
            asset.activeAccounts.find((a) => a.id === changeModal.accountId)
              ?.name || "통장"
          }
          changeType={changeModal.changeType}
          onClose={() => setChangeModal(null)}
          onSave={async (amount, date, memo) => {
            const signed =
              changeModal.changeType === "withdraw" ? -Math.abs(amount) : amount;
            await asset.addChange({
              accountId: changeModal.accountId,
              amount: signed,
              date,
              changeType: changeModal.changeType,
              memo,
            });
            setChangeModal(null);
          }}
        />
      ) : null}

      {transferOpen ? (
        <TransferModal
          accounts={asset.activeAccounts.map((a) => ({
            id: a.id,
            name: a.name,
          }))}
          onClose={() => setTransferOpen(false)}
          onSave={async (fromId, toId, amount, date, memo) => {
            await asset.transfer({
              fromAccountId: fromId,
              toAccountId: toId,
              amount,
              date,
              memo,
            });
            setTransferOpen(false);
          }}
        />
      ) : null}
    </StWrap>
  );
}

// ── 통장 추가/수정 모달 ────────────────────────────────────────────────────
function AccountModal({
  initial,
  onClose,
  onSave,
}: {
  initial: { id?: string; name: string; kind: string; goalAmount: number };
  onClose: () => void;
  onSave: (
    name: string,
    kind: string,
    goalAmount: number,
  ) => void | Promise<void>;
}) {
  const [name, setName] = useState(initial.name);
  const [kind, setKind] = useState(initial.kind);
  const [goal, setGoal] = useState(
    initial.goalAmount > 0 ? initial.goalAmount.toLocaleString() : "",
  );
  const goalNumeric = Number(goal.replace(/,/g, "")) || 0;
  return (
    <StModalBackdrop onClick={onClose}>
      <StModal onClick={(event) => event.stopPropagation()}>
        <StModalTitle>{initial.id ? "통장 수정" : "통장 추가"}</StModalTitle>
        <StField>
          <label>통장 이름</label>
          <StInput
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="예: 국민 적금, 토스 CMA"
            autoFocus
          />
        </StField>
        <StField>
          <label>종류</label>
          <StChipRow>
            {KIND_OPTIONS.map((option) => (
              <StChip
                key={option}
                type="button"
                $active={kind === option}
                onClick={() => setKind(option)}
              >
                {option}
              </StChip>
            ))}
          </StChipRow>
        </StField>
        <StField>
          <label>목표금액 (선택)</label>
          <StInput
            inputMode="numeric"
            value={goal}
            onChange={(event) =>
              setGoal(
                event.target.value.replace(/[^\d]/g, "")
                  ? Number(
                      event.target.value.replace(/[^\d]/g, ""),
                    ).toLocaleString()
                  : "",
              )
            }
            placeholder="예: 3,000,000"
          />
        </StField>
        <StModalActions>
          <StGhostButton type="button" onClick={onClose}>
            취소
          </StGhostButton>
          <StPrimaryButton
            type="button"
            disabled={!name.trim()}
            onClick={() => void onSave(name, kind, goalNumeric)}
          >
            저장
          </StPrimaryButton>
        </StModalActions>
      </StModal>
    </StModalBackdrop>
  );
}

// ── 입금/출금/초기잔액 모달 ─────────────────────────────────────────────────
function ChangeModal({
  accountName,
  changeType,
  onClose,
  onSave,
}: {
  accountName: string;
  changeType: AssetChangeType;
  onClose: () => void;
  onSave: (amount: number, date: string, memo: string) => void | Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [memo, setMemo] = useState("");
  const numeric = Number(amount.replace(/,/g, ""));
  const valid = Number.isFinite(numeric) && numeric > 0;
  return (
    <StModalBackdrop onClick={onClose}>
      <StModal onClick={(event) => event.stopPropagation()}>
        <StModalTitle>
          {accountName} · {CHANGE_TYPE_LABEL[changeType]}
        </StModalTitle>
        <StField>
          <label>금액</label>
          <StInput
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, "");
              setAmount(digits ? Number(digits).toLocaleString("ko-KR") : "");
            }}
            placeholder="예: 500000"
            autoFocus
          />
        </StField>
        <StField>
          <label>날짜</label>
          <StInput
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </StField>
        <StField>
          <label>메모 (선택)</label>
          <StInput
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="예: 월 적립"
          />
        </StField>
        <StModalActions>
          <StGhostButton type="button" onClick={onClose}>
            취소
          </StGhostButton>
          <StPrimaryButton
            type="button"
            disabled={!valid}
            onClick={() => void onSave(numeric, date, memo)}
          >
            저장
          </StPrimaryButton>
        </StModalActions>
      </StModal>
    </StModalBackdrop>
  );
}

// ── 이체 모달 ──────────────────────────────────────────────────────────────
function TransferModal({
  accounts,
  onClose,
  onSave,
}: {
  accounts: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSave: (
    fromId: string,
    toId: string,
    amount: number,
    date: string,
    memo: string,
  ) => void | Promise<void>;
}) {
  const [fromId, setFromId] = useState(accounts[0]?.id || "");
  const [toId, setToId] = useState(accounts[1]?.id || "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [memo, setMemo] = useState("");
  const numeric = Number(amount.replace(/,/g, ""));
  const valid =
    fromId && toId && fromId !== toId && Number.isFinite(numeric) && numeric > 0;
  return (
    <StModalBackdrop onClick={onClose}>
      <StModal onClick={(event) => event.stopPropagation()}>
        <StModalTitle>이체</StModalTitle>
        <StField>
          <label>보내는 통장</label>
          <StSelect
            value={fromId}
            onChange={(event) => setFromId(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </StSelect>
        </StField>
        <StField>
          <label>받는 통장</label>
          <StSelect
            value={toId}
            onChange={(event) => setToId(event.target.value)}
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </StSelect>
        </StField>
        {fromId && toId && fromId === toId ? (
          <StHint>보내는 통장과 받는 통장이 같아요.</StHint>
        ) : null}
        <StField>
          <label>금액</label>
          <StInput
            inputMode="numeric"
            value={amount}
            onChange={(event) => {
              const digits = event.target.value.replace(/[^\d]/g, "");
              setAmount(digits ? Number(digits).toLocaleString("ko-KR") : "");
            }}
            placeholder="예: 300000"
          />
        </StField>
        <StField>
          <label>날짜</label>
          <StInput
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </StField>
        <StField>
          <label>메모 (선택)</label>
          <StInput
            value={memo}
            onChange={(event) => setMemo(event.target.value)}
            placeholder="예: 적금 이체"
          />
        </StField>
        <StModalActions>
          <StGhostButton type="button" onClick={onClose}>
            취소
          </StGhostButton>
          <StPrimaryButton
            type="button"
            disabled={!valid}
            onClick={() => void onSave(fromId, toId, numeric, date, memo)}
          >
            이체
          </StPrimaryButton>
        </StModalActions>
      </StModal>
    </StModalBackdrop>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────
const StWrap = styled.section`
  border: 1px solid #e9eaec;
  border-radius: 18px;
  background: #fdfdfe;
  padding: 1rem 1.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`;

const StHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.8rem;
`;

const StTitle = styled.h3`
  font-size: 1.02rem;
  font-weight: 900;
  color: #2b3441;
`;

const StSubTitle = styled.p`
  margin-top: 0.15rem;
  font-size: 0.76rem;
  color: #868a92;
`;

const StHeaderActions = styled.div`
  display: flex;
  gap: 0.4rem;
  flex-shrink: 0;
`;

const StPrimaryButton = styled.button`
  border: none;
  border-radius: 999px;
  background: #3182f6;
  color: #ffffff;
  padding: 0.42rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    background: #c3d4f2;
    cursor: default;
  }
`;

const StGhostButton = styled.button`
  border: 1px solid #dfe1e4;
  border-radius: 999px;
  background: #ffffff;
  color: #5a606a;
  padding: 0.42rem 0.85rem;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
`;

const StTotalRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.8rem;
`;

const StTotalLabel = styled.p`
  font-size: 0.76rem;
  color: #868a92;
  font-weight: 700;
`;

const StTotalValue = styled.p`
  margin-top: 0.1rem;
  font-size: 1.5rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: #222b36;
`;

const StYearNet = styled.span<{ $positive: boolean }>`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ $positive }) => ($positive ? "#3182f6" : "#f04452")};
`;

const StMiniChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.28rem;
  height: 46px;
  padding: 0 0.1rem;
`;

const StMiniBarCol = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
`;

const StMiniBar = styled.div<{ $negative: boolean; $current: boolean }>`
  width: 100%;
  max-width: 14px;
  border-radius: 4px 4px 2px 2px;
  background: ${({ $negative, $current }) =>
    $negative ? "#f3b0b6" : $current ? "#3182f6" : "#bcd3f8"};
`;

const StMiniBarLabel = styled.span`
  font-size: 0.56rem;
  color: #a2a6ad;
`;

const StAccountList = styled.div`
  display: flex;
  flex-direction: column;
`;

const StKindSection = styled.div`
  border-top: 1px solid #e5e7ea;

  &:first-child {
    border-top: none;
  }
`;

const StKindSectionHeader = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: none;
  background: transparent;
  padding: 0.7rem 0.15rem 0.5rem;
  text-align: left;
  cursor: pointer;

  strong {
    font-size: 1rem;
    font-weight: 900;
    color: #1f2733;
  }

  span {
    font-size: 0.72rem;
    color: #a2a6ad;
    font-weight: 700;
  }

  em {
    margin-left: auto;
    font-style: normal;
    font-size: 0.95rem;
    font-weight: 900;
    color: #3a424d;
    white-space: nowrap;
  }
`;

const StKindCaret = styled.span<{ $open: boolean }>`
  && {
    font-size: 1.15rem;
  }
  display: inline-flex;
  align-items: center;
  color: #9aa0a8;
  transition: transform 0.15s ease;
  transform: rotate(${({ $open }) => ($open ? "90deg" : "0deg")});
`;

const StEmpty = styled.p`
  font-size: 0.82rem;
  color: #8a8e95;
  line-height: 1.5;
  padding: 0.8rem 0.1rem;
`;

const StAccountBlock = styled.div`
  border-top: 1px solid #eef0f2;

  &:first-child {
    border-top: none;
  }
`;

const StGoalWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
  padding: 0 0.15rem 0.6rem;
`;

const StGoalBar = styled.div`
  height: 0.4rem;
  border-radius: 999px;
  background: #eceef1;
  overflow: hidden;
`;

const StGoalFill = styled.div`
  height: 100%;
  border-radius: inherit;
  background: #3182f6;
`;

const StGoalMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  span {
    font-size: 0.72rem;
    color: #8a8e95;
    font-weight: 700;
  }

  strong {
    font-size: 0.74rem;
    color: #3182f6;
    font-weight: 900;
  }
`;

const StAccountRow = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.7rem 0.15rem;
  text-align: left;
  cursor: pointer;
`;

const StAccountMain = styled.div`
  min-width: 0;
  display: flex;
  align-items: baseline;
  gap: 0.45rem;

  strong {
    font-size: 0.84rem;
    font-weight: 500;
    color: #4a515c;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  span {
    font-size: 0.7rem;
    color: #a9b0ba;
    flex-shrink: 0;
  }
`;

const StAccountRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  flex-shrink: 0;
`;

const StBalance = styled.span`
  font-size: 0.86rem;
  font-weight: 700;
  color: #3a424d;
  white-space: nowrap;
`;

const StRowActions = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.3rem;
`;

const StRowButton = styled.button`
  border: 1px solid #d3e3fb;
  background: #eef5fe;
  color: #3182f6;
  border-radius: 999px;
  padding: 0.22rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;
`;

const StPortfolioButton = styled.button`
  width: 1.6rem;
  height: 1.6rem;
  border: 1px solid #e6e7e9;
  background: #ffffff;
  border-radius: 999px;
  font-size: 0.85rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const StKebab = styled.button`
  width: 1.6rem;
  height: 1.6rem;
  border: 1px solid #e6e7e9;
  background: #ffffff;
  color: #6b6f77;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 900;
  line-height: 1;
  cursor: pointer;
`;

const StMenuBackdrop = styled.button`
  position: fixed;
  inset: 0;
  z-index: 40;
  border: none;
  background: transparent;
  cursor: default;
`;

const StMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.3rem);
  right: 0;
  z-index: 41;
  min-width: 8.5rem;
  display: flex;
  flex-direction: column;
  padding: 0.3rem;
  border: 1px solid #e9eaec;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 12px 28px rgba(26, 34, 49, 0.14);
`;

const StMenuItem = styled.button<{ $danger?: boolean }>`
  border: none;
  background: transparent;
  color: ${({ $danger }) => ($danger ? "#f04452" : "#3a3f47")};
  border-radius: 8px;
  padding: 0.5rem 0.6rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${({ $danger }) => ($danger ? "#fef2f3" : "#f4f5f7")};
  }
`;

const StHistory = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0 0.15rem 0.6rem;
`;

const StHistoryEmpty = styled.p`
  font-size: 0.76rem;
  color: #9aa0a8;
  padding: 0.3rem 0.1rem 0.5rem;
`;

const StHistoryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  padding: 0.42rem 0.35rem;
  border-top: 1px dashed #eef0f2;
`;

const StHistoryMeta = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;

  span {
    font-size: 0.74rem;
    color: #8a8e95;
  }

  em {
    font-style: normal;
    font-size: 0.74rem;
    color: #a2a6ad;
  }
`;

const StHistoryType = styled.span<{ $type: AssetChangeType }>`
  && {
    font-size: 0.7rem;
    font-weight: 800;
    color: ${({ $type }) =>
      $type === "withdraw" || $type === "transfer_out"
        ? "#c0808a"
        : "#5b83c4"};
  }
`;

const StHistoryRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
`;

const StHistoryAmount = styled.span<{ $negative: boolean }>`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ $negative }) => ($negative ? "#e0554f" : "#333d4b")};
  white-space: nowrap;
`;

const StHistoryDelete = styled.button`
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

const StModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 120;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(24, 25, 26, 0.34);
`;

const StModal = styled.div`
  width: min(360px, 100%);
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  border-radius: 18px;
  background: #ffffff;
  padding: 1.1rem;
  box-shadow: 0 20px 40px rgba(26, 34, 49, 0.22);
`;

const StModalTitle = styled.h4`
  font-size: 0.98rem;
  font-weight: 900;
  color: #2b3441;
`;

const StField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.32rem;

  label {
    font-size: 0.76rem;
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

const StSelect = styled.select`
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #e2e3e5;
  border-radius: 12px;
  padding: 0.6rem 0.7rem;
  font-size: 0.9rem;
  color: #222b36;
  background: #ffffff;
`;

const StChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
`;

const StChip = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#3182f6" : "#e2e3e5")};
  background: ${({ $active }) => ($active ? "#e8f2fe" : "#ffffff")};
  color: ${({ $active }) => ($active ? "#3182f6" : "#6a6f78")};
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 800;
  cursor: pointer;
`;

const StHint = styled.p`
  font-size: 0.74rem;
  color: #f04452;
  font-weight: 700;
`;

const StModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.45rem;
  margin-top: 0.3rem;
`;
