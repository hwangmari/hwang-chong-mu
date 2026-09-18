"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SkeletonBlock } from "@/components/common/Skeleton";
import { useModal } from "@/components/common/ModalProvider";
import {
  NEARBY_LIMIT,
  NEARBY_RADIUS_M,
  findGuide,
  findSpotByName,
  nearbySpots,
  placedDayByName,
  sideAt,
  spotNameKey,
} from "../lib/guides";
import type { NearbySpot } from "../lib/guides";
import { MAX_PLACE_STEPS, MEAL_CATEGORIES, type PlaceCategory } from "../types";
import { dayCountLabel, dayLabel, newPlaceId, routePlaces, stayStopInput } from "../lib/plan";
import { dayTransitTotal, formatMinutes } from "../lib/routeLegs";
import AddPlaceForm from "./components/AddPlaceForm";
import DayTabs from "./components/DayTabs";
import ExportModal from "./components/ExportModal";
import NearbyPanel from "./components/NearbyPanel";
import PoolCard from "./components/PoolCard";
import PlaceList from "./components/PlaceList";
import RouteMap from "./components/RouteMap";
import type { MapSpot } from "./components/RouteMap";
import RoutePanel from "./components/RoutePanel";
import SpotPicker from "./components/SpotPicker";
import StayRow from "./components/StayRow";
import TripHeader from "./components/TripHeader";
import { useTravelPlan } from "./useTravelPlan";
import {
  StCard,
  StCardTitle,
  StDayHead,
  StDayTotal,
  StHint,
  StRowBtn,
  StMapCard,
  StNotice,
  StPage,
  StPickerRow,
  StSkeletonRow,
  StSkeletonTabs,
  StStickyPanel,
  StWideShell,
  StColumns,
  StMainCol,
  StNearbyCol,
  StSideCol,
} from "./page.styles";

// 여행 방 화면. 왼쪽은 날짜별 목록, 오른쪽은 그 날 도는 순서(지도). 1024px 이상에서 반반(5:5)으로 나눈다.
// 1024px 아래에서는 오른쪽 칸이 왼쪽 아래로 내려온다.
// 평소에는 "보기" 상태라 목록이 조용하고, 오른쪽 위 "편집"을 눌러야 순서·삭제·추가 버튼이 나온다.
// 편집 상태는 날짜 탭을 옮겨도 그대로 유지된다(하루씩 다시 켜지 않아도 되게). (2026-09-16)

/* 분류로 추리기 전에 반경 안에서 받아 두는 최대 개수 — 추린 뒤 NEARBY_LIMIT 만큼만 보여 준다 */
const NEARBY_POOL_LIMIT = 60;

