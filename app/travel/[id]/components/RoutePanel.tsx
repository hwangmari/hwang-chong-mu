"use client";

import { useMemo, useState } from "react";
import {
  buildLegRequests,
  dayTransitTotal,
  fetchRouteLegs,
  formatDistance,
  formatMinutes,
  type RouteMode,
  type SideOf,
} from "../../lib/routeLegs";
import { routePlaces } from "../../lib/plan";
import type { TransitLeg, TransitMode, TravelDay } from "../../types";
import {
  StCardTitle,
  StHint,
  StLegLabel,
  StLegList,
  StLegMain,
  StLegRow,
  StLegSummary,
  StModeBtn,
  StModeSeg,
  StNotice,
  StQuietTag,
  StRouteBtn,
  StRouteCard,
  StRouteControls,
  StRowBtn,
  StRouteFoot,
  StRouteHead,
  StRouteLegend,
} from "../page.styles";

// 하루 카드 안의 "이동 시간" 칸. 동선 순서대로 구간을 늘어놓고, 한 번 눌러 통째로 채운다.
// 상자를 또 두르지 않으려고 카드가 아니라 머리카락 한 줄로 나눈 칸으로 만들었다.
// 수단 고르는 칸(자동/도보/대중교통/차량)은 평소 접어 둔다 — 거의 늘 "자동"이라 조회 버튼만 보이면 된다.
// "수단 직접 고르기"를 눌러야 펼쳐지고, 자동이 아닌 수단을 골라 접으면 "도보 기준" 꼬리표로 알려 준다. (2026-09-16)

type RoutePanelProps = {
  day: TravelDay;
  dayIndex: number;
  /** 나라 코드(길찾기 정확도를 올린다). 빈 값이면 나라를 좁히지 않는다. */
  region?: string;
  busy?: boolean;
  /** 도시를 가르는 강이 있으면 좌표가 어느 쪽인지 — 강 건너는 구간을 도보로 계산하지 않게 (2026-09-17) */
  sideOf?: SideOf;
  onApply: (dayIndex: number, updates: Record<string, TransitLeg | null>) => unknown;
};

const MODE_OPTIONS: { value: RouteMode; label: string }[] = [
  { value: "AUTO", label: "자동" },
  { value: "WALK", label: "도보" },
  { value: "TRANSIT", label: "대중교통" },
  { value: "DRIVE", label: "차량" },
];

const MODE_TEXT: Record<TransitMode, string> = {
  WALK: "🚶 도보",
  TRANSIT: "🚆 대중교통",
  DRIVE: "🚗 차량",
};

// 길찾기가 실패한 까닭별 안내. 영문 그대로 보여 주지 않는다.
const FAIL_TEXT: Record<string, string> = {
  NO_KEY: "이동 시간은 구글 열쇠를 넣으면 계산돼요",
  RATE: "조회가 너무 잦아요, 잠시 후 다시 눌러 주세요",
  FAIL: "이동 시간을 가져오지 못했어요",
};

