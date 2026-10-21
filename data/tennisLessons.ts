// 테니스 레슨 일지.
//
// 자료 모양(타입)의 단일 출처. 실제 일지는 황총무 계정별로 저장 공간 표 tennis_lesson_entries 에 쌓인다
// (supabase/20261016_tennis_lessons_by_account.sql). 일지는 /lesson 화면에서 쓴다.
// raw 는 생각나는 대로 적은 원문, tips 는 나중에 클로드가 읽고 주제별로 정리해 채운다
// (주인 결정 2026-10-16 — AI 연동 대신 이 방식, scripts/lesson-tips.mjs).
//
// 아래 TENNIS_LESSONS 는 화면이 생기기 전에 적어 둔 일지다. /lesson 에서 "내 일지로 옮기기"를 누르면
// 저장 공간으로 들어가고, 이미 같은 날짜 일지가 있으면 더는 안내하지 않는다.

export type LessonTip = {
  /** 포핸드·백헨드·서브 같은 묶음 */
  topic: string;
  /** 한 줄짜리 실천 항목 */
  points: string[];
};

export type TennisLesson = {
  date: string; // YYYY-MM-DD
  /** 레슨 몇 분, 볼머신 몇 분처럼 나눠 적는다 */
  parts: { name: string; minutes: number }[];
  /** 그날 적은 날것 그대로의 메모 */
  raw: string;
  /** 정리된 팁. 아직 정리 전이면 빈 배열 */
  tips: LessonTip[];
};

export const TENNIS_LESSONS: TennisLesson[] = [
  {
    date: "2026-10-15",
    parts: [
      { name: "레슨", minutes: 20 },
      { name: "볼머신", minutes: 20 },
    ],
    raw: [
      "베이스라인에 떨어지는 빠른공 처리 방법을 배웠고 이때는 스윙을 하는것보다",
      "라켓 헤드 면을 조금 열어서 공임팩트를 한다고 생각하고 하체는 낮춰서",
      "중심을 잡고 그대로 밀어 준다는 느낌으로 해야함.",
      "그리고 어프로치 래깅할때는 임팩트 순간에 손목으로 치는 힘을 써야함.",
      "",
      "볼머신 스텝은 빠른공 처리를 위해 스텝간조화 하는 연습을 했어 백핸드는 오른다리만 나가면 되는데",
      "꼭 뒤로 빠지고 다시 스텝을 밟더라고 그래서 스텝이 꼬이는 현상이 있어서 그걸 연습했어",
      "바로 오른발을 내밀어서 스윙 할수 있게 연결동작을 간소화했더니 훨씬 여유가 생겼어 . !",
    ].join("\n"),
    tips: [
      {
        topic: "베이스라인 빠른 공 받기",
        points: [
          "크게 스윙하지 말고 **면으로 받아낸다**는 생각으로",
          "라켓 헤드 면을 조금 열어서 임팩트",
          "하체를 낮춰 중심을 잡고 그대로 밀어 준다",
        ],
      },
      {
        topic: "어프로치 래깅",
        points: ["임팩트 순간에 손목으로 치는 힘을 쓴다"],
      },
      {
        topic: "백핸드 스텝 (빠른 공)",
        points: [
          "뒤로 한 번 빠졌다가 다시 밟지 말고 **오른발만 바로 내민다**",
          "오른발 내딛기 → 스윙으로 바로 이어서 연결 동작을 줄인다",
          "스텝이 줄면 빠른 공에도 칠 시간이 남는다 (볼머신으로 연습)",
        ],
      },
    ],
  },
];

/** 총 운동 시간 (운동 기록에 넘길 값) */
export function lessonMinutes(lesson: TennisLesson): number {
  return lesson.parts.reduce((sum, p) => sum + p.minutes, 0);
}

/** "레슨 20분 · 볼머신 20분" */
export function lessonPartsLabel(lesson: TennisLesson): string {
  return lesson.parts.map((p) => `${p.name} ${p.minutes}분`).join(" · ");
}

/** 구성 이름에 "게임"이 들어가면 게임, 나머지(레슨·볼머신·랠리·서브 연습…)는 레슨으로 본다 */
export function isGamePart(name: string): boolean {
  return name.includes("게임");
}

/** 그날 한 것: 레슨을 했는지, 게임을 했는지 (둘 다일 수 있다). 구성이 없으면 레슨으로 본다 */
export function lessonKinds(lesson: TennisLesson): { lesson: boolean; game: boolean } {
  if (lesson.parts.length === 0) return { lesson: true, game: false };
  return {
    lesson: lesson.parts.some((p) => !isGamePart(p.name)),
    game: lesson.parts.some((p) => isGamePart(p.name)),
  };
}
