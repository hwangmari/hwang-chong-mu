"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { useModal } from "@/components/common/ModalProvider";
import {
  CATEGORY_OPTIONS,
  createEntryId,
} from "@/app/account-book/components/WorkspaceLedgerView/utils";
import { upsertAccountBookEntry } from "@/app/account-book/repository";
import type { AccountEntry } from "@/app/account-book/types";
import {
  createWorkoutId,
  upsertActivityRecord,
} from "@/app/workout/repository";
import {
  fetchTodayHabitItems,
  setHabitItemToday,
  upsertTodayDietWeight,
  type QuickHabitItem,
} from "@/services/quickActions";

// 위젯 우클릭 "빠른 등록" 모달: 서비스별 대표 기능 하나를 이동 없이 바로 등록한다.
// - 가계부: 오늘 지출 / 운동: 오늘 활동 / 습관: 오늘 체크 / 다이어트: 오늘 몸무게

export type QuickService = "account-book" | "workout" | "habit" | "diet";

export const QUICK_ACTION_META: Record<
  QuickService,
  { label: string; title: string }
> = {
  "account-book": { label: "💰 오늘 지출 바로 기록", title: "오늘 지출 기록" },
  workout: { label: "🏃 오늘 활동 바로 기록", title: "오늘 활동 기록" },
  habit: { label: "🌱 오늘 습관 체크", title: "오늘 습관 체크" },
  diet: { label: "⚖️ 오늘 몸무게 기록", title: "오늘 몸무게 기록" },
};

