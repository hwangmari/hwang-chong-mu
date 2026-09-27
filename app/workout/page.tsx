"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  deleteActivityRecord,
  deleteGymRecord,
  deleteRunningRecord,
  fetchActivityRecords,
  fetchGymRecords,
  fetchRunningRecords,
} from "./repository";
import {
  buildWorkoutCalendar,
  computeExercisePRs,
  computeRunningBest,
  formatDuration,
  formatDurationMin,
  formatPace,
  gymRecordVolumeKg,
} from "./helpers";
import {
  WorkoutCalendarHeatmap,
  WorkoutMonthlyCalendar,
} from "./components/WorkoutCharts";
import FooterGuide from "@/components/common/FooterGuide";
import { WORKOUT_GUIDE_DATA } from "@/data/footerGuides";
import { useModal } from "@/components/common/ModalProvider";
import { SkeletonBlock } from "@/components/common/Skeleton";
import {
  GYM_BODY_PART_LABEL,
  type ActivityRecord,
  type GymBodyPart,
  type GymRecord,
  type RunningRecord,
} from "./types";
import { useWorkoutSession } from "./useWorkoutSession";
import { StCol, StTwoCol } from "./components/WorkoutSharedStyles";

export default function WorkoutHomePage() {
  const router = useRouter();
  const { openConfirm } = useModal();
  const session = useWorkoutSession();
  const [runs, setRuns] = useState<RunningRecord[]>([]);
  const [gyms, setGyms] = useState<GymRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showAllPRs, setShowAllPRs] = useState(false);
  const [prBodyFilter, setPrBodyFilter] = useState<GymBodyPart | "all">("all");
  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [r, g, a] = await Promise.all([
        fetchRunningRecords(session.roomId),
        fetchGymRecords(session.roomId),
        fetchActivityRecords(session.roomId),
      ]);
      setRuns(r);
      setGyms(g);
      setActivities(a);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "기록을 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    load();
  }, [session, load]);

  async function handleDelete(kind: "run" | "gym" | "activity", id: string) {
    if (!(await openConfirm("이 기록을 삭제할까요?"))) return;
    setBusy(true);
    try {
      if (kind === "run") await deleteRunningRecord(id);
      else if (kind === "gym") await deleteGymRecord(id);
      else await deleteActivityRecord(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했어요.");
    } finally {
      setBusy(false);
    }
  }

  function handleEdit(kind: "run" | "gym" | "activity", id: string) {
    const path =
      kind === "run"
        ? "/workout/run"
        : kind === "gym"
          ? "/workout/weight"
          : "/workout/activity";
    router.push(`${path}?edit=${id}`);
  }

  if (!session) return null;

  const runBest = computeRunningBest(runs);
  const allPRsUnfiltered = computeExercisePRs(gyms);
  const allPRs =
    prBodyFilter === "all"
      ? allPRsUnfiltered
      : allPRsUnfiltered.filter((pr) => pr.bodyPart === prBodyFilter);
  const prs = showAllPRs
    ? [...allPRs].sort((a, b) =>
        a.exerciseName.localeCompare(b.exerciseName, "ko"),
      )
    : allPRs.slice(0, 3);
  const hasMorePRs = allPRs.length > 3;

  const calendarColumns = buildWorkoutCalendar(
    runs.map((r) => r.date),
    [...gyms.map((g) => g.date), ...activities.map((a) => a.date)],
    52,
  );
  const recentItems: Array<
    | { kind: "run"; data: RunningRecord }
    | { kind: "gym"; data: GymRecord }
    | { kind: "activity"; data: ActivityRecord }
  > = [
    ...runs.map((r) => ({ kind: "run" as const, data: r })),
    ...gyms.map((g) => ({ kind: "gym" as const, data: g })),
    ...activities.map((a) => ({ kind: "activity" as const, data: a })),
  ]
    .sort((a, b) => (a.data.date < b.data.date ? 1 : -1))
    .slice(0, 5);

  /** 기록하기 버튼 세 개 — 폰(맨 위)과 PC(오른쪽 칸)에서 같이 쓴다 */
  const ctaButtons = (
    <>
      <StCTA href="/workout/run">
        <StCTAEmoji>🏃‍♀️</StCTAEmoji>
        <StCTAText>러닝 기록하기</StCTAText>
      </StCTA>
      <StCTA href="/workout/weight">
        <StCTAEmoji>🏋️‍♂️</StCTAEmoji>
        <StCTAText>웨이트 기록하기</StCTAText>
      </StCTA>
      {/* 옆 글자(StCTAPlusText)는 900px 미만에서 display:none 이라 읽히지 않는다.
          PC 는 그 글자가, 폰은 aria-label 이 이 링크의 이름이 된다 — 둘이 같은 말이라 겹쳐도 무해 */}
      <StCTAPlus href="/workout/activity" aria-label="활동 기록하기">
        <span aria-hidden>+</span>
        <StCTAPlusText>활동 기록하기</StCTAPlusText>
      </StCTAPlus>
    </>
  );

  return (
    <StPage>
      <StHeader>
        <StHello>안녕, {session.roomName}!</StHello>
        <StTagline>꾸준함이 쌓여 당신을 바꿔요. 오늘도 +1 💪</StTagline>
      </StHeader>

      {error ? <StError>{error}</StError> : null}

      {/* 폰·좁은 창에서는 예전처럼 맨 위 한 줄 */}
      <StCTAGrid $place="top">{ctaButtons}</StCTAGrid>

      {/* PC 에서는 달력(왼쪽) | 최근 기록·PR(오른쪽) 두 칸 — 넓은 화면에서 세로로 길어지지 않게 (주인 요청 2026-09-22) */}
      <StTwoCol $ratio="wide">
        <StCol>
          <WorkoutMonthlyCalendar
            runs={runs}
            gyms={gyms}
            activities={activities}
            onSaved={load}
          />
        </StCol>
        <StCol>
          {/* 기록하기 버튼 — PC 는 달력 옆 오른쪽 칸 맨 위에 세로로 (주인 요청 2026-09-22) */}
          <StCTAGrid $place="side">{ctaButtons}</StCTAGrid>
          <StSection>
            <StSectionTitle>📝 최근 기록</StSectionTitle>
            {recentItems.length ? (
              <StRecentList>
                {recentItems.map((item) => (
                  <StRecentRow key={`${item.kind}-${item.data.id}`}>
                    <StRecentBadge $kind={item.kind}>
                      {item.kind === "run"
                        ? "러닝"
                        : item.kind === "gym"
                          ? "헬스"
                          : "활동"}
                    </StRecentBadge>
                    <StRecentTitle>
                      {item.kind === "run"
                          ? `${item.data.distanceKm.toFixed(1)}km · ${formatDuration(
                              item.data.durationSec,
                            )}`
                          : item.kind === "gym"
                            ? (() => {
                                const volumeKg = Math.round(
                                  gymRecordVolumeKg(item.data),
                                );
                                return [
                                  item.data.bodyPart
                                    ? GYM_BODY_PART_LABEL[item.data.bodyPart]
                                    : null,
                                  `${item.data.exercises.length}개 운동`,
                                  volumeKg > 0
                                    ? `${volumeKg.toLocaleString()}kg`
                                    : null,
                                  item.data.durationMin
                                    ? formatDurationMin(item.data.durationMin)
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" · ");
                              })()
                            : [
                                item.data.activityName,
                                item.data.durationMin
                                  ? formatDurationMin(item.data.durationMin)
                                  : null,
                                item.data.calories
                                  ? `${item.data.calories}kcal`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")}
                    </StRecentTitle>
                    <StRecentDate>{item.data.date}</StRecentDate>
                    <StRecentActions>
                      <StRowBtn
                        type="button"
                        onClick={() => handleEdit(item.kind, item.data.id)}
                        disabled={busy}
                      >
                        수정
                      </StRowBtn>
                      <StRowBtn
                        type="button"
                        $danger
                        onClick={() => handleDelete(item.kind, item.data.id)}
                        disabled={busy}
                      >
                        삭제
                      </StRowBtn>
                    </StRecentActions>
                  </StRecentRow>
                ))}
              </StRecentList>
            ) : loading ? (
              <StRecentList aria-busy="true">
                <SkeletonBlock height="2.6rem" radius="0.8rem" />
                <SkeletonBlock height="2.6rem" radius="0.8rem" />
                <SkeletonBlock height="2.6rem" radius="0.8rem" />
              </StRecentList>
            ) : (
              <StEmpty>
                아직 기록이 없어요. <Link href="/workout/run">러닝</Link> 또는{" "}
                <Link href="/workout/weight">웨이트</Link>에서 첫 기록을
                남겨보세요!
              </StEmpty>
            )}
          </StSection>
        </StCol>
      </StTwoCol>

      {/* PR 은 카드 하나로 — 왼쪽 러닝 | 가는 선 | 오른쪽 헬스 (테두리는 카드 하나, 주인 요청 2026-09-22) */}
      <StSection>
        <StSectionTitle>🏆 PR</StSectionTitle>
        <StPRSplit>
          <StPRPart>
            <StPRPartTitle>🏃‍♀️ 러닝</StPRPartTitle>
            {runBest ? (
              <StPRList>
                <StPRRow>
                  <StPRName>최장 거리</StPRName>
                  <StPRValue>
                    {runBest.longestDistanceKm.toFixed(1)} km
                    <StPRDate>({runBest.longestAt})</StPRDate>
                  </StPRValue>
                </StPRRow>
                <StPRRow>
                  <StPRName>최고 페이스</StPRName>
                  <StPRValue>
                    {formatPace(runBest.bestPaceSec)}
                    <StPRDate>({runBest.bestPaceAt})</StPRDate>
                  </StPRValue>
                </StPRRow>
              </StPRList>
            ) : (
              <StEmpty>아직 러닝 기록이 없어요.</StEmpty>
            )}
          </StPRPart>

          <StPRPart>
            <StPRPartTitle>💪 헬스 Top PR</StPRPartTitle>
            {allPRsUnfiltered.length ? (
              <StPRFilterRow>
                <StPRFilterChip
                  type="button"
                  $active={prBodyFilter === "all"}
                  onClick={() => setPrBodyFilter("all")}
                >
                  전체
                </StPRFilterChip>
                {(
                  Object.entries(GYM_BODY_PART_LABEL) as [GymBodyPart, string][]
                ).map(([value, label]) => (
                  <StPRFilterChip
                    key={value}
                    type="button"
                    $active={prBodyFilter === value}
                    onClick={() => setPrBodyFilter(value)}
                  >
                    {label}
                  </StPRFilterChip>
                ))}
              </StPRFilterRow>
            ) : null}
            {prs.length ? (
              <>
                <StPRList $twoUp>
                  {prs.map((pr) =>
                    pr.durationSec !== undefined ? (
                      <StPRRow key={pr.exerciseName}>
                        <StPRName>{pr.exerciseName}</StPRName>
                        <StPRValue>
                          {pr.durationSec}초 <StPRSmall>(최대 시간)</StPRSmall>
                          <StPRDate>
                            {pr.weight > 0 ? `${pr.weight}kg·` : ""}
                            {pr.durationSec}초 · {pr.achievedAt}
                          </StPRDate>
                        </StPRValue>
                      </StPRRow>
                    ) : (
                      <StPRRow key={pr.exerciseName}>
                        <StPRName>{pr.exerciseName}</StPRName>
                        <StPRValue>
                          {pr.weight} kg <StPRSmall>(최대 무게)</StPRSmall>
                          <StPRDate>
                            {pr.weight}×{pr.reps} · {pr.achievedAt}
                          </StPRDate>
                        </StPRValue>
                      </StPRRow>
                    ),
                  )}
                </StPRList>
                {hasMorePRs ? (
                  <StPRMoreBtn
                    type="button"
                    onClick={() => setShowAllPRs((v) => !v)}
                  >
                    {showAllPRs
                      ? "접기 ▲"
                      : `더보기 (전체 ${allPRs.length}개, 운동명 순) ▼`}
                  </StPRMoreBtn>
                ) : null}
              </>
            ) : allPRsUnfiltered.length ? (
              <StEmpty>
                {GYM_BODY_PART_LABEL[prBodyFilter as GymBodyPart] ?? ""} 부위로
                기록된 PR이 아직 없어요.
              </StEmpty>
            ) : (
              <StEmpty>아직 헬스 기록이 없어요.</StEmpty>
            )}
          </StPRPart>
        </StPRSplit>
      </StSection>

      <WorkoutCalendarHeatmap columns={calendarColumns} />

      <StBlogWrap>
        <FooterGuide
          title={WORKOUT_GUIDE_DATA.title}
          story={WORKOUT_GUIDE_DATA.story}
          tips={WORKOUT_GUIDE_DATA.tips}
          blogGuideId="workout-guide"
        />
      </StBlogWrap>
    </StPage>
  );
}

const StPage = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const StHeader = styled.header`
  padding: 0.5rem 0.25rem;

  @media (max-width: 540px) {
    padding: 0.5rem 1rem;
  }
`;

const StHello = styled.h1`
  font-size: 1.4rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StTagline = styled.p`
  margin-top: 0.25rem;
  font-size: 0.88rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StError = styled.p`
  color: ${({ theme }) => theme.colors.rose600};
  background: ${({ theme }) => theme.colors.rose50};
  padding: 0.75rem 1rem;
  border-radius: 0.8rem;
  font-size: 0.85rem;
  font-weight: 700;
`;

const StSection = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1.1rem;
  padding: 1rem 1.1rem;

  @media (max-width: 540px) {
    border: none;
    border-radius: 0;
  }
`;

const StSectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.8rem;
`;

/* PR 카드 안: 러닝(1) | 헬스(2) — PC 에서는 가는 세로선 하나로 나누고, 폰에서는 가는 가로선 */
const StPRSplit = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;

  @media (min-width: 900px) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
    gap: 0;

    & > * + * {
      border-left: 1px solid ${({ theme }) => theme.colors.gray100};
      padding-left: 1.2rem;
    }

    & > :first-child {
      padding-right: 1.2rem;
    }
  }

  @media (max-width: 899px) {
    & > * + * {
      border-top: 1px solid ${({ theme }) => theme.colors.gray100};
      padding-top: 1rem;
    }
  }
`;

const StPRPart = styled.div`
  min-width: 0;
`;

const StPRPartTitle = styled.h3`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  margin-bottom: 0.6rem;
`;

/* $twoUp: 운동이 많은 '헬스 Top PR' 용. 한 칸으로 늘어뜨리면 목록이 길어지고
   이름과 무게 사이가 크게 벌어져서, 넓은 화면에서는 두 칸으로 나눈다 (주인 요청 2026-09-23) */
const StPRList = styled.div<{ $twoUp?: boolean }>`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.55rem;

  ${({ $twoUp }) =>
    $twoUp
      ? `
    @media (min-width: 900px) {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: 1.6rem;
      row-gap: 0.75rem;
    }
  `
      : ""}
`;

const StPRRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 0.5rem;
`;

const StPRName = styled.span`
  min-width: 0;
  font-size: 0.88rem;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
  word-break: keep-all;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StPRValue = styled.span`
  font-size: 0.88rem;
  font-weight: 800;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.colors.blue600};
  text-align: right;
