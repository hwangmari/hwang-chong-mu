// 테니스 레슨 일지.
//
// 쓰는 법: 레슨이 끝나면 raw 에 생각나는 대로 적는다. 다듬지 않아도 된다.
// tips 는 나중에 클로드가 읽고 부위별로 정리해 채운다 (주인 결정 2026-10-16).
// 화면(/lesson)과 운동 기록 연동은 이 파일을 읽어 간다.

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