export default function RoutePanel({
  day,
  dayIndex,
  region,
  busy = false,
  sideOf,
  onApply,
}: RoutePanelProps) {
  const [mode, setMode] = useState<RouteMode>("AUTO");
  // 수단 고르는 칸을 펼쳤는지. 기본은 접힌 상태이고 수단은 "자동"이다.
  const [pickerOpen, setPickerOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [failText, setFailText] = useState("");

  // 꼬리표에 쓸 이름 ("도보" / "대중교통" / "차량")
  const modeLabel = MODE_OPTIONS.find((option) => option.value === mode)?.label ?? "";

  const route = useMemo(() => routePlaces(day), [day]);
  const requests = useMemo(() => buildLegRequests(route, mode, sideOf), [route, mode, sideOf]);

  // 왼쪽 목록과 같은 표시를 쓴다 — 숙소는 번호 없이 🏨, 나머지는 숙소를 뺀 1부터.
  // 숙소는 동선의 끝이라 마지막 구간 이름이 "n → 🏨"(숙소 복귀)이 된다.
  const marks = useMemo(() => {
    const labels: string[] = [];
    let number = 0;
    for (const place of route) {
      if (place.isStay) {
        labels.push("🏨");
      } else {
        number += 1;
        labels.push(String(number));
      }
    }
    return labels;
  }, [route]);

  // 마지막 장소에는 "다음 구간"이 없으므로 구간 수는 장소 수보다 하나 적다
  const legs = route.slice(0, -1).map((place) => place.transitToNext ?? null);
  const hasAny = legs.some((leg) => leg !== null);
  const total = dayTransitTotal(day);
  const canFetch = requests.length > 0 && !fetching && !busy;

  const handleFetch = async () => {
    if (!canFetch) return;
    setFetching(true);
    setFailText("");
    try {
      // 못 구한 구간은 null 로 함께 저장한다 — 예전 값이 남아 있으면 지금 동선과 맞지 않는다
      const updates = await fetchRouteLegs(requests, region, sideOf);
      await onApply(dayIndex, updates);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "FAIL";
      setFailText(FAIL_TEXT[reason] ?? FAIL_TEXT.FAIL);
    } finally {
      setFetching(false);
    }
  };

  return (
    <StRouteCard>
      <StRouteHead>
        <StCardTitle>🚌 이동 시간</StCardTitle>

        <StRouteControls>
          <StRouteBtn type="button" disabled={!canFetch} onClick={() => void handleFetch()}>
            {fetching ? "조회 중…" : hasAny ? "다시 조회" : "AI 교통편 적용"}
          </StRouteBtn>

          {/* 자동이 아닌 수단을 골라 두었으면 그 사실만 조용히 알려 준다 (칸을 접어도 남는다) */}
          {mode !== "AUTO" && <StQuietTag data-testid="mode-tag">{modeLabel} 기준</StQuietTag>}

          {pickerOpen && (
            <StModeSeg role="group" aria-label="이동 수단" data-testid="mode-seg">
              {MODE_OPTIONS.map((option) => (
                <StModeBtn
                  key={option.value}
                  type="button"
                  $active={mode === option.value}
                  aria-pressed={mode === option.value}
                  disabled={fetching}
                  onClick={() => setMode(option.value)}
                >
                  {option.label}
                </StModeBtn>
              ))}
            </StModeSeg>
          )}

          <StRowBtn
            type="button"
            aria-expanded={pickerOpen}
            data-testid="mode-toggle"
            onClick={() => {
              // 접을 때는 "자동으로" 되돌린다 — 접힌 채 다른 수단이 남아 있으면 헷갈린다
              if (pickerOpen) setMode("AUTO");
              setPickerOpen((prev) => !prev);
            }}
          >
            {pickerOpen ? "자동으로" : "수단 직접 고르기"}
          </StRowBtn>
        </StRouteControls>
      </StRouteHead>

      {/* 중국은 구글 지도가 대중교통 노선을 아예 갖고 있지 않아(2026-09-17 직접 확인: 상하이 전 구간 "길 없음")
          자동 모드는 차량으로 대신 계산되고, 대중교통을 직접 고르면 비어 있다. 현지 앱을 보라고 늘 알려 준다. (주인 요청 2026-09-17) */}
      {region === "CN" && (
        <StHint data-testid="cn-hint">
          중국은 구글 지도에 대중교통 정보가 없어 이동 시간이 정확하지 않을 수 있어요. 현지 이동은
          고덕지도(高德地图) 앱을 참고해 주세요.
        </StHint>
      )}

      {requests.length === 0 ? (
        <StHint>좌표 있는 장소가 2곳 이상이면 이동 시간을 계산해요.</StHint>
      ) : (
        <>
          {failText && <StNotice $tone="error">{failText}</StNotice>}

          <StLegList>
            {legs.map((leg, index) => (
              <StLegRow key={route[index].id}>
                <StLegLabel>
                  {marks[index]} → {marks[index + 1]}
                </StLegLabel>
                <StLegMain $quiet={!leg}>
                  {leg
                    ? `${MODE_TEXT[leg.mode]} ${leg.minutes}분${
                        leg.summary ? "" : ` · ${formatDistance(leg.meters)}`
                      }`
                    : "—"}
                </StLegMain>
                <StLegSummary>{leg?.summary ?? ""}</StLegSummary>
              </StLegRow>
            ))}
          </StLegList>

          <StRouteFoot>오늘 이동 합계 {formatMinutes(total)}</StRouteFoot>
        </>
      )}

      <StRouteLegend>
        <span>🚶 도보</span>
        <span>🚆 대중교통</span>
        <span>🚗 차량</span>
      </StRouteLegend>
    </StRouteCard>
  );
}
