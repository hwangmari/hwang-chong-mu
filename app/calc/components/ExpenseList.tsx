"use client";
import {
  StSection,
  StSegmented,
  StSegmentButton,
} from "@/components/styled/layout.styled";
import { Expense } from "@/types";
import React, { useState, useMemo } from "react";
import styled from "styled-components";
import SectionTitle from "./ui/SectionTitle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useModal } from "@/components/common/ModalProvider";
import MoreMenu from "@/components/common/MoreMenu";

type ViewMode = "list" | "date";

const UNDATED = "날짜 없음";

/** 사용 내역 앞의 "11/14 " 같은 날짜를 떼어 낸다. 날짜가 없으면 key 는 null */
function splitDate(description: string) {
  const m = description.match(/^(\d{1,2})\/(\d{1,2})\s+(.*)$/);
  if (!m) return { key: null, month: 0, day: 0, rest: description };
  return { key: `${+m[1]}/${+m[2]}`, month: +m[1], day: +m[2], rest: m[3] };
}

const WEEKDAYS = "일월화수목금토";
/** order(= 월*100+일)로 요일. 연도는 정보가 없어 올해로 본다 */
function weekdayOf(order: number) {
  const d = new Date(
    new Date().getFullYear(),
    Math.floor(order / 100) - 1,
    order % 100,
  );
  return WEEKDAYS[d.getDay()];
}

const sumAmount = (items: Expense[]) =>
  items.reduce((acc, cur) => acc + cur.amount, 0);

interface Props {
  expenses: Expense[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, amount: number) => void;
  onToggleType: (id: number) => void;
}

