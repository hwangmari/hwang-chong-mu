import type { BlogPost } from "./types";
// 이미지 등록 전까지 임시 비공개 (운동일지 제외)
import { meetingGuide } from "./meeting-guide";
import { workoutGuide } from "./workout-guide";
import { hwangChongmuIntro } from "./hwang-chongmu-intro";
import { meetingScheduler } from "./meeting-scheduler";
import { calcSplitBill } from "./calc-split-bill";
import { overtimeCalculator } from "./overtime-calculator";
import { nextjsStyledComponents } from "./nextjs-styled-components";
import { supabaseRealtime } from "./supabase-realtime";
import { habitTracker } from "./habit-tracker";
import { monorepoUiPackage } from "./monorepo-ui-package";

export type { BlogPost, ContentBlock } from "./types";

export const BLOG_POSTS: BlogPost[] = [
  workoutGuide,
  meetingGuide,
  hwangChongmuIntro,
  meetingScheduler,
  calcSplitBill,
  overtimeCalculator,
  nextjsStyledComponents,
  supabaseRealtime,
  habitTracker,
  monorepoUiPackage,
];