export default function TravelPlanPage() {
  const params = useParams();
  // 주소의 한글 슬러그("상하이3박4일-ZMM5QU")는 퍼센트 부호로 오므로 풀어서 조회한다 (2026-09-16: 만든 여행이 "찾지 못했어요"로 뜨던 문제)
  const id = typeof params?.id === "string" ? safeDecode(params.id) : "";
  const { openAlert, openConfirm } = useModal();

  const {
    plan,
    loading,
    notFound,
    busy,
    error,
    setDirty,
    addPlace,
    addPlaces,
    insertPlaceAfter,
    movePoolToDay,
    removeFromPool,
    removePlace,
    movePlace,
    setMemo,
    setSteps,
    setStay,
    toggleStayInRoute,
    setTransit,
    renameTrip,
    changeRange,
    daysThatWouldDrop,
  } = useTravelPlan(id);

  const [dayIndex, setDayIndex] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // 주변 추천을 어떤 분류로 추릴지. "auto" 는 아직 사람이 안 고른 상태(고른 장소와 같은 분류로 알아서 추린다) (2026-09-18)
  const [nearbyFilter, setNearbyFilter] = useState<PlaceCategory | null | "auto">("auto");
  // 클릭으로 고른 장소 — 지도가 그곳으로 확대되고 아래에 "주변 추천" 칸이 열린다. 손 올리기(focusedId)와는 별개 (2026-09-17)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 주변 칸 줄 ↔ 지도 핀이 서로 가리키는 장소
  const [nearbyActiveId, setNearbyActiveId] = useState<string | null>(null);
  // "위치"를 누른 자리 — 누를 때마다 n 이 올라가서 지도가 그때마다 한 번씩 따라간다
  const [spotFocus, setSpotFocus] = useState<{ id: string; n: number } | null>(null);
  const sideColRef = useRef<HTMLDivElement | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  // 하루 카드를 고치는 중인지. 날짜 탭을 옮겨도 그대로 둔다.
  const [editing, setEditing] = useState(false);
  // 추천 장소 고르기 창
  const [pickerOpen, setPickerOpen] = useState(false);

  // 기간을 줄여 날 수가 적어지면 보고 있던 탭이 사라질 수 있어, 남은 마지막 날로 자동으로 당겨 본다
  const safeDayIndex = plan ? Math.min(dayIndex, Math.max(0, plan.days.length - 1)) : 0;
  const day = plan?.days[safeDayIndex] ?? null;

  const routeList = useMemo(() => (day ? routePlaces(day) : []), [day]);

  // 이 여행에 맞는 추천 장소 안내서(상하이 등). 없으면 "추천 장소에서 고르기" 버튼이 숨는다.
  const guide = useMemo(() => (plan ? findGuide(plan) : null), [plan]);

  // 강이 도시를 가르면(상하이) 이동 시간 계산에 "어느 쪽인지"를 넘긴다
  const sideOf = useMemo(
    () => (guide?.river ? (point: { lat: number; lng: number }) => sideAt(guide, point) : undefined),
    [guide],
  );

  // 클릭으로 고른 장소(그 날 목록에서). 날짜를 옮기거나 지워져서 없어지면 저절로 풀린다.
  const selectedPlace = useMemo(
    () => (selectedId && day ? (day.places.find((place) => place.id === selectedId) ?? null) : null),
    [day, selectedId],
  );
  const selectedHasCoords =
    !!selectedPlace && typeof selectedPlace.lat === "number" && typeof selectedPlace.lng === "number";
  // 반경 안의 추천을 넉넉히 받아 둔다 — 분류로 추린 뒤에 8곳을 자르려고(먼저 자르면 식당이 하나도 안 남는다)
  const nearbyAll = useMemo<NearbySpot[]>(() => {
    if (!guide || !plan || !selectedPlace || !selectedHasCoords) return [];
    // 일정에 있는 곳 + 일정에서 뺀 후보(pool)는 주변 추천에 다시 띄우지 않는다 — 방금 뺀 곳이 또 올라오면 헷갈린다 (주인 요청 2026-09-17)
    const skip = new Map(placedDayByName(plan));
    for (const place of plan.pool) {
      const key = spotNameKey(place.name);
      if (!skip.has(key)) skip.set(key, -1);
    }
    return nearbySpots(
      guide,
      { lat: selectedPlace.lat as number, lng: selectedPlace.lng as number },
      skip,
      { limit: NEARBY_POOL_LIMIT },
    );
  }, [guide, plan, selectedPlace, selectedHasCoords]);

  /** 이미 그 자리의 세부 일정으로 담아 둔 곳은 추천에서 뺀다 — 같은 집을 두 번 담지 않게 */
  const nearbyLeft = useMemo(() => {
    const inSteps = new Set((selectedPlace?.steps ?? []).map((step) => spotNameKey(step.text)));
    return nearbyAll.filter((spot) => !inSteps.has(spotNameKey(spot.name)));
  }, [nearbyAll, selectedPlace]);

  /** 분류별로 몇 곳이 남았는지 — 단추의 숫자와 실제 목록이 어긋나지 않게 뺀 뒤에 센다 (2026-09-18) */
  const nearbyCounts = useMemo(() => {
    const counts = new Map<PlaceCategory, number>();
    for (const spot of nearbyLeft) counts.set(spot.category, (counts.get(spot.category) ?? 0) + 1);
    return counts;
  }, [nearbyLeft]);

  /**
   * 실제로 쓸 분류. 사람이 단추를 누르면 그 값(nearbyFilter)을 쓰고,
   * 아직 안 눌렀으면 "고른 장소와 같은 분류"로 알아서 추린다 — 점심 자리를 눌렀으면 식당만 (주인 요청 2026-09-18).
   */
  const nearbyFilterInUse = useMemo<PlaceCategory | null>(() => {
    if (nearbyFilter !== "auto") return nearbyFilter;
    const same = selectedPlace?.category;
    return same && MEAL_CATEGORIES.has(same) && (nearbyCounts.get(same) ?? 0) > 0 ? same : null;
  }, [nearbyFilter, selectedPlace, nearbyCounts]);

  /** 밥 자리(식당·카페)를 고른 상태에서 밥 자리를 담으면, 새 줄이 아니라 그 자리의 세부 일정으로 넣는다 (주인 요청 2026-09-18) */
  const addsAsStep = !!selectedPlace && MEAL_CATEGORIES.has(selectedPlace.category);

  const nearby = useMemo<NearbySpot[]>(() => {
    const picked = nearbyFilterInUse
      ? nearbyLeft.filter((spot) => spot.category === nearbyFilterInUse)
      : nearbyLeft;
    return picked.slice(0, NEARBY_LIMIT);
  }, [nearbyLeft, nearbyFilterInUse]);

  /** 좌표를 아는 세부 일정의 위치 — 저장된 좌표가 없으면 안내서에서 같은 이름을 찾아 채운다 */
  const stepCoords = useCallback(
    (step: { text: string; lat?: number; lng?: number }) => {
      if (typeof step.lat === "number" && typeof step.lng === "number") {
        return { lat: step.lat, lng: step.lng };
      }
      const known = guide ? findSpotByName(guide, step.text) : undefined;
      return known ? { lat: known.lat, lng: known.lng } : null;
    },
    [guide],
  );

  /** 그 날 세부 일정 중 지도에서 자리를 보여 줄 수 있는 것 — 이 줄에만 "위치" 단추가 뜬다 (2026-09-18) */
  const pinnedStepIds = useMemo(() => {
    const ids = new Set<string>();
    for (const place of day?.places ?? []) {
      for (const step of place.steps ?? []) if (stepCoords(step)) ids.add(step.id);
    }
    return ids;
  }, [day, stepCoords]);

  /**
   * 지도에 곁들일 핀 — 이미 그 장소 아래(세부 일정)에 담아 둔 곳(초록)과 아직 안 담은 주변 추천.
   * 담고 나면 지도에서 사라져 위치를 알 수 없던 걸 고쳤다 (주인 요청 2026-09-18).
   */
  const mapSpots = useMemo<MapSpot[]>(() => {
    const picked: MapSpot[] = [];
    for (const step of selectedPlace?.steps ?? []) {
      const at = stepCoords(step);
      if (!at) continue;
      picked.push({
        id: step.id,
        name: step.text,
        category: selectedPlace?.category ?? "etc",
        ...at,
        picked: true,
      });
    }
    return [...picked, ...nearby];
  }, [selectedPlace, nearby, stepCoords]);

  // 지도에 넘길 구간 목록 — 매번 새 배열을 만들면 지도가 선을 매번 다시 긋는다 (리뷰 반영 2026-09-17)
  const routeLegs = useMemo(() => routeList.map((place) => place.transitToNext ?? undefined), [routeList]);

  /** 세부 일정의 "위치" — 그 장소를 고르고(핀이 그려지게) 지도를 그 자리로 옮긴다 (주인 요청 2026-09-18) */
  const handleShowStep = useCallback((placeId: string, stepId: string) => {
    setNearbyFilter("auto");
    setSelectedId(placeId);
    setNearbyActiveId(stepId);
    setSpotFocus((prev) => ({ id: stepId, n: (prev?.n ?? 0) + 1 }));
  }, []);

  /** 줄 클릭: 같은 줄이면 해제. (상태만 바꾼다 — 스크롤 같은 부수 효과는 아래 효과가 맡는다) */
  const handleSelect = useCallback((id: string) => {
    // 다른 장소를 고르면 추리기는 다시 "알아서"로 — 식당을 누르면 식당, 관광지를 누르면 전체 (2026-09-18)
    setNearbyFilter("auto");
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedId(null);
    setNearbyActiveId(null);
  }, []);

  /** 날짜 탭을 옮기면 고른 장소도 푼다 — 돌아왔을 때 옛 주변 칸이 갑자기 다시 열리지 않게 */
  const handleSelectDay = useCallback(
    (index: number) => {
      setDayIndex(index);
      clearSelection();
    },
    [clearSelection],
  );

  // 휴대폰(한 열)에서는 지도 카드가 화면 아래라, 고르면 그쪽으로 내려간다
  useEffect(() => {
    if (!selectedId || window.innerWidth >= 1024) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    sideColRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }, [selectedId]);

  // Esc 로 선택 해제 — 추천 창·내보내기 창이 열려 있으면 그쪽이 먼저
  useEffect(() => {
    if (!selectedId || pickerOpen || exportOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, pickerOpen, exportOpen, clearSelection]);

  // 장소 검색의 기준점 — 그 날 좌표가 있는 첫 장소. 가까운 곳이 먼저 나오게 한다.
  const searchBias = useMemo(() => {
    const found = day?.places.find(
      (place) => typeof place.lat === "number" && typeof place.lng === "number",
    );
    return found ? { lat: found.lat as number, lng: found.lng as number } : undefined;
  }, [day]);

  const totalText = useMemo(() => {
    if (!day) return "";
    const count = day.places.filter((place) => !place.isStay).length;
    const minutes = dayTransitTotal(day);
    return minutes > 0
      ? `오늘 ${dayCountLabel(count)} · 이동 ${formatMinutes(minutes)}`
      : `오늘 ${dayCountLabel(count)}`;
  }, [day]);

  if (loading) {
    return (
      <StWideShell>
        <StColumns>
          <StMainCol>
              <StPage>
                <StCard>
                  <SkeletonBlock width="min(100%, 18rem)" height="1.75rem" radius="0.6rem" />
                  <SkeletonBlock width="12rem" height="1.5rem" radius="999px" />
                </StCard>
                <StSkeletonTabs>
                  <SkeletonBlock width="6rem" height="2.25rem" radius="0.6rem" />
                  <SkeletonBlock width="6rem" height="2.25rem" radius="0.6rem" />
                  <SkeletonBlock width="6rem" height="2.25rem" radius="0.6rem" />
                </StSkeletonTabs>
                <StCard>
                  <SkeletonBlock width="100%" height="3rem" radius="0.75rem" />
                  {[0, 1, 2].map((row) => (
                    <StSkeletonRow key={row}>
                      <SkeletonBlock width="1.75rem" height="1.75rem" radius="0.5rem" />
                      <SkeletonBlock width="4rem" height="1.5rem" radius="0.5rem" />
                      <SkeletonBlock height="1.1rem" />
                    </StSkeletonRow>
                  ))}
                  <SkeletonBlock width="100%" height="2.75rem" radius="0.75rem" />
                </StCard>
              </StPage>
          </StMainCol>
          <StSideCol>
              <StStickyPanel>
                <StMapCard>
                  <SkeletonBlock width="10rem" height="1.1rem" radius="0.5rem" />
                  <SkeletonBlock height="1rem" />
                  <SkeletonBlock height="1rem" />
                  <SkeletonBlock height="1rem" width="70%" />
                </StMapCard>
              </StStickyPanel>
          </StSideCol>
          <StNearbyCol>
              <StStickyPanel>
                <StCard>
                  <SkeletonBlock width="7rem" height="1.1rem" radius="0.5rem" />
                  <SkeletonBlock height="1rem" />
                  <SkeletonBlock height="1rem" width="80%" />
                </StCard>
              </StStickyPanel>
          </StNearbyCol>
        </StColumns>
      </StWideShell>
    );
  }

  if (notFound || !plan || !day) {
    return (
      <StWideShell>
          <StPage>
            <StCard>
              <StCardTitle>🧳 여행 플랜</StCardTitle>
              <StNotice $tone="error">
                여행을 찾지 못했어요. 주소가 바뀌었거나 지워졌을 수 있어요.
              </StNotice>
              <StHint>
                <Link href="/travel">← 여행 목록으로</Link>
              </StHint>
            </StCard>
          </StPage>
      </StWideShell>
    );
  }

  const handleRemovePlace = async (placeId: string) => {
    const ok = await openConfirm("이 장소를 지울까요?");
    if (!ok) return;
    void removePlace(safeDayIndex, placeId);
  };

  return (
    <StWideShell>
      <StColumns>
        <StMainCol>
            <StPage>
              <TripHeader
                plan={plan}
                busy={busy}
                onRename={(title) => void renameTrip(title)}
                onChangeRange={changeRange}
                daysThatWouldDrop={daysThatWouldDrop}
                onOpenExport={() => setExportOpen(true)}
                onDirty={setDirty}
              />

              {error && <StNotice $tone="error">{error}</StNotice>}

              <DayTabs days={plan.days} activeIndex={safeDayIndex} onSelect={handleSelectDay} />

              <StCard>
                {/* 하루 카드 머리 줄 — 왼쪽은 그 날이 언제인지, 오른쪽은 고치기 여닫는 버튼 하나 */}
                <StDayHead>
                  <StCardTitle>
                    DAY {String(safeDayIndex + 1).padStart(2, "0")} · {dayLabel(day.date)}
                  </StCardTitle>
                  <StRowBtn
                    type="button"
                    $tone={editing ? "primary" : undefined}
                    aria-pressed={editing}
                    data-testid="edit-toggle"
                    onClick={() => setEditing((prev) => !prev)}
                  >
                    {editing ? "완료" : "✏️ 편집"}
                  </StRowBtn>
                </StDayHead>

                <StayRow
                  day={day}
                  editing={editing}
                  busy={busy}
                  onSetStay={(input) => void setStay(safeDayIndex, input)}
                  onToggleStayInRoute={() => void toggleStayInRoute(safeDayIndex)}
                  onAddStayStop={() => {
                    const stay = day.places.find((place) => place.isStay);
                    if (!stay) return;
                    const stop = stayStopInput(stay);
                    // 두 번 누르면 같은 정거장이 둘 생긴다 — 이미 있으면 알려만 준다 (리뷰 반영 2026-09-17)
                    if (day.places.some((place) => place.name === stop.name)) {
                      void openAlert("이 날에는 이미 숙소 들르기가 있어요. 자리는 ▲▼로 옮겨 주세요.");
                      return;
                    }
                    void addPlace(safeDayIndex, stop);
                  }}
                />

                <PlaceList
                  day={day}
                  editing={editing}
                  focusedId={focusedId}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                  onMove={(from, to) => void movePlace(safeDayIndex, from, to)}
                  onRemove={handleRemovePlace}
                  onMemo={(placeId, memo) => void setMemo(safeDayIndex, placeId, memo)}
                  onSteps={(placeId, steps) => void setSteps(safeDayIndex, placeId, steps)}
                  city={guide?.city ?? ""}
                  pinnedStepIds={pinnedStepIds}
                  onShowStep={handleShowStep}
                  onFocus={setFocusedId}
                  onDirty={setDirty}
                />

                {editing && (
                  <>
                    <AddPlaceForm
                      mode="place"
                      busy={busy}
                      onAdd={(input) => void addPlace(safeDayIndex, input)}
                      region={plan.region}
                      bias={searchBias}
                    />
                    {/* 검색으로 하나씩 넣는 길 바로 아래, 미리 추려 둔 곳을 한 번에 담는 길 (2026-09-17) */}
                    {guide && (
                      <StPickerRow>
                        <StRowBtn
                          type="button"
                          $tone="primary"
                          data-testid="open-spot-picker"
                          onClick={() => setPickerOpen(true)}
                        >
                          📌 {guide.city} 추천 장소에서 고르기
                        </StRowBtn>
                      </StPickerRow>
                    )}
                  </>
                )}

                <RoutePanel
                  day={day}
                  dayIndex={safeDayIndex}
                  region={plan.region}
                  busy={busy}
                  sideOf={sideOf}
                  onApply={setTransit}
                />

                <StDayTotal>{totalText}</StDayTotal>
              </StCard>

              {/* 날짜 미정·일정에서 뺀 곳. 비어 있으면 안 그린다 */}
              <PoolCard
                pool={plan.pool}
                dayIndex={safeDayIndex}
                busy={busy}
                onMove={movePoolToDay}
                onRemove={removeFromPool}
              />
            </StPage>
        </StMainCol>

        <StSideCol ref={sideColRef}>
            <StStickyPanel>
              {/* 구간 이동 시간은 동선 순서 그대로 넘긴다. 아직 못 구한 칸은 비어 있다. */}
              <RouteMap
                places={routeList}
                /* 손을 올린 곳이 없으면 클릭으로 고른 곳을 따라간다 */
                focusedId={focusedId ?? selectedId}
                onFocus={setFocusedId}
                /* 아직 못 구한 칸은 비어 있다 — 순서가 어긋나면 안 되므로 빈칸을 빼지 않고 그대로 둔다 */
                legs={routeLegs}
                region={plan.region}
                selectedId={selectedPlace ? selectedPlace.id : null}
                nearby={mapSpots}
                spotFocus={spotFocus}
                nearbyActiveId={nearbyActiveId}
                onNearbyHover={setNearbyActiveId}
              />
            </StStickyPanel>
        </StSideCol>

        {/* 세 번째 칸 — 주변 추천. 고른 장소가 없으면 무엇을 하면 되는지 한 줄로 알려 준다 (주인 요청 2026-09-18) */}
        <StNearbyCol>
            <StStickyPanel>
              <StCard>
              {selectedPlace ? (
                <NearbyPanel
                  anchor={selectedPlace}
                  nearby={nearby}
                  hasGuide={guide !== null}
                  city={guide?.city ?? ""}
                  hasCoords={selectedHasCoords}
                  radiusM={NEARBY_RADIUS_M}
                  counts={nearbyCounts}
                  filter={nearbyFilterInUse}
                  onFilter={setNearbyFilter}
                  activeId={nearbyActiveId}
                  onHover={setNearbyActiveId}
                  busy={busy}
                  addsAsStep={addsAsStep}
                  onAdd={(spot, where) => {
                    // "아래"는 고른 장소의 세부 일정으로, "동선"은 바로 다음 줄에 새 장소로
                    if (where === "step") {
                      const steps = selectedPlace.steps ?? [];
                      if (steps.length >= MAX_PLACE_STEPS) {
                        return Promise.resolve(`세부 일정은 ${MAX_PLACE_STEPS}개까지예요.`);
                      }
                      return setSteps(safeDayIndex, selectedPlace.id, [
                        ...steps,
                        { id: newPlaceId(), text: spot.name, lat: spot.lat, lng: spot.lng },
                      ]);
                    }
                    return insertPlaceAfter(safeDayIndex, selectedPlace.id, {
                      name: spot.name,
                      category: spot.category,
                      lat: spot.lat,
                      lng: spot.lng,
                      address: spot.address,
                      memo: spot.tip,
                    });
                  }}
                  onClose={clearSelection}
                />
              ) : (
                <>
                  <StCardTitle>📍 주변 추천</StCardTitle>
                  <StHint>왼쪽에서 장소를 누르면 그 둘레의 추천 장소가 여기에 나와요.</StHint>
                </>
              )}
              </StCard>
            </StStickyPanel>
        </StNearbyCol>
      </StColumns>

      {exportOpen && <ExportModal plan={plan} onClose={() => setExportOpen(false)} />}
      {pickerOpen && guide && (
        <SpotPicker
          guide={guide}
          plan={plan}
          defaultDayIndex={safeDayIndex}
          busy={busy}
          onAdd={addPlaces}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </StWideShell>
  );
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