`;

const StPRSmall = styled.span`
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  margin-left: 0.2rem;
`;

const StPRDate = styled.span`
  display: block;
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 0.15rem;
`;

const StPRFilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-bottom: 0.7rem;
`;

const StPRFilterChip = styled.button<{ $active: boolean }>`
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.blue500 : theme.colors.gray200};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.blue50 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray500};
  font-size: 0.72rem;
  font-weight: 800;
  padding: 0.32rem 0.6rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.12s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StPRMoreBtn = styled.button`
  margin-top: 0.7rem;
  width: 100%;
  border: 1px dashed ${({ theme }) => theme.colors.gray200};
  background: transparent;
  color: ${({ theme }) => theme.colors.blue600};
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.55rem;
  border-radius: 0.6rem;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.blue50};
    border-color: ${({ theme }) => theme.colors.blue200};
  }
`;

const StEmpty = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};

  a {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 700;
  }
`;

const StRecentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

/* 요약 줄이 잘리지 않게 두 행으로 — 위: 요약(뱃지 옆 전체 폭), 아래: 날짜 | 수정·삭제.
   예전에는 한 줄에 다 넣느라 "가슴 · 3개 운동 · 3,882kg · 55분"이 절반만 보였다 (2026-09-23) */
const StRecentRow = styled.div`
  display: grid;
  grid-template-columns: 2.2rem minmax(0, 1fr) auto;
  grid-template-areas:
    "badge summary summary"
    "badge date actions";
  align-items: center;
  gap: 0.2rem 0.75rem;
`;

