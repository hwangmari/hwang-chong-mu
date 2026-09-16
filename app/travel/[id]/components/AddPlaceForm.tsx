"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { CATEGORY_LABEL, type PlaceCategory } from "../../types";
import type { NewPlaceInput } from "../useTravelPlan";
import { StAddForm, StGhostBtn, StPrimaryBtn, StSelect, StTextInput } from "../page.styles";

// 장소 넣는 줄. 이름 칸에 구글 장소 자동완성이 붙어 있다.
// 열쇠가 없으면 자동완성만 조용히 꺼지고, 손으로 적어 넣는 길은 그대로 열려 있다. (2026-09-16)

type AddPlaceFormProps = {
  /** place = 그냥 들르는 곳, stay = 그 날 자는 곳(분류가 숙소로 고정된다) */
  mode: "place" | "stay";
  busy?: boolean;
  onAdd: (input: NewPlaceInput) => void | Promise<void>;
  /** 숙소 입력 칸처럼 잠깐 열었다 닫는 경우에만 준다 */
  onCancel?: () => void;
  autoFocus?: boolean;
  /** 나라 코드(JP 등). 검색을 그 나라 안으로 좁힌다. page.tsx 가 plan.region 을 넘겨 주면 된다. */
  region?: string;
  /** 검색 기준 위치. 그 날 첫 좌표 있는 장소를 주면 가까운 곳이 먼저 나온다. page.tsx 가 넘겨 주면 된다. */
  bias?: { lat: number; lng: number };
};

type Suggestion = { placeId: string; mainText: string; secondaryText: string };

const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABEL) as PlaceCategory[]).filter(
  (category) => category !== "stay",
);

const MIN_QUERY = 2;
const DEBOUNCE_MS = 300;
const NO_KEY_HINT = "지도 검색은 구글 열쇠를 넣으면 켜져요 · 지금은 직접 적어 넣어요";
const TOO_MANY_HINT = "검색이 너무 잦아요, 잠시 후에요";

