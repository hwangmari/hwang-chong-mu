"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchTravelPlan, setTravelDay, updateTravelMeta } from "@/services/travel";
import {
  buildDays,
  clearTransitAround,
  movePlace as movePlaceInDay,
  newPlaceId,
  normalizeDay,
  validateTripInput,
} from "../lib/plan";
import { rememberMyPlan } from "../myPlans";
import type {
  PlaceCategory,
  TransitLeg,
  TravelDay,
  TravelPlace,
  TravelPlan,
} from "../types";

/** 다른 사람이 같은 여행을 고쳤는지 확인하는 주기 (테니스 교환전 화면과 같은 20초) */
const POLL_MS = 20_000;

/** 주소에 코드 6자리만 적어 온 경우(/travel/ABC234). services/travel.ts 의 규칙과 같다. */
const BARE_CODE = /^[A-Z2-9]{6}$/;

/** 새 장소를 넣을 때 화면이 넘겨 주는 값. id·메모는 여기서 채운다. */
export type NewPlaceInput = {
  name: string;
  category: PlaceCategory;
  address?: string;
  lat?: number;
  lng?: number;
  placeId?: string;
  url?: string;
  isStay?: boolean;
};

export type UseTravelPlan = ReturnType<typeof useTravelPlan>;

export function useTravelPlan(id: string) {
  const router = useRouter();

  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 지금 화면에 있는 여행. 저장 함수들이 "한 박자 늦은 값"으로 계산하지 않도록 상태와 같이 들고 다닌다.
  const planRef = useRef<TravelPlan | null>(null);
  // 메모를 쓰는 중이거나 줄을 끌어 옮기는 중이면 true — 이때 온 폴링 결과는 버린다 (2026-09-16)
  const dirtyRef = useRef(false);
  // 계정의 "내 방"에 한 번만 등록하려는 표시
  const linkedRef = useRef<string | null>(null);

  const applyPlan = useCallback((next: TravelPlan) => {
    planRef.current = next;
    setPlan(next);
  }, []);

  // 처음 열 때 loading 은 이미 true 로 시작하므로 여기서 다시 켜지 않는다.
  // (효과 안에서 상태를 바로 바꾸면 화면을 한 번 더 그리게 되어 React 규칙에 걸린다)
  const load = useCallback(
    async (quiet = false) => {
      try {
        const next = await fetchTravelPlan(id);

        // 조용한 새로고침 결과는 입력 중이면 버린다 — 쓰던 메모가 남의 저장본으로 덮이지 않게
        if (quiet && dirtyRef.current) return;

        if (!next) {
          planRef.current = null;
          setPlan(null);
          setNotFound(true);
          return;
        }

        setNotFound(false);
        applyPlan(next);

        // 코드 6자리로 들어왔으면 정식 주소(<이름>-<코드>)로 바꿔 준다. 물음표 뒤 값은 그대로 들고 간다.
        if (BARE_CODE.test(id) && next.id !== id) {
          router.replace(`/travel/${next.id}${window.location.search}`);
        }

        if (linkedRef.current !== next.id) {
          linkedRef.current = next.id;
          // rememberMyPlan 안에서 linkRoomToAccount("travel", …) 까지 함께 부른다(두 번 등록하지 않으려고 여기서 따로 안 부름)
          rememberMyPlan({
            id: next.id,
            title: next.title,
            startDate: next.startDate,
            endDate: next.endDate,
          });
        }
      } catch {
        if (!quiet) setError("여행을 불러오지 못했어요. 잠시 뒤 다시 열어 주세요.");
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [applyPlan, id, router],
  );

  useEffect(() => {
    // 효과 본문에서 상태를 바로 바꾸지 않도록 한 박자 뒤에 읽는다(React 규칙: 효과는 바깥 시스템과 맞추는 자리)
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  // 여럿이 같이 고치는 화면이라 주기적으로 다시 읽는다. 보고 있지 않은 탭에서는 쉬게 둔다.
  useEffect(() => {
    if (!plan) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load(true);
    }, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [plan, load]);

  /** 메모 입력·끌어 옮기기가 시작/끝날 때 알려 준다(폴링이 끼어들지 않게). */
  const setDirty = useCallback((value: boolean) => {
    dirtyRef.current = value;
  }, []);

  /**
   * 하루치만 저장한다. 화면은 먼저 바꾸고(기다리지 않게), 저장에 실패하면 되돌린 뒤 안내 문구를 띄운다.
   * days 전체가 아니라 그 칸만 바꾸는 저장 함수를 쓰므로 다른 날을 고치던 사람의 내용이 지워지지 않는다.
   */
  const saveDay = useCallback(
    async (dayIndex: number, nextDay: TravelDay) => {
      const current = planRef.current;
      if (!current || !current.days[dayIndex]) return;

      const normalized = normalizeDay(nextDay);
      const before = current.days;
      applyPlan({
        ...current,
        days: current.days.map((day, i) => (i === dayIndex ? normalized : day)),
      });
      setBusy(true);
      setError("");
      try {
        const days = await setTravelDay(current.id, dayIndex, normalized);
        const latest = planRef.current;
        if (latest) applyPlan({ ...latest, days });
      } catch {
        const latest = planRef.current;
        if (latest) applyPlan({ ...latest, days: before });
        setError("저장하지 못했어요. 인터넷 연결을 확인하고 다시 해 주세요.");
        void load(true);
      } finally {
        setBusy(false);
      }
    },
    [applyPlan, load],
  );

  /** 그 날의 하루치를 꺼내 준다(없으면 null). */
  const dayAt = useCallback((dayIndex: number): TravelDay | null => {
    return planRef.current?.days[dayIndex] ?? null;
  }, []);

  /** 숙소를 바꾸거나(입력) 뺀다(null). */
  const setStay = useCallback(
    async (dayIndex: number, input: NewPlaceInput | null) => {
      const day = dayAt(dayIndex);
      if (!day) return;
      const rest = day.places.filter((place) => !place.isStay);

      if (!input) {
        // 숙소가 빠지면 숙소 → 첫 장소 구간의 이동 시간이 사라진다
        await saveDay(dayIndex, {
          ...day,
          places: rest.map((place, i) => (i === 0 ? { ...place, transitToNext: null } : place)),
        });
        return;
      }

      const name = input.name.trim();
      if (!name) return;
      const stay: TravelPlace = {
        ...input,
        name,
        address: input.address?.trim() || undefined,
        id: newPlaceId(),
        isStay: true,
        transitToNext: null,
      };
      await saveDay(dayIndex, { ...day, places: [stay, ...rest] });
    },
    [dayAt, saveDay],
  );

  const addPlace = useCallback(
    async (dayIndex: number, input: NewPlaceInput) => {
      const day = dayAt(dayIndex);
      if (!day) return;
      const name = input.name.trim();
      if (!name) return;
      // 숙소는 하루에 하나뿐이라 넣는 방법이 다르다 — setStay 가 갈아 끼우는 일까지 맡는다
      if (input.isStay) {
        await setStay(dayIndex, input);
        return;
      }

      const place: TravelPlace = {
        ...input,
        name,
        address: input.address?.trim() || undefined,
        id: newPlaceId(),
      };
      const appended: TravelDay = { ...day, places: [...day.places, place] };
      // 맨 뒤에 붙였으니 "직전 장소 → 새 장소" 구간의 이동 시간은 더 이상 맞지 않는다
      await saveDay(dayIndex, clearTransitAround(appended, appended.places.length - 1));
    },
    [dayAt, saveDay, setStay],
  );

  const removePlace = useCallback(
    async (dayIndex: number, placeId: string) => {
      const day = dayAt(dayIndex);
      if (!day) return;
      const index = day.places.findIndex((place) => place.id === placeId);
      if (index < 0) return;
      const cleared = clearTransitAround(day, index);
      await saveDay(dayIndex, {
        ...cleared,
        places: cleared.places.filter((_, i) => i !== index),
      });
    },
    [dayAt, saveDay],
  );

  const movePlace = useCallback(
    async (dayIndex: number, from: number, to: number) => {
      const day = dayAt(dayIndex);
      if (!day || from === to) return;
      const moved = movePlaceInDay(day, from, to);
      if (moved === day) return;
      // 빠져나온 자리와 끼어든 자리 둘 다 앞뒤 이동 시간이 틀어진다
      await saveDay(dayIndex, clearTransitAround(clearTransitAround(moved, from), to));
    },
    [dayAt, saveDay],
  );

  const setMemo = useCallback(
    async (dayIndex: number, placeId: string, memo: string) => {
      const day = dayAt(dayIndex);
      if (!day) return;
      const text = memo.trim();
      const target = day.places.find((place) => place.id === placeId);
      if (!target || (target.memo ?? "") === text) return;
      await saveDay(dayIndex, {
        ...day,
        places: day.places.map((place) =>
          place.id === placeId ? { ...place, memo: text || undefined } : place,
        ),
      });
    },
    [dayAt, saveDay],
  );

  const toggleStayInRoute = useCallback(
    async (dayIndex: number) => {
      const day = dayAt(dayIndex);
      if (!day) return;
      // 동선에서 넣고 빼면 이어지는 구간이 통째로 달라지므로 계산해 둔 이동 시간을 모두 버린다
      await saveDay(dayIndex, {
        ...day,
        stayInRoute: !day.stayInRoute,
        places: day.places.map((place) => ({ ...place, transitToNext: null })),
      });
    },
    [dayAt, saveDay],
  );

  /** 길찾기 결과를 장소별로 한 번에 붙인다(구글을 붙이는 다음 단계에서 쓴다). */
  const setTransit = useCallback(
    async (dayIndex: number, updates: Record<string, TransitLeg | null>) => {
      const day = dayAt(dayIndex);
      if (!day) return;
      const ids = Object.keys(updates);
      if (ids.length === 0) return;
      await saveDay(dayIndex, {
        ...day,
        places: day.places.map((place) =>
          place.id in updates ? { ...place, transitToNext: updates[place.id] } : place,
        ),
      });
    },
    [dayAt, saveDay],
  );

  const renameTrip = useCallback(
    async (title: string) => {
      const current = planRef.current;
      if (!current) return;
      const name = title.trim();
      if (!name || name === current.title) return;

      const message = validateTripInput({
        title: name,
        startDate: current.startDate,
        endDate: current.endDate,
      });
      if (message) {
        setError(message);
        return;
      }

      applyPlan({ ...current, title: name });
      setBusy(true);
      setError("");
      try {
        applyPlan(await updateTravelMeta(current.id, { title: name }));
      } catch {
        applyPlan(current);
        setError("여행 이름을 저장하지 못했어요. 잠시 뒤 다시 해 주세요.");
      } finally {
        setBusy(false);
      }
    },
    [applyPlan],
  );

  /** 기간을 줄였을 때 통째로 사라지는 날들(적어 둔 장소가 있는 것만). 물어보고 지우려고 미리 알려 준다. */
  const daysThatWouldDrop = useCallback((start: string, end: string): TravelDay[] => {
    const current = planRef.current;
    if (!current) return [];
    const kept = new Set(buildDays(start, end, current.days).map((day) => day.date));
    return current.days.filter((day) => !kept.has(day.date) && day.places.length > 0);
  }, []);

  /** 기간 바꾸기. 성공하면 true — 부르는 쪽이 이때만 창을 닫는다. */
  const changeRange = useCallback(
    async (start: string, end: string): Promise<boolean> => {
      const current = planRef.current;
      if (!current) return false;

      const message = validateTripInput({ title: current.title, startDate: start, endDate: end });
      if (message) {
        setError(message);
        return false;
      }

      setBusy(true);
      setError("");
      try {
        const days = buildDays(start, end, current.days);
        applyPlan(
          await updateTravelMeta(current.id, { startDate: start, endDate: end, days }),
        );
        return true;
      } catch {
        setError("기간을 저장하지 못했어요. 잠시 뒤 다시 해 주세요.");
        return false;
      } finally {
        setBusy(false);
      }
    },
    [applyPlan],
  );

  return {
    plan,
    loading,
    notFound,
    busy,
    error,
    setError,
    setDirty,
    reload: load,
    addPlace,
    removePlace,
    movePlace,
    setMemo,
    setStay,
    toggleStayInRoute,
    setTransit,
    renameTrip,
    changeRange,
    daysThatWouldDrop,
  };
}