const StRecentBadge = styled.span<{ $kind: "run" | "gym" | "activity" }>`
  grid-area: badge;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 0.6rem;
  display: grid;
  place-items: center;
  font-size: 0.7rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.white};
  flex-shrink: 0;
  background: ${({ $kind }) =>
    $kind === "run" ? "#3aa675" : $kind === "gym" ? "#e07a3a" : "#7c6ae0"};
`;

const StRecentTitle = styled.p`
  grid-area: summary;
  min-width: 0;
  /* 활동 종목은 자유 입력이라 띄어쓰기 없는 긴 글자가 올 수 있다 */
  overflow-wrap: anywhere;
  word-break: keep-all;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.4;
  color: ${({ theme }) => theme.colors.gray800};
`;

const StRecentDate = styled.p`
  grid-area: date;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StRecentActions = styled.div`
  grid-area: actions;
  display: flex;
  gap: 0.3rem;
  flex-shrink: 0;
`;

const StRowBtn = styled.button<{ $danger?: boolean }>`
  border: 1px solid
    ${({ theme, $danger }) =>
      $danger ? theme.colors.rose200 : theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme, $danger }) =>
    $danger ? theme.colors.rose600 : theme.colors.gray600};
  padding: 0.3rem 0.6rem;
  border-radius: 0.45rem;
  font-size: 0.72rem;
  font-weight: 800;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StCTAGrid = styled.div<{ $place: "top" | "side" }>`
  display: ${({ $place }) => ($place === "top" ? "grid" : "none")};
  grid-template-columns: 1fr 1fr auto;
  gap: 0.7rem;

  /* PC 에서는 오른쪽 좁은 칸에 한 줄에 하나씩 — 맨 위 줄은 숨긴다 */
  @media (min-width: 900px) {
    display: ${({ $place }) => ($place === "side" ? "grid" : "none")};
    grid-template-columns: minmax(0, 1fr);
    gap: 0.5rem;
  }

  @media (max-width: 540px) {
    padding: 0 1rem;
  }

  @media (max-width: 500px) {
    gap: 0.5rem;
  }
`;

