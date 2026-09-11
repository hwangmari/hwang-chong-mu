"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { StSegmentButton, StSegmented } from "@/components/styled/layout.styled";
import { computePaceSec, parseDurationInput, parseMinutesInput } from "../helpers";
import {
  createWorkoutId,
  upsertActivityRecord,
  upsertGymRecord,
  upsertRunningRecord,
} from "../repository";
import {
  ACTIVITY_PRESETS,
  GYM_BODY_PART_LABEL,
  RUNNING_TYPE_LABEL,
  type GymBodyPart,
  type RunningType,
} from "../types";

type QuickKind = "run" | "gym" | "activity";

const KIND_LABEL: Record<QuickKind, string> = {
  run: "🏃 러닝",
  gym: "🏋️ 헬스",
  activity: "🎾 활동",
};

const KIND_PATH: Record<QuickKind, string> = {
  run: "/workout/run",
  gym: "/workout/weight",
  activity: "/workout/activity",
};

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

// "2026-09-22" → "9월 22일 (화)"
function formatDateLine(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const weekday = WEEKDAY[new Date(y, m - 1, d).getDay()];
  return `${m}월 ${d}일 (${weekday})`;
}

// 저장에 실패했을 때 화면에 보여줄 문구.
// 서버가 돌려주는 우리말 안내는 그대로 쓰고, 네트워크 오류처럼
// 영어 원문("Failed to fetch")이 올라오면 쉬운 말로 바꿔 준다.
function saveErrorMessage(e: unknown): string {
  const raw = e instanceof Error ? e.message : "";
  if (/[가-힣]/.test(raw)) return raw;
  return "저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.";
}

type Props = {
  /** 클릭한 날짜 (YYYY-MM-DD) */
  date: string;
  roomId: string;
  onClose: () => void;
  /** 저장 성공 후 개요 화면의 기록을 다시 불러오는 함수 */
  onSaved: () => void | Promise<void>;
};

