"use client";

import { useSyncExternalStore } from "react";
import {
  readWorkoutSession,
  subscribeWorkoutSession,
} from "./storage";
import type { WorkoutSession } from "./types";

export function useWorkoutSession(): WorkoutSession | null {
  return useSyncExternalStore(
    subscribeWorkoutSession,
    () => readWorkoutSession(),
    () => null,
  );
}

// 서버/하이드레이션 시점엔 저장된 방 정보를 읽을 수 없어 항상 null이 나온다.
// 그 "아직 모르는 구간"과 "정말 로그아웃 상태"를 구분하려고 준비 여부를 따로 본다.
export function useWorkoutSessionReady(): boolean {
  return useSyncExternalStore(
    subscribeWorkoutSession,
    () => true,
    () => false,
  );
}
