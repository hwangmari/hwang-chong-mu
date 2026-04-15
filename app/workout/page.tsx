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
  weeklyGymVolume,
  weeklyRunDistance,
} from "./helpers";
import {
  WorkoutCalendarHeatmap,
  WorkoutMonthlyCalendar,
} from "./components/WorkoutCharts";
import BlogGuideLink from "@/components/common/BlogGuideLink";
import {
  GYM_BODY_PART_LABEL,
  type ActivityRecord,
  type GymRecord,
  type RunningRecord,
} from "./types";
import { useWorkoutSession } from "./useWorkoutSession";

export default function WorkoutHomePage() {
  const router = useRouter();
  const session = useWorkoutSession();
  const [runs, setRuns] = useState<RunningRecord[]>([]);
  const [gyms, setGyms] = useState<GymRecord[]>([]);
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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

  async function handleDelete(
    kind: "run" | "gym" | "activity",
    id: string,
  ) {
    if (!confirm("이 기록을 삭제할까요?")) return;
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

  const weeklyRunKm = weeklyRunDistance(runs);
  const weeklyGymVol = weeklyGymVolume(gyms);
  const runBest = computeRunningBest(runs);
  const prs = computeExercisePRs(gyms).slice(0, 3);
  const totalSessions = runs.length + gyms.length + activities.length;

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

  return (
    <StPage>
      <StHeader>
        <StHello>안녕, {session.roomName}!</StHello>
        <StTagline>꾸준함이 쌓여 당신을 바꿔요. 오늘도 +1 💪</StTagline>
      </StHeader>

      {error ? <StError>{error}</StError> : null}

      <StGrid>
        <StStatCard>
          <StStatLabel>이번 주 러닝</StStatLabel>
          <StStatValue>
            {weeklyRunKm.toFixed(1)} <StStatUnit>km</StStatUnit>
          </StStatValue>
          <StStatSub>누적 {runs.length}회</StStatSub>
        </StStatCard>

        <StStatCard>
          <StStatLabel>이번 주 볼륨</StStatLabel>
          <StStatValue>
            {Math.round(weeklyGymVol).toLocaleString()} <StStatUnit>kg</StStatUnit>
          </StStatValue>
          <StStatSub>누적 {gyms.length}회</StStatSub>
        </StStatCard>

        <StStatCard>
          <StStatLabel>전체 운동 일수</StStatLabel>
          <StStatValue>
            {totalSessions} <StStatUnit>회</StStatUnit>
          </StStatValue>
          <StStatSub>
            러닝 {runs.length} · 헬스 {gyms.length} · 활동 {activities.length}
          </StStatSub>
        </StStatCard>
      </StGrid>

      <StCTAGrid>
        <StCTA href="/workout/run">
          <StCTAEmoji>🏃‍♀️</StCTAEmoji>
          <StCTAText>러닝 기록하기</StCTAText>
        </StCTA>
        <StCTA href="/workout/weight">
          <StCTAEmoji>🏋️‍♂️</StCTAEmoji>
          <StCTAText>웨이트 기록하기</StCTAText>
        </StCTA>
        <StCTAPlus href="/workout/activity" aria-label="활동 기록하기">
          +
        </StCTAPlus>
      </StCTAGrid>

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
                <StRecentBody>
                  <StRecentTitle>
                    {item.kind === "run"
                      ? `${item.data.distanceKm.toFixed(1)}km · ${formatDuration(
                          item.data.durationSec,
                        )}`
                      : item.kind === "gym"
                        ? [
                            item.data.bodyPart
                              ? GYM_BODY_PART_LABEL[item.data.bodyPart]
                              : null,
                            `${item.data.exercises.length}개 운동`,
                            `${Math.round(
                              gymRecordVolumeKg(item.data),
                            ).toLocaleString()}kg`,
                            item.data.durationMin
                              ? formatDurationMin(item.data.durationMin)
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" · ")
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
                </StRecentBody>
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
          <StEmpty>불러오는 중...</StEmpty>
        ) : (
          <StEmpty>
            아직 기록이 없어요.{" "}
            <Link href="/workout/run">러닝</Link> 또는{" "}
            <Link href="/workout/weight">웨이트</Link>에서 첫 기록을 남겨보세요!
          </StEmpty>
        )}
      </StSection>

      <StSection>
        <StSectionTitle>🏃‍♀️ 러닝 PR</StSectionTitle>
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
      </StSection>

      <StSection>
        <StSectionTitle>💪 헬스 Top PR</StSectionTitle>
        {prs.length ? (
          <StPRList>
            {prs.map((pr) => (
              <StPRRow key={pr.exerciseName}>
                <StPRName>{pr.exerciseName}</StPRName>
                <StPRValue>
                  {pr.weight} kg <StPRSmall>(최대 무게)</StPRSmall>
                  <StPRDate>
                    {pr.weight}×{pr.reps} · {pr.achievedAt}
                  </StPRDate>
                </StPRValue>
              </StPRRow>
            ))}
          </StPRList>
        ) : (
          <StEmpty>아직 헬스 기록이 없어요.</StEmpty>
        )}
      </StSection>

      <WorkoutMonthlyCalendar runs={runs} gyms={gyms} activities={activities} />

      <WorkoutCalendarHeatmap columns={calendarColumns} />

      <BlogGuideLink guideId="workout-guide" />
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

const StGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.6rem;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

const StStatCard = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1rem;
  padding: 0.95rem 1rem;
`;

const StStatLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StStatValue = styled.p`
  margin-top: 0.4rem;
  font-size: 1.45rem;
  font-weight: 900;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StStatUnit = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;

const StStatSub = styled.p`
  margin-top: 0.25rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StSection = styled.section`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  border-radius: 1.1rem;
  padding: 1rem 1.1rem;
`;

const StSectionTitle = styled.h2`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.8rem;
`;

const StPRList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
`;

const StPRRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

const StPRName = styled.span`
  font-size: 0.88rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray700};
`;

const StPRValue = styled.span`
  font-size: 0.88rem;
  font-weight: 800;
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

const StRecentRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StRecentBadge = styled.span<{ $kind: "run" | "gym" | "activity" }>`
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

const StRecentBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const StRecentTitle = styled.p`
  font-size: 0.9rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StRecentDate = styled.p`
  margin-top: 0.15rem;
  font-size: 0.72rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StRecentActions = styled.div`
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

const StCTAGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.7rem;
`;

const StCTA = styled(Link)`
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
`;

const StCTAEmoji = styled.span`
  font-size: 1.5rem;
`;

const StCTAText = styled.span`
  font-size: 0.9rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
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