const StCTA = styled(Link)`
  min-width: 0;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  padding: 1.1rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
    transform: translateY(-2px);
  }

  @media (max-width: 500px) {
    padding: 0.85rem 0.7rem;
    gap: 0.5rem;
  }

  @media (min-width: 900px) {
    padding: 0.7rem 1rem;
  }
`;

const StCTAEmoji = styled.span`
  font-size: 1.5rem;
  flex-shrink: 0;

  @media (max-width: 500px) {
    font-size: 1.2rem;
  }
`;

const StCTAText = styled.span`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (max-width: 500px) {
    font-size: 0.8rem;
  }
`;

/* ＋ 버튼 옆 글자 — PC 세로 줄에서만 보인다 */
const StCTAPlusText = styled.span`
  display: none;
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};

  @media (min-width: 900px) {
    display: inline;
  }
`;

const StBlogWrap = styled.div`
  @media (max-width: 540px) {
    padding: 0 1rem;
  }
`;

const StCTAPlus = styled(Link)`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  aspect-ratio: 1 / 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.7rem;

  /* PC 세로 줄에서는 다른 버튼과 같은 모양(＋ 활동 기록하기) */
  @media (min-width: 900px) {
    aspect-ratio: auto;
    justify-content: flex-start;
    padding: 0.7rem 1rem;
  }
  font-size: 1.6rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};
  text-decoration: none;
  transition: all 0.15s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
    color: ${({ theme }) => theme.colors.blue600};
    transform: translateY(-2px);
  }
`;
