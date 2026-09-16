"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SkeletonBlock } from "@/components/common/Skeleton";
import { useModal } from "@/components/common/ModalProvider";
import { dayCountLabel, dayLabel, routePlaces } from "../lib/plan";
import { dayTransitTotal, formatMinutes } from "../lib/routeLegs";
import AddPlaceForm from "./components/AddPlaceForm";
import DayTabs from "./components/DayTabs";
import ExportModal from "./components/ExportModal";
import PlaceList from "./components/PlaceList";
import RouteMap from "./components/RouteMap";
import RoutePanel from "./components/RoutePanel";
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
  const { openConfirm } = useModal();

  const {
    plan,
    loading,
    notFound,
    busy,
    error,
    setDirty,
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
  } = useTravelPlan(id);

  const [dayIndex, setDayIndex] = useState(0);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  // 하루 카드를 고치는 중인지. 날짜 탭을 옮겨도 그대로 둔다.
  const [editing, setEditing] = useState(false);

  // 기간을 줄여 날 수가 적어지면 보고 있던 탭이 사라질 수 있어, 남은 마지막 날로 자동으로 당겨 본다
  const safeDayIndex = plan ? Math.min(dayIndex, Math.max(0, plan.days.length - 1)) : 0;
  const day = plan?.days[safeDayIndex] ?? null;

  const routeList = useMemo(() => (day ? routePlaces(day) : []), [day]);

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

              <DayTabs days={plan.days} activeIndex={safeDayIndex} onSelect={setDayIndex} />

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
                />

                <PlaceList
                  day={day}
                  editing={editing}
                  focusedId={focusedId}
                  onMove={(from, to) => void movePlace(safeDayIndex, from, to)}
                  onRemove={handleRemovePlace}
                  onMemo={(placeId, memo) => void setMemo(safeDayIndex, placeId, memo)}
                  onFocus={setFocusedId}
                  onDirty={setDirty}
                />

                {editing && (
                  <AddPlaceForm
                    mode="place"
                    busy={busy}
                    onAdd={(input) => void addPlace(safeDayIndex, input)}
                    region={plan.region}
                    bias={searchBias}
                  />
                )}

                <RoutePanel
                  day={day}
                  dayIndex={safeDayIndex}
                  region={plan.region}
                  busy={busy}
                  onApply={setTransit}
                />

                <StDayTotal>{totalText}</StDayTotal>
              </StCard>
            </StPage>
        </StMainCol>

        <StSideCol>
            <StStickyPanel>
              {/* 구간 이동 시간은 동선 순서 그대로 넘긴다. 아직 못 구한 칸은 비어 있다. */}
              <RouteMap
                places={routeList}
                focusedId={focusedId}
                onFocus={setFocusedId}
                /* 아직 못 구한 칸은 비어 있다 — 순서가 어긋나면 안 되므로 빈칸을 빼지 않고 그대로 둔다 */
                legs={routeList.map((place) => place.transitToNext ?? undefined)}
                region={plan.region}
              />
            </StStickyPanel>
        </StSideCol>
      </StColumns>

      {exportOpen && <ExportModal plan={plan} onClose={() => setExportOpen(false)} />}
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
