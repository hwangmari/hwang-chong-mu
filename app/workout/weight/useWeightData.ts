"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { fetchGymRecords, fetchWorkoutRoutines } from "../repository";
import {
  computeExercisePRs,
  groupRecordsByMonth,
  type MonthGroup,
} from "../helpers";
import type { GymRecord, WorkoutRoutine, WorkoutSession } from "../types";

export type UseWeightDataResult = {
  records: GymRecord[];
  routines: WorkoutRoutine[];
  loading: boolean;
  busy: boolean;
  setBusy: Dispatch<SetStateAction<boolean>>;
  error: string;
  setError: Dispatch<SetStateAction<string>>;
  load: () => Promise<void>;
  prMap: Map<string, number>;
  monthGroups: MonthGroup<GymRecord>[];
};

export function useWeightData(
  session: WorkoutSession | null,
): UseWeightDataResult {
  const [records, setRecords] = useState<GymRecord[]>([]);
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [rows, routineRows] = await Promise.all([
        fetchGymRecords(session.roomId),
        fetchWorkoutRoutines(session.roomId),
      ]);
      setRecords(rows);
      setRoutines(routineRows);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!session) return;
    load();
  }, [session, load]);

  const prs = useMemo(() => computeExercisePRs(records), [records]);
  const prMap = useMemo(() => {
    const m = new Map<string, number>();
    // 시간 기록 PR은 durationSec 기준이라 무게 기반 뱃지에서는 제외.
    prs.forEach((pr) => {
      if (pr.durationSec === undefined) m.set(pr.exerciseName, pr.weight);
    });
    return m;
  }, [prs]);

  const monthGroups = useMemo(
    () => groupRecordsByMonth(records),
    [records],
  );

  return {
    records,
    routines,
    loading,
    busy,
    setBusy,
    error,
    setError,
    load,
    prMap,
    monthGroups,
  };
}