/** 검색 한 묶음을 묶는 값. 구글이 자동완성+상세를 한 번으로 셈해 준다. */
function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toCoord(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

export default function AddPlaceForm({
  mode,
  busy = false,
  onAdd,
  onCancel,
  autoFocus = false,
  region,
  bias,
}: AddPlaceFormProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<PlaceCategory>("sight");
  const [address, setAddress] = useState("");

  const [items, setItems] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hint, setHint] = useState("");
  const [detailsBusy, setDetailsBusy] = useState(false);
  const [suggestOff, setSuggestOff] = useState(false);

  const tokenRef = useRef(newSessionToken());
  const abortRef = useRef<AbortController | null>(null);
  const skipNextRef = useRef(false);

  const isStay = mode === "stay";
  // 객체를 그대로 의존값에 쓰면 부모가 다시 그릴 때마다 검색이 다시 나가므로 숫자만 떼어 쓴다
  const biasLat = bias?.lat;
  const biasLng = bias?.lng;
  const canAdd = name.trim().length > 0 && !busy && !detailsBusy;
  const query = name.trim();
  // 목록을 여는 조건은 따로 저장하지 않고 지금 상태에서 바로 계산한다(글자를 지우면 저절로 닫힌다).
  const open = !dismissed && !suggestOff && items.length > 0 && query.length >= MIN_QUERY;

  const closeList = useCallback(() => {
    setDismissed(true);
    setItems([]);
    setActiveIndex(0);
  }, []);

  // ── 타자가 멈춘 뒤 0.3초에 한 번만 물어본다
  useEffect(() => {
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }
    if (suggestOff || query.length < MIN_QUERY) return;

    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      void (async () => {
        try {
          const res = await fetch("/api/travel/places", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              kind: "autocomplete",
              input: query,
              sessionToken: tokenRef.current,
              ...(region ? { region } : {}),
              ...(biasLat !== undefined && biasLng !== undefined
                ? { bias: { lat: biasLat, lng: biasLng } }
                : {}),
            }),
          });

          if (res.status === 429) {
            setHint(TOO_MANY_HINT);
            setItems([]);
            return;
          }
          if (!res.ok) {
            const body = (await res.json().catch(() => null)) as { error?: string } | null;
            // 열쇠가 없는 상태는 고장이 아니라 "아직 안 켠 기능" — 이번 화면에서는 조용히 끈다
            if (res.status === 500 && typeof body?.error === "string" && body.error.includes("열쇠")) {
              setSuggestOff(true);
              setHint(NO_KEY_HINT);
            }
            setItems([]);
            return;
          }

          const data = (await res.json()) as { items?: Suggestion[] };
          const next = (data.items ?? []).filter((item) => item && item.placeId).slice(0, 6);
          setHint("");
          setItems(next);
          setActiveIndex(0);
          setDismissed(false);
        } catch {
          // 검색이 안 되는 것뿐이라 화면에는 아무 일도 일어나지 않는다
        }
      })();
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, region, biasLat, biasLng, suggestOff]);

  // ── 화면을 떠나면 보내던 요청을 끊는다
  useEffect(() => () => abortRef.current?.abort(), []);

  const resetForm = () => {
    skipNextRef.current = true;
    setName("");
    setAddress("");
    closeList();
    tokenRef.current = newSessionToken();
  };

  const pick = async (item: Suggestion) => {
    setDismissed(true);
    setDetailsBusy(true);
    try {
      const res = await fetch("/api/travel/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "details", placeId: item.placeId, sessionToken: tokenRef.current }),
      });
      if (!res.ok) {
        // 상세를 못 받으면 이름만 채워 두고 사람이 마저 적게 한다
        skipNextRef.current = true;
        setName(item.mainText);
        setHint(res.status === 429 ? TOO_MANY_HINT : "자세한 정보를 못 받아왔어요 — 직접 적어 넣어요");
        return;
      }
      const detail = (await res.json()) as {
        placeId?: string;
        name?: string;
        address?: string;
        lat?: number | null;
        lng?: number | null;
        url?: string;
        category?: PlaceCategory;
      };
      await onAdd({
        name: (detail.name || item.mainText).trim(),
        category: isStay ? "stay" : (detail.category ?? category),
        address: detail.address?.trim() || undefined,
        lat: toCoord(detail.lat),
        lng: toCoord(detail.lng),
        placeId: detail.placeId || item.placeId,
        url: detail.url || undefined,
        isStay,
      });
      resetForm();
    } catch {
      setHint("자세한 정보를 못 받아왔어요 — 직접 적어 넣어요");
    } finally {
      setDetailsBusy(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) {
      if (event.key === "Escape") closeList();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % items.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + items.length) % items.length);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      closeList();
      return;
    }
    if (event.key === "Enter") {
      const item = items[activeIndex];
      if (!item) return;
      event.preventDefault();
      void pick(item);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canAdd) return;
    await onAdd({
      name: name.trim(),
      category: isStay ? "stay" : category,
      address: address.trim() || undefined,
      isStay,
    });
    resetForm();
  };

  return (
    <StAddForm onSubmit={handleSubmit}>
      <StNameField>
        <StNameInput
          value={name}
          autoFocus={autoFocus}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isStay ? "숙소 이름" : "장소 이름"}
          aria-label={isStay ? "숙소 이름" : "장소 이름"}
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="travel-place-suggest"
        />
        {detailsBusy && <StInlineBusy>불러오는 중…</StInlineBusy>}
        {open && items.length > 0 && (
          <StSuggestList
            id="travel-place-suggest"
            role="listbox"
            data-testid="place-suggest"
            onMouseDown={(event) => event.preventDefault()}
          >
            {items.map((item, index) => (
              <StSuggestItem
                key={item.placeId}
                type="button"
                role="option"
                aria-selected={index === activeIndex}
                $active={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => void pick(item)}
              >
                <StSuggestMain>{item.mainText}</StSuggestMain>
                {item.secondaryText && <StSuggestSub>{item.secondaryText}</StSuggestSub>}
              </StSuggestItem>
            ))}
          </StSuggestList>
        )}
      </StNameField>
      {!isStay && (
        <StSelect
          value={category}
          onChange={(event) => setCategory(event.target.value as PlaceCategory)}
          aria-label="장소 분류"
        >
          {CATEGORY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {CATEGORY_LABEL[option]}
            </option>
          ))}
        </StSelect>
      )}
      <StTextInput
        value={address}
        onChange={(event) => setAddress(event.target.value)}
        placeholder="주소 (없어도 돼요)"
        aria-label="주소"
      />
      <StPrimaryBtn type="submit" disabled={!canAdd}>
        추가
      </StPrimaryBtn>
      {onCancel && (
        <StGhostBtn type="button" onClick={onCancel}>
          취소
        </StGhostBtn>
      )}
      {hint && <StFormHint>{hint}</StFormHint>}
    </StAddForm>
  );
}

/* 이름 칸 + 그 아래 열리는 후보 목록을 함께 묶는 자리 */
const StNameField = styled.div`
  position: relative;
  flex: 1 1 10rem;
  min-width: 0;
`;

const StNameInput = styled(StTextInput)`
  width: 100%;
  flex: none;
`;

const StInlineBusy = styled.span`
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  pointer-events: none;
`;

/* 후보 목록 — 테두리는 이 한 겹만, 줄 사이는 여백으로 나눈다 */
const StSuggestList = styled.div`
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const StSuggestItem = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  background: ${({ $active, theme }) => ($active ? theme.semantic.bg : "transparent")};
  text-align: left;
  cursor: pointer;
`;

const StSuggestMain = styled.span`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.text};
`;

const StSuggestSub = styled.span`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.semantic.subText};
`;

/* 입력 줄 아래로 한 줄 내려가는 안내 */
const StFormHint = styled.p`
  flex: 1 0 100%;
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
`;
