"use client";

import { useSyncExternalStore } from "react";
import {
  readInBodySession,
  subscribeInBodySession,
} from "./storage";
import type { InBodySession } from "./types";

export function useInBodySession(): InBodySession | null {
  return useSyncExternalStore(
    subscribeInBodySession,
    () => readInBodySession(),
    () => null,
  );
}