export default function QuickActionModal({
  service,
  resourceRef,
  onClose,
  onSaved,
}: {
  service: QuickService;
  resourceRef: Record<string, unknown>;
  onClose: () => void;
  // 등록 성공 시 호출 — 부모에서 위젯을 새로고침한다
  onSaved: () => void;
}) {
  const { openAlert } = useModal();
  const [saving, setSaving] = useState(false);

  // 가계부
  const [amount, setAmount] = useState("");
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("생활비");

  // 운동
  const [activityName, setActivityName] = useState("");
  const [durationMin, setDurationMin] = useState("");

  // 다이어트
  const [weight, setWeight] = useState("");

  // 습관
  const [habitItems, setHabitItems] = useState<QuickHabitItem[] | null>(null);
  const [habitTouched, setHabitTouched] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (service !== "habit") return;
    let active = true;
    void (async () => {
      try {
        const items = await fetchTodayHabitItems(
          String(resourceRef.goalId ?? ""),
        );
        if (active) setHabitItems(items);
      } catch {
        if (active) setHabitItems([]);
      }
    })();
    return () => {
      active = false;
    };
    // 모달 오픈 시 1회 로드
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [service]);

  const finish = async (message: string) => {
    onSaved();
    onClose();
    await openAlert(message);
  };

  const saveAccountBook = async () => {
    const activeUserId = String(resourceRef.activeUserId ?? "");
    const workspaceId = String(resourceRef.workspaceId ?? "");
    const parsedAmount = parseInt(amount.replace(/[^0-9]/g, ""), 10);
    if (!workspaceId || !activeUserId) {
      await openAlert("가계부 연결 정보를 찾을 수 없어요. 연결을 다시 확인해주세요.");
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      await openAlert("금액을 숫자로 입력해주세요!");
      return;
    }
    if (!item.trim()) {
      await openAlert("내용을 입력해주세요!");
      return;
    }
    const entry: AccountEntry = {
      id: createEntryId(),
      date: today,
      workspaceId,
      createdByUserId: activeUserId,
      type: "expense",
      category,
      item: item.trim(),
      amount: parsedAmount,
      cardCompany: "",
      payment: "card",
      memo: "",
    };
    setSaving(true);
    try {
      await upsertAccountBookEntry(entry, activeUserId);
      await finish("지출이 등록되었습니다! 💰");
    } catch {
      await openAlert("등록에 실패했습니다 ㅠㅠ 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const saveWorkout = async () => {
    const roomId = String(resourceRef.roomId ?? "");
    if (!roomId) {
      await openAlert("운동방 연결 정보를 찾을 수 없어요. 연결을 다시 확인해주세요.");
      return;
    }
    if (!activityName.trim()) {
      await openAlert("활동명을 입력해주세요!");
      return;
    }
    const parsedDuration = parseInt(durationMin, 10);
    setSaving(true);
    try {
      await upsertActivityRecord({
        id: createWorkoutId("act"),
        roomId,
        date: today,
        activityName: activityName.trim(),
        durationMin:
          !isNaN(parsedDuration) && parsedDuration > 0
            ? parsedDuration
            : undefined,
      });
      await finish("오늘 활동이 기록되었습니다! 🏃");
    } catch {
      await openAlert("등록에 실패했습니다 ㅠㅠ 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const saveDiet = async () => {
    const goalId = String(resourceRef.goalId ?? "");
    const parsed = parseFloat(weight);
    if (!goalId) {
      await openAlert("다이어트 연결 정보를 찾을 수 없어요. 연결을 다시 확인해주세요.");
      return;
    }
    if (isNaN(parsed) || parsed <= 0) {
      await openAlert("몸무게를 숫자로 입력해주세요!");
      return;
    }
    setSaving(true);
    try {
      await upsertTodayDietWeight(goalId, String(parsed));
      await finish("오늘 몸무게가 기록되었습니다! ⚖️");
    } catch {
      await openAlert("등록에 실패했습니다 ㅠㅠ 잠시 후 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const toggleHabit = async (target: QuickHabitItem) => {
    // 즉시 반영(낙관적) 후 실패 시 롤백
    setHabitItems(
      (prev) =>
        prev?.map((entry) =>
          entry.id === target.id ? { ...entry, done: !entry.done } : entry,
        ) ?? null,
    );
    setHabitTouched(true);
    try {
      await setHabitItemToday(target.id, !target.done);
    } catch {
      setHabitItems(
        (prev) =>
          prev?.map((entry) =>
            entry.id === target.id ? { ...entry, done: target.done } : entry,
          ) ?? null,
      );
      await openAlert("체크에 실패했습니다 ㅠㅠ 잠시 후 다시 시도해주세요.");
    }
  };

  const closeHabit = () => {
    if (habitTouched) onSaved();
    onClose();
  };

  const meta = QUICK_ACTION_META[service];

  return (
    <>
      <StOverlay onClick={service === "habit" ? closeHabit : onClose} />
      <StCard role="dialog" aria-label={meta.title}>
        <StTitle>{meta.title}</StTitle>
        <StDate>{today}</StDate>

        {service === "account-book" ? (
          <StForm>
            <StField>
              <StLabel>금액 (원)</StLabel>
              <StInput
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="예: 12000"
                inputMode="numeric"
                autoFocus
              />
            </StField>
            <StField>
              <StLabel>내용</StLabel>
              <StInput
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="예: 점심 김치찌개"
                maxLength={40}
              />
            </StField>
            <StField>
              <StLabel>카테고리</StLabel>
              <StSelect
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.icon} {option.label}
                  </option>
                ))}
              </StSelect>
            </StField>
            <StActions>
              <StButton type="button" onClick={onClose}>
                취소
              </StButton>
              <StButton
                type="button"
                $primary
                disabled={saving}
                onClick={saveAccountBook}
              >
                {saving ? "등록 중…" : "등록"}
              </StButton>
            </StActions>
          </StForm>
        ) : null}

        {service === "workout" ? (
          <StForm>
            <StField>
              <StLabel>활동명</StLabel>
              <StInput
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                placeholder="예: 저녁 산책, 등산"
                maxLength={30}
                autoFocus
              />
            </StField>
            <StField>
              <StLabel>시간 (분, 선택)</StLabel>
              <StInput
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
                placeholder="예: 40"
                inputMode="numeric"
              />
            </StField>
            <StActions>
              <StButton type="button" onClick={onClose}>
                취소
              </StButton>
              <StButton
                type="button"
                $primary
                disabled={saving}
                onClick={saveWorkout}
              >
                {saving ? "등록 중…" : "등록"}
              </StButton>
            </StActions>
          </StForm>
        ) : null}

        {service === "diet" ? (
          <StForm>
            <StField>
              <StLabel>오늘 아침(공복) 몸무게 (kg)</StLabel>
              <StInput
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="예: 58.4"
                inputMode="decimal"
                autoFocus
              />
            </StField>
            <StActions>
              <StButton type="button" onClick={onClose}>
                취소
              </StButton>
              <StButton
                type="button"
                $primary
                disabled={saving}
                onClick={saveDiet}
              >
                {saving ? "등록 중…" : "등록"}
              </StButton>
            </StActions>
          </StForm>
        ) : null}

        {service === "habit" ? (
          <StForm>
            {habitItems === null ? (
              <StHabitEmpty>불러오는 중…</StHabitEmpty>
            ) : habitItems.length === 0 ? (
              <StHabitEmpty>등록된 습관 항목이 없어요.</StHabitEmpty>
            ) : (
              <StHabitList>
                {habitItems.map((entry) => (
                  <StHabitItem key={entry.id}>
                    <StHabitCheck
                      type="checkbox"
                      checked={entry.done}
                      onChange={() => void toggleHabit(entry)}
                    />
                    <StHabitTitle $done={entry.done}>
                      {entry.title}
                    </StHabitTitle>
                  </StHabitItem>
                ))}
              </StHabitList>
            )}
            <StActions>
              <StButton type="button" $primary onClick={closeHabit}>
                완료
              </StButton>
            </StActions>
          </StForm>
        ) : null}
      </StCard>
    </>
  );
}

const StOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(0, 0, 0, 0.4);
`;

const StCard = styled.div`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 130;
  width: min(20rem, calc(100vw - 2rem));
  padding: 1.25rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 18px 40px -12px rgba(23, 43, 77, 0.45);
`;

const StTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StDate = styled.p`
  margin-top: 0.2rem;
  margin-bottom: 0.9rem;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
`;

const StField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const StLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StInput = styled.input`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StSelect = styled.select`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  font-size: 0.95rem;
  background: ${({ theme }) => theme.colors.white};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;

const StButton = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid
    ${({ $primary, theme }) =>
      $primary ? "transparent" : theme.colors.gray200};
  background: ${({ $primary, theme }) =>
    $primary ? theme.semantic.primary : theme.colors.white};
  color: ${({ $primary, theme }) =>
    $primary ? theme.colors.white : theme.colors.gray600};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;

const StHabitList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 14rem;
  overflow-y: auto;
`;

const StHabitItem = styled.label`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.7rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }
`;

const StHabitCheck = styled.input`
  width: 1.05rem;
  height: 1.05rem;
  accent-color: ${({ theme }) => theme.colors.teal600};
  cursor: pointer;
  flex-shrink: 0;
`;

const StHabitTitle = styled.span<{ $done: boolean }>`
  font-size: 0.92rem;
  font-weight: 600;
  color: ${({ $done, theme }) =>
    $done ? theme.colors.gray400 : theme.colors.gray800};
  text-decoration: ${({ $done }) => ($done ? "line-through" : "none")};
`;

const StHabitEmpty = styled.p`
  padding: 0.75rem 0.25rem;
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.gray400};
`;
