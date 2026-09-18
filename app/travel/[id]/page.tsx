"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SkeletonBlock } from "@/components/common/Skeleton";
import { useModal } from "@/components/common/ModalProvider";
import { NEARBY_RADIUS_M, findGuide, nearbySpots, placedDayByName, sideAt, spotNameKey } from "../lib/guides";
import type { NearbySpot } from "../lib/guides";
import { dayCountLabel, dayLabel, routePlaces, stayStopInput } from "../lib/plan";
import { dayTransitTotal, formatMinutes } from "../lib/routeLegs";
import AddPlaceForm from "./components/AddPlaceForm";
import DayTabs from "./components/DayTabs";
import ExportModal from "./components/ExportModal";
import NearbyPanel from "./components/NearbyPanel";
import PoolCard from "./components/PoolCard";
import PlaceList from "./components/PlaceList";
import RouteMap from "./components/RouteMap";
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
  StSideCol,
} from "./page.styles";

// 여행 방 화면. 왼쪽은 날짜별 목록, 오른쪽은 그 날 도는 순서(지도). 1024px 이상에서 반반(5:5)으로 나눈다.
// 1024px 아래에서는 오른쪽 칸이 왼쪽 아래로 내려온다.
// 평소에는 "보기" 상태라 목록이 조용하고, 오른쪽 위 "편집"을 눌러야 순서·삭제·추가 버튼이 나온다.
// 편집 상태는 날짜 탭을 옮겨도 그대로 유지된다(하루씩 다시 켜지 않아도 되게). (2026-09-16)

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
    setStay,
    toggleStayInRoute,
    setTransit,
    renameTrip,
    changeRange,
    daysThatWouldDrop,
  } = useTravelPlan(id);

  const [dayIndex, setDayIndex] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  // 클릭으로 고른 장소 — 지도가 그곳으로 확대되고 아래에 "주변 추천" 칸이 열린다. 손 올리기(focusedId)와는 별개 (2026-09-17)
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 주변 칸 줄 ↔ 지도 핀이 서로 가리키는 장소
  const [nearbyActiveId, setNearbyActiveId] = useState<string | null>(null);
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
  const nearby = useMemo<NearbySpot[]>(() => {
    if (!guide || !plan || !selectedPlace || !selectedHasCoords) return [];
    // 일정에 있는 곳 + 일정에서 뺀 후보(pool)는 주변 추천에 다시 띄우지 않는다 — 방금 뺀 곳이 또 올라오면 헷갈린다 (주인 요청 2026-09-17)
    const skip = new Map(placedDayByName(plan));
    for (const place of plan.pool) {
      const key = spotNameKey(place.name);
      if (!skip.has(key)) skip.set(key, -1);
    }
    return nearbySpots(guide, { lat: selectedPlace.lat as number, lng: selectedPlace.lng as number }, skip);
  }, [guide, plan, selectedPlace, selectedHasCoords]);

  // 지도에 넘길 구간 목록 — 매번 새 배열을 만들면 지도가 선을 매번 다시 긋는다 (리뷰 반영 2026-09-17)
  const routeLegs = useMemo(() => routeList.map((place) => place.transitToNext ?? undefined), [routeList]);

  /** 줄 클릭: 같은 줄이면 해제. (상태만 바꾼다 — 스크롤 같은 부수 효과는 아래 효과가 맡는다) */
  const handleSelect = useCallback((id: string) => {
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
                nearby={nearby}
                nearbyActiveId={nearbyActiveId}
                onNearbyHover={setNearbyActiveId}
              >
              {selectedPlace && (
                <NearbyPanel
                  anchor={selectedPlace}
                  nearby={nearby}
                  hasGuide={guide !== null}
                  city={guide?.city ?? ""}
                  hasCoords={selectedHasCoords}
                  radiusM={NEARBY_RADIUS_M}
                  activeId={nearbyActiveId}
                  onHover={setNearbyActiveId}
                  busy={busy}
                  onAdd={(spot) =>
                    insertPlaceAfter(safeDayIndex, selectedPlace.id, {
                      name: spot.name,
                      category: spot.category,
                      lat: spot.lat,
                      lng: spot.lng,
                      address: spot.address,
                      memo: spot.tip,
                    })
                  }
                  onClose={clearSelection}
                />
              )}
              </RouteMap>
            </StStickyPanel>
        </StSideCol>
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