export default function ExpenseList({
  expenses,
  onDelete,
  onUpdate,
  onToggleType,
}: Props) {
  const { openAlert } = useModal();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const groupedExpenses = useMemo(() => {
    const groups: { [key: string]: Expense[] } = {};
    expenses.forEach((e) => {
      if (!groups[e.payer]) groups[e.payer] = [];
      groups[e.payer].push(e);
    });
    return groups;
  }, [expenses]);

  // 날짜별 보기: 날짜 없는 내역(항공·숙소 등)을 맨 앞에, 나머지는 날짜 순
  const dateGroups = useMemo(() => {
    const map = new Map<
      string,
      { key: string; order: number; items: Expense[] }
    >();
    expenses.forEach((e) => {
      const { key, month, day } = splitDate(e.description);
      const k = key ?? UNDATED;
      if (!map.has(k)) {
        map.set(k, { key: k, order: key ? month * 100 + day : -1, items: [] });
      }
      map.get(k)!.items.push(e);
    });
    return [...map.values()].sort((a, b) => a.order - b.order);
  }, [expenses]);

  // 개인 지출은 목록에는 그대로 보이고, 정산(1/N)에서만 빠진다
  const personalTotal = useMemo(
    () => sumAmount(expenses.filter((e) => e.type === "PERSONAL")),
    [expenses],
  );

  const currentTotal = useMemo(() => {
    return expenses.reduce((acc, cur) => acc + cur.amount, 0);
  }, [expenses]);

  const startEditing = (id: number, currentAmount: number) => {
    setEditingId(id);
    setEditAmount(currentAmount.toString());
  };

  const saveEditing = async (id: number) => {
    const parsedAmount = Number(editAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      await openAlert("금액은 0보다 큰 숫자여야 합니다.");
      return;
    }
    if (!Number.isInteger(parsedAmount)) {
      await openAlert("금액은 정수로 입력해주세요.");
      return;
    }
    onUpdate(id, parsedAmount);
    setEditingId(null);
  };

  /** 한 줄(내역 + 금액 + 수정/삭제). 날짜별 보기에서는 낸 사람 배지를 붙이고 날짜를 뗀 이름을 쓴다 */
  const renderRow = (e: Expense, showPayer = false, label?: string) => (
    <StListItem key={e.id} $isPersonal={e.type === "PERSONAL"}>
      <div className="row-main">
        <div className="content">
          {showPayer && <StPayerBadge>{e.payer}</StPayerBadge>}
          <span className="desc">{label ?? e.description}</span>
          {e.type === "PERSONAL" && <StGrayBadge>개인</StGrayBadge>}
        </div>

        <StRightSection>
          {editingId === e.id ? (
            <>
              <input
                type="text"
                value={editAmount}
                autoFocus
                onChange={(ev) => setEditAmount(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === "Enter") saveEditing(e.id);
                  if (ev.key === "Escape") setEditingId(null);
                }}
              />
              <span className="unit">원</span>
              <StFixedBtnGroup>
                <button onClick={() => saveEditing(e.id)}>완료</button>
                <span className="divider">|</span>
                <button onClick={() => setEditingId(null)}>취소</button>
              </StFixedBtnGroup>
            </>
          ) : (
            <>
              <span className="amount">{e.amount.toLocaleString()}원</span>
              <MoreMenu
                label={`${e.description} 더보기`}
                items={[
                  {
                    key: "edit",
                    label: "금액 수정",
                    onClick: () => startEditing(e.id, e.amount),
                  },
                  {
                    key: "type",
                    label:
                      e.type === "PERSONAL"
                        ? "공통으로 바꾸기 (같이 나눔)"
                        : "개인으로 바꾸기 (정산 제외)",
                    onClick: () => onToggleType(e.id),
                  },
                  {
                    key: "delete",
                    label: "삭제",
                    danger: true,
                    onClick: () => onDelete(e.id),
                  },
                ]}
              />
            </>
          )}
        </StRightSection>
      </div>
    </StListItem>
  );

  if (expenses.length === 0) return null;

  return (
    <StSection>
      <StHeaderRow
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: "pointer" }}
      >
        <SectionTitle>
          <StTitleContent>
            🧾 지출 목록
            <StChevronIcon $expanded={isExpanded} />
          </StTitleContent>
        </SectionTitle>
        <StTotalText>
          <span>
            Total <strong>{currentTotal.toLocaleString()}</strong>원
          </span>
          {personalTotal > 0 && (
            <small>
              개인 {personalTotal.toLocaleString()}원 빼고 나눔{" "}
              {(currentTotal - personalTotal).toLocaleString()}원
            </small>
          )}
        </StTotalText>
      </StHeaderRow>

      {isExpanded && (
        <>
          <StViewSwitch role="tablist" aria-label="지출 목록 보기 방식">
            {(
              [
                ["list", "목록"],
                ["date", "날짜별"],
              ] as const
            ).map(([mode, text]) => (
              <StSegmentButton
                key={mode}
                type="button"
                role="tab"
                aria-selected={viewMode === mode}
                $active={viewMode === mode}
                onClick={() => setViewMode(mode)}
              >
                {text}
              </StSegmentButton>
            ))}
          </StViewSwitch>

          {viewMode === "list" ? (
            <StGroupContainer>
              {Object.entries(groupedExpenses).map(([payer, items]) => (
                <div key={payer}>
                  <StPayerHeader>
                    <span className="name">{payer}</span>
                    <span className="subtotal">
                      {items
                        .reduce((acc, cur) => acc + cur.amount, 0)
                        .toLocaleString()}
                      원
                    </span>
                  </StPayerHeader>

                  <StList>{items.map((e) => renderRow(e))}</StList>
                </div>
              ))}
            </StGroupContainer>
          ) : (
            <StCalendar aria-label="날짜별 지출 달력">
              {dateGroups.map((g) => (
                <StDayCell key={g.key} $wide={g.order < 0}>
                  <StDayHead>
                    <span className="d">
                      {g.key}
                      {g.order >= 0 && <small>{weekdayOf(g.order)}</small>}
                    </span>
                    <span className="sum">
                      {sumAmount(g.items).toLocaleString()}원
                    </span>
                    <span className="count">{g.items.length}건</span>
                  </StDayHead>
                  <StList>
                    {g.items.map((e) =>
                      renderRow(e, true, splitDate(e.description).rest),
                    )}
                  </StList>
                </StDayCell>
              ))}
            </StCalendar>
          )}
        </>
      )}
    </StSection>
  );
}

const StHeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};

  &:hover h2 {
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StTitleContent = styled.span`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s;
`;

const StChevronIcon = styled(ExpandMoreIcon)<{ $expanded: boolean }>`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray400};
  transform: ${({ $expanded }) =>
    $expanded ? "rotate(0deg)" : "rotate(-90deg)"};
  transition: transform 0.2s;
`;

const StTotalText = styled.span`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.9rem;
  small {
    margin-top: 0.15rem;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray400};
    font-variant-numeric: tabular-nums;
  }
  color: ${({ theme }) => theme.colors.gray500};
  strong {
    color: ${({ theme }) => theme.colors.gray900};
    font-weight: 700;
    font-size: 1.05rem;
    margin-left: 0.25rem;
  }
`;

/* 보기 전환: 전체 폭으로 늘어나지 않게 폭을 제한하고, 아래 목록과 간격을 둔다 */
const StViewSwitch = styled(StSegmented)`
  width: min(100%, 20rem);
  margin-bottom: 1.25rem;
`;

/* 날짜 칸: 넓은 화면은 최대 2칸씩 줄바꿈, 폰은 1칸. 같은 줄 두 칸은 높이를 맞춘다 */
const StCalendar = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
  }
`;

/* '날짜 없음'(미리 낸 비용)은 첫 줄 전체를 쓰고, 날짜 칸들이 그 아래 2칸씩 */
const StDayCell = styled.section<{ $wide: boolean }>`
  min-width: 0;
  grid-column: ${({ $wide }) => ($wide ? "1 / -1" : "auto")};
  display: flex;
  flex-direction: column;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.semantic.bg};
  padding: 0.75rem 0.8rem 0.4rem;
`;

const StDayHead = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: baseline;
  row-gap: 0.1rem;
  padding-bottom: 0.5rem;
  margin-bottom: 0.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};

  .d {
    font-size: 1rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
    small {
      margin-left: 0.3rem;
      font-size: 0.78rem;
      font-weight: 700;
      color: ${({ theme }) => theme.semantic.subText};
    }
  }
  .sum {
    font-size: 0.9rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: ${({ theme }) => theme.semantic.text};
  }
  .count {
    grid-column: 1 / -1;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;

const StPayerBadge = styled.span`
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.05rem 0.35rem;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray600};
`;

const StGroupContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const StPayerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;

  .name {
    font-size: 1rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray800};
    position: relative;
    padding-left: 0.75rem;
    &::before {
      content: "";
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 4px;
      height: 4px;
      background-color: ${({ theme }) => theme.colors.gray400};
      border-radius: 50%;
    }
  }
  .count {
    margin-left: 0.4rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.gray400};
  }
  .subtotal {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.gray500};
    font-weight: 500;
  }
`;

const StList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
`;

const StListItem = styled.li<{ $isPersonal: boolean }>`
  margin-left: 0.7rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
  background-color: transparent;
  color: ${({ theme, $isPersonal }) =>
    $isPersonal ? theme.colors.gray400 : theme.colors.gray800};

  &:last-child {
    border-bottom: none;
  }

  .row-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    min-height: 1.5rem; /* 최소 높이 고정(수정 입력칸으로 바뀌어도 덜컥이지 않게) */
  }

  .content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    overflow: hidden;
    /* 긴 이름은 두 줄까지 보여 주고 그 뒤만 '…' */
    .desc {
      font-size: 0.95rem;
      line-height: 1.35;
      word-break: keep-all;
      overflow-wrap: anywhere;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
`;

const StRightSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  height: 1.65rem;

  .amount,
  .unit {
    font-weight: 600;
    font-size: 0.95rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    line-height: 1.5rem;
  }

  .unit {
    font-size: 0.9rem;
    color: ${({ theme }) => theme.colors.gray600};
    margin-right: 0.8rem; /* 버튼과 간격 */
    margin-left: 0.1rem;
  }

  .amount {
    margin-right: 0.8rem; /* 버튼과 간격 */
  }

  input {
    width: 70px;
    height: 1.5rem;
    padding: 0;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.gray800};
    border-radius: 0;
    text-align: right;
    font-size: 0.95rem;
    font-weight: 600;
    background: transparent;
    outline: none;
    font-family: inherit;

    &:focus {
      border-bottom-color: ${({ theme }) => theme.semantic.primary};
    }
  }
`;

const StGrayBadge = styled.span`
  font-size: 0.7rem;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  background-color: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: 500;
  flex-shrink: 0;
`;

const StFixedBtnGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.4rem;
  width: 60px; /* 고정 너비 */

  .divider {
    color: ${({ theme }) => theme.colors.gray300};
    font-size: 0.7rem;
  }

  button {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.gray400};
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
    white-space: nowrap;

    &:hover {
      color: ${({ theme }) => theme.colors.gray800};
      text-decoration: underline;
    }
  }
`;
