"use client";

import TournamentView from "../tournament/TournamentView";
import { OPEN_63 } from "../tournament/data";

// 픽셀 코트 체험 (주인 요청 2026-10-28 "프로토타입으로 전체 더미 데이터로 볼 수 있어?")
// 63OPEN 팀·대진 그대로, 점수만 가짜로 이 브라우저에 둔다. 실제 대회(63open-2026-10-31) 기록과 따로다.
const DEMO_EVENT = { ...OPEN_63, id: "pixel-demo", title: "63OPEN 테니스 대회 · 체험" };

export default function PixelDemoPage() {
  return <TournamentView initialEvent={DEMO_EVENT} demo />;
}
