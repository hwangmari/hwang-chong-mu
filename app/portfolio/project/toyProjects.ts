// 토이 프로젝트 목록의 단일 출처. 빠른 이동 메뉴와 상단 사실 띠(개수)가 함께 쓴다.
// 라벨은 ProjectList.tsx의 카드 제목과 같은 값이다 — 서비스 이름은 lib/services.ts에서 가져온다.
import { byId, type ServiceId } from "@/lib/services";

export interface ToyProjectRef {
  id: string;
  label: string;
}

// ProjectList.tsx에 실제로 카드(anchorId)가 있는 서비스만, 카드가 놓인 순서대로 적는다.
// 카드가 없는 서비스(테니스 교류전·경조사비 장부·야근 계산기)는 넣지 않는다 —
// 넣으면 눌러도 갈 곳이 없다. 카드를 추가하면 여기에도 한 줄 넣어 주면 된다.
const SERVICES_WITH_CARD: ServiceId[] = [
  "schedule",
  "meeting",
  "place",
  "calc",
  "account-book",
  "habit",
  "daily",
  "diet",
  "workout",
  "inbody",
  "game",
];

export const TOY_PROJECTS: ToyProjectRef[] = [
  // 서비스가 아닌 카드는 직접 적는다.
  { id: "toy-my", label: "내 서비스 요약" },
  ...SERVICES_WITH_CARD.map((id) => ({
    id: `toy-${id}`,
    label: byId(id).name,
  })),
];