export default function QuickEntryModal({
  date,
  roomId,
  onClose,
  onSaved,
}: Props) {
  const router = useRouter();
  const [kind, setKind] = useState<QuickKind>("gym");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 러닝
  const [distanceKm, setDistanceKm] = useState("");
  const [durationInput, setDurationInput] = useState("");
  const [runType, setRunType] = useState<RunningType>("easy");
  // 헬스
  const [bodyPart, setBodyPart] = useState<GymBodyPart | "">("");
  const [gymMin, setGymMin] = useState("");
  // 활동
  const [activityName, setActivityName] = useState("");
  const [activityMin, setActivityMin] = useState("");
  // 공통
  const [memo, setMemo] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function switchKind(next: QuickKind) {
    setKind(next);
    setError("");
  }

  async function handleSave() {
    if (busy) return;
    setError("");

    if (kind === "run") {
      const km = Number(distanceKm);
      const durationSec = parseDurationInput(durationInput);
      if (!km || km <= 0) {
        setError("달린 거리를 km로 적어 주세요. 예: 5.2");
        return;
      }
      if (!durationSec) {
        setError("달린 시간을 적어 주세요. 예: 32:10");
        return;
      }
      setBusy(true);
      try {
        await upsertRunningRecord({
          id: createWorkoutId("run"),
          roomId,
          date,
          runType,
          environment: "outdoor",
          distanceKm: km,
          durationSec,
          avgPaceSec: computePaceSec(km, durationSec),
          memo: memo.trim() || undefined,
        });
        await onSaved();
        onClose();
      } catch (e) {
        setError(saveErrorMessage(e));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (kind === "gym") {
      const durationMin = parseMinutesInput(gymMin);
      if (!bodyPart && durationMin <= 0 && !memo.trim()) {
        setError("부위를 고르거나, 운동 시간이나 메모 중 하나를 적어 주세요.");
        return;
      }
      setBusy(true);
      try {
        await upsertGymRecord({
          id: createWorkoutId("gym"),
          roomId,
          date,
          bodyPart: bodyPart || undefined,
          durationMin: durationMin || undefined,
          // 빠른 기록은 "운동함"만 남긴다. 세부 종목은 자세히 입력에서.
          exercises: [],
          memo: memo.trim() || undefined,
        });
        await onSaved();
        onClose();
      } catch (e) {
        setError(saveErrorMessage(e));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (!activityName.trim()) {
      setError("무슨 운동을 했는지 적어 주세요. 예: 테니스");
      return;
    }
    setBusy(true);
    try {
      await upsertActivityRecord({
        id: createWorkoutId("activity"),
        roomId,
        date,
        activityName: activityName.trim(),
        durationMin: parseMinutesInput(activityMin) || undefined,
        memo: memo.trim() || undefined,
      });
      await onSaved();
      onClose();
    } catch (e) {
      setError(saveErrorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function goDetail() {
    router.push(`${KIND_PATH[kind]}?date=${date}`);
    onClose();
  }

  return (
    <StOverlay onClick={onClose} role="presentation">
      <StSheet
        role="dialog"
        aria-modal="true"
        aria-label="빠른 운동 기록"
        onClick={(e) => e.stopPropagation()}
      >
        <StHead>
          <StDateLine>{formatDateLine(date)}</StDateLine>
          <StCloseIcon type="button" onClick={onClose} aria-label="닫기">
            ✕
          </StCloseIcon>
        </StHead>

        <StBand>
          <StLabel as="span">종류</StLabel>
          <StSegmented role="group" aria-label="운동 종류">
            {(["run", "gym", "activity"] as QuickKind[]).map((k) => (
              <StSegmentButton
                key={k}
                type="button"
                $active={kind === k}
                onClick={() => switchKind(k)}
              >
                {KIND_LABEL[k]}
              </StSegmentButton>
            ))}
          </StSegmented>
        </StBand>

        {kind === "run" ? (
          <StBand>
            <StFieldRow>
              <StField>
                <StLabel htmlFor="quick-run-km">거리 (km)</StLabel>
                <StInput
                  id="quick-run-km"
                  type="text"
                  inputMode="decimal"
                  placeholder="5.2"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                />
              </StField>
              <StField>
                <StLabel htmlFor="quick-run-time">시간</StLabel>
                <StInput
                  id="quick-run-time"
                  type="text"
                  inputMode="decimal"
                  placeholder="32:10"
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                />
              </StField>
            </StFieldRow>
            <StField>
              <StLabel htmlFor="quick-run-type">러닝 종류</StLabel>
              <StSelect
                id="quick-run-type"
                value={runType}
                onChange={(e) => setRunType(e.target.value as RunningType)}
              >
                {(
                  Object.entries(RUNNING_TYPE_LABEL) as [RunningType, string][]
                ).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </StSelect>
            </StField>
            <StHint>시간은 분:초 또는 시:분:초로 적어요. 예: 32:10, 1:05:30</StHint>
          </StBand>
        ) : null}

        {kind === "gym" ? (
          <StBand>
            <StFieldRow>
              <StField>
                <StLabel htmlFor="quick-gym-part">부위</StLabel>
                <StSelect
                  id="quick-gym-part"
                  value={bodyPart}
                  onChange={(e) =>
                    setBodyPart(e.target.value as GymBodyPart | "")
                  }
                >
                  <option value="">선택 안 함</option>
                  {(
                    Object.entries(GYM_BODY_PART_LABEL) as [
                      GymBodyPart,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </StSelect>
              </StField>
              <StField>
                <StLabel htmlFor="quick-gym-min">운동 시간 (분)</StLabel>
                <StInput
                  id="quick-gym-min"
                  type="text"
                  inputMode="decimal"
                  placeholder="50"
                  value={gymMin}
                  onChange={(e) => setGymMin(e.target.value)}
                />
              </StField>
            </StFieldRow>
            <StHint>세부 종목 없이 &ldquo;운동함&rdquo;으로 남겨져요.</StHint>
          </StBand>
        ) : null}

        {kind === "activity" ? (
          <StBand>
            <StFieldRow>
              <StField>
                <StLabel htmlFor="quick-act-name">종목</StLabel>
                <StInput
                  id="quick-act-name"
                  type="text"
                  placeholder="테니스"
                  value={activityName}
                  onChange={(e) => setActivityName(e.target.value)}
                />
              </StField>
              <StField>
                <StLabel htmlFor="quick-act-min">운동 시간 (분)</StLabel>
                <StInput
                  id="quick-act-min"
                  type="text"
                  inputMode="decimal"
                  placeholder="60"
                  value={activityMin}
                  onChange={(e) => setActivityMin(e.target.value)}
                />
              </StField>
            </StFieldRow>
            <StChipRow>
              {ACTIVITY_PRESETS.map((name) => (
                <StChip
                  key={name}
                  type="button"
                  $active={activityName === name}
                  onClick={() => setActivityName(name)}
                >
                  {name}
                </StChip>
              ))}
            </StChipRow>
          </StBand>
        ) : null}

        <StBand>
          <StField>
            <StLabel htmlFor="quick-memo">메모</StLabel>
            <StTextarea
              id="quick-memo"
              rows={2}
              placeholder="컨디션, 같이 한 사람 등"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </StField>
        </StBand>

        {error ? <StError role="alert">{error}</StError> : null}

        <StActions>
          <StPrimary type="button" onClick={handleSave} disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </StPrimary>
          <StGhost type="button" onClick={goDetail} disabled={busy}>
            자세히 입력
          </StGhost>
          <StText type="button" onClick={onClose} disabled={busy}>
            ✕ 닫기
          </StText>
        </StActions>
      </StSheet>
    </StOverlay>
  );
}

// =========================
// 스타일
// =========================
const StOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(15, 23, 42, 0.4);
  display: grid;
  place-items: center;
  padding: 1rem;

  @media (max-width: 560px) {
    place-items: end stretch;
    padding: 0;
  }
`;

const StSheet = styled.div`
  width: 100%;
  max-width: 28rem;
  max-height: calc(100vh - 2rem);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1.1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1.1rem;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.22);

  @media (max-width: 560px) {
    max-width: none;
    max-height: 88vh;
    border-radius: 1.1rem 1.1rem 0 0;
    border-bottom: none;
    padding: 1rem 1rem 1.2rem;
  }
`;

const StHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StDateLine = styled.p`
  font-size: 1.02rem;
  font-weight: 900;
  color: ${({ theme }) => theme.semantic.text};
`;

const StCloseIcon = styled.button`
  width: 1.9rem;
  height: 1.9rem;
  flex-shrink: 0;
  border: none;
  background: transparent;
  border-radius: 0.5rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.semantic.subText};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.semantic.bg};
    color: ${({ theme }) => theme.semantic.text};
  }
`;

const StBand = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.7rem 0.75rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

const StFieldRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.5rem;
`;

const StField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
`;

const StLabel = styled.label`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StInput = styled.input`
  width: 100%;
  min-height: 2.6rem;
  padding: 0 0.7rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.95rem;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray300};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

/* 기록하기 폼의 선택 칸과 같은 모양: 브라우저 기본 화살표 대신 같은 쉐브론, 오른쪽 여백 2rem */
const StSelect = styled.select`
  width: 100%;
  min-width: 0;
  min-height: 2.6rem;
  box-sizing: border-box;
  padding: 0 2rem 0 0.75rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.95rem;
  appearance: none;
  -webkit-appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3e%3cpath d='M1 1l4 4 4-4' stroke='%237d8593' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.7rem center;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StTextarea = styled.textarea`
  width: 100%;
  padding: 0.5rem 0.7rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.95rem;
  font-family: inherit;
  line-height: 1.45;
  resize: vertical;

  &::placeholder {
    color: ${({ theme }) => theme.colors.gray300};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.semantic.primary};
  }
`;

const StHint = styled.p`
  font-size: 0.74rem;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
`;

const StChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.indigo500 : theme.semantic.border};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.indigo50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.indigo600 : theme.semantic.subText};
  font-size: 0.74rem;
  font-weight: 800;
  padding: 0.32rem 0.6rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;

  &:hover {
    color: ${({ theme }) => theme.colors.indigo600};
    border-color: ${({ theme }) => theme.colors.indigo500};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StError = styled.p`
  padding: 0.5rem 0.7rem;
  border-radius: 0.6rem;
  background: ${({ theme }) => theme.semantic.dangerBg};
  color: ${({ theme }) => theme.semantic.danger};
  font-size: 0.82rem;
  font-weight: 700;
`;

const StActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.1rem;
`;

const StPrimary = styled.button`
  flex: 1;
  min-height: 2.9rem;
  padding: 0 1rem;
  border: none;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const StGhost = styled.button`
  min-height: 2.9rem;
  padding: 0 0.9rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const StText = styled.button`
  min-height: 2.9rem;
  padding: 0 0.5rem;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.semantic.subText};
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.semantic.text};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;
