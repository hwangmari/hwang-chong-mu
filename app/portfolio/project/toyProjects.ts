// 토이 프로젝트 목록의 단일 출처. 빠른 이동 메뉴와 상단 사실 띠(개수)가 함께 쓴다.
// 라벨은 ProjectList.tsx의 카드 제목과 같은 값이다.
export interface ToyProjectRef {
  id: string;
  label: string;
}

export const TOY_PROJECTS: ToyProjectRef[] = [
  { id: "toy-my", label: "내 서비스 요약" },
  { id: "toy-schedule", label: "업무 캘린더" },
  { id: "toy-meeting", label: "약속 잡기" },
  { id: "toy-place", label: "장소잡기" },
  { id: "toy-calc", label: "여행 경비 계산기" },
  { id: "toy-account-book", label: "가계부" },
  { id: "toy-habit", label: "습관 관리" },
  { id: "toy-daily", label: "일일 기록" },
  { id: "toy-diet", label: "체중 관리" },
  { id: "toy-workout", label: "운동 기록" },
  { id: "toy-inbody", label: "인바디 기록" },
  { id: "toy-game", label: "게임방" },
];
