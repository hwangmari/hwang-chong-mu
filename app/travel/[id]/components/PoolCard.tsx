"use client";

import { useState } from "react";
import { useModal } from "@/components/common/ModalProvider";
import { CATEGORY_ICON, CATEGORY_LABEL, type TravelPlace } from "../../types";
import {
  StCard,
  StCardTitle,
  StCategoryChip,
  StHint,
  StNotice,
  StPoolActions,
  StPoolMemo,
  StPoolName,
  StPoolRow,
  StRowBtn,
  StSpotBody,
  StSpotIcon,
} from "../page.styles";

// 후보 카드 — 날짜를 아직 못 정했거나 일정에서 뺀 곳. 하루 카드 아래에 두고,
// "DAY 0N에 담기"를 누르면 지금 보고 있는 날 맨 뒤로 들어간다. 후보가 없으면 카드 자체를 그리지 않는다. (2026-09-17)

type PoolCardProps = {
  pool: TravelPlace[];
  /** 지금 보고 있는 날 — 담기 버튼이 이 날로 넣는다 */
  dayIndex: number;
  busy?: boolean;
  onMove: (poolId: string, dayIndex: number) => Promise<string | null>;
  onRemove: (poolId: string) => Promise<string | null>;
};

export default function PoolCard({ pool, dayIndex, busy = false, onMove, onRemove }: PoolCardProps) {
  const { openConfirm } = useModal();
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [failText, setFailText] = useState("");

  if (pool.length === 0) return null;
  const dayTag = `DAY ${String(dayIndex + 1).padStart(2, "0")}`;

  const run = async (poolId: string, job: () => Promise<string | null>) => {
    if (busy || workingId) return;
    setWorkingId(poolId);
    setFailText("");
    try {
      const failure = await job();
      if (failure) setFailText(failure);
    } finally {
      setWorkingId(null);
    }
  };

  const handleRemove = async (place: TravelPlace) => {
    const ok = await openConfirm(`"${place.name}"을 후보에서 뺄까요?`);
    if (!ok) return;
    await run(place.id, () => onRemove(place.id));
  };

  return (
    <StCard data-testid="pool-card">
      <StCardTitle>🗂️ 후보 · {pool.length}곳</StCardTitle>
      <StHint>날짜를 못 정했거나 일정에서 뺀 곳이에요. 담으면 {dayTag} 맨 뒤로 들어가요.</StHint>

      <div role="list" aria-label="후보 장소">
        {pool.map((place) => (
          <StPoolRow key={place.id} role="listitem" data-testid="pool-row">
            <StSpotIcon aria-hidden>{CATEGORY_ICON[place.category]}</StSpotIcon>
            <StSpotBody>
              <StPoolName>
                <StCategoryChip>{CATEGORY_LABEL[place.category]}</StCategoryChip>
                <span title={place.name}>{place.name}</span>
              </StPoolName>
              {place.memo && <StPoolMemo title={place.memo}>{place.memo}</StPoolMemo>}
            </StSpotBody>
            <StPoolActions>
              <StRowBtn
                type="button"
                $tone="primary"
                disabled={busy || workingId !== null}
                aria-label={`${place.name} ${dayTag}에 담기`}
                data-testid="pool-move"
                onClick={() => void run(place.id, () => onMove(place.id, dayIndex))}
              >
                {workingId === place.id ? "담는 중…" : `${dayTag}에 담기`}
              </StRowBtn>
              <StRowBtn
                type="button"
                $tone="dangerQuiet"
                disabled={busy || workingId !== null}
                aria-label={`${place.name} 후보에서 빼기`}
                data-testid="pool-remove"
                onClick={() => void handleRemove(place)}
              >
                빼기
              </StRowBtn>
            </StPoolActions>
          </StPoolRow>
        ))}
      </div>

      {failText && <StNotice $tone="error">{failText}</StNotice>}
    </StCard>
  );
}
