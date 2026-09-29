// 근육 도감이 쓰는 모양. 데이터는 data.ts 한 곳에만 적고, 화면은 이 타입만 본다. (2026-09-21)

/** 몸을 나누는 큰 부위. 탭 순서도 이 순서를 따른다. */
export type MusclePart =
  | "chest"
  | "back"
  | "shoulder"
  | "arm"
  | "core"
  | "hip"
  | "thigh"
  | "calf"
  | "foot"
  | "neck";

/** 근육 한 개. 이름은 우리말(name)을 앞에 두고 한자식 옛 이름(alias)을 곁들인다. */
export type Muscle = {
  id: string;
  /** 우리말 해부학 이름 — 예: 넙다리네갈래근 */
  name: string;
  /** 한자식 옛 이름 — 예: 대퇴사두근 */
  alias: string;
  /** 영어 이름 — 예: Quadriceps femoris */
  en: string;
  part: MusclePart;
  /** 어디에 붙어 있는지 한 문장 */
  where: string;
  /** 하는 일 (동작 + 일상 예) */
  actions: string[];
  /** 이 근육을 주로 쓰는 대표 운동 */
  lifts: string[];
  /** 늘리는 방법 한 문장 */
  stretch: string;
  /** 굳는 이유·자세 팁 같은 생활 속 한마디 */
  tip?: string;

  /* ===== 자세히 보기 (부위를 골라 확대했을 때만 보여 준다) — 해부학 책 수준의 칸 (2026-09-21) ===== */
  /** 이는곳(origin) — 잘 안 움직이는 뼈 쪽 붙는 자리 */
  origin?: string;
  /** 닿는곳(insertion) — 움직이는 뼈 쪽 붙는 자리 */
  insertion?: string;
  /** 이 근육을 움직이게 하는 신경 */
  nerve?: string;
  /** 근섬유가 어떻게 놓여 있는지 + 속근·지근 성격 */
  fiber?: string;
  /** 같이 일하는 근육(협력근)과 반대로 일하는 근육(길항근) */
  partners?: string;
  /**
   * 갈래·부분 — 한 근육이 여러 갈래(머리)나 부분으로 나뉠 때. 예: 대흉근 = 쇄골부·흉골부·복부.
   * name 은 흔히 쓰는 이름(쇄골부), note 는 그 갈래가 따로 하는 일 한 줄. (주인 요청 2026-09-21)
   */
  heads?: { name: string; note: string }[];
};

/** "근육은 어떻게 생겼나" 설명 한 꼭지 */
export type TissueNote = {
  id: string;
  title: string;
  body: string;
};
