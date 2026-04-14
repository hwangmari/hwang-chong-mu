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
