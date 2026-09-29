// 몸 그림 위에 얹는 "누를 수 있는 자리" 지도.
//
// 기본 그림(ART)은 주인이 만들어 준 3면도(정면·후면·측면)를 보기별 SVG 선화로 옮긴 것이다.
// 좌표는 모두 그림 파일의 픽셀 좌표다. (2026-09-21)

export type PhotoSpot = {
  /** data.ts MUSCLES 의 id */
  id: string;
  /** 이름표가 설 쪽 */
  side: "left" | "right";
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  /** 기울기(도) */
  rot?: number;
};

export type PhotoView = {
  src: string;
  /** 그림에서 이 보기가 차지하는 칸 "x y w h" */
  box: string;
  spots: PhotoSpot[];
};

/* 주인이 만들어 준 남성 3면도(public/muscle/male3.png, 1312x1199 — 설명 글씨·눈금선만 지운 원래 그림)를
   보기별로 잘라 SVG 로 옮긴 선화 — 확대해도 깨지지 않는다. 좌표는 원본 한 장 기준 그대로라, SVG 는 box 자리에 그 크기로 깔린다. */

const ART_FRONT: PhotoView = {
  src: "/muscle/male-front.svg",
  box: "80 90 402 1052",
  spots: [
    { id: "sternocleidomastoid", side: "right", cx: 302, cy: 244, rx: 9, ry: 15 },
    { id: "scalenes", side: "right", cx: 310, cy: 260, rx: 9, ry: 15, rot: -10 },
    { id: "trapezius", side: "right", cx: 334, cy: 265, rx: 18, ry: 12 },
    { id: "deltoid-anterior", side: "left", cx: 175, cy: 310, rx: 27, ry: 35 },
    { id: "deltoid-lateral", side: "left", cx: 143, cy: 349, rx: 8, ry: 12 },
    { id: "pectoralis-major", side: "right", cx: 326, cy: 333, rx: 47, ry: 50 },
    { id: "pectoralis-minor", side: "right", cx: 336, cy: 322, rx: 13, ry: 17, rot: 10 },
    { id: "serratus-anterior", side: "left", cx: 223, cy: 450, rx: 12, ry: 12 },
    { id: "biceps-brachii", side: "left", cx: 165, cy: 403, rx: 20, ry: 52 },
    { id: "triceps-brachii", side: "left", cx: 147, cy: 368, rx: 10, ry: 25, rot: 4 },
    { id: "brachioradialis", side: "left", cx: 123, cy: 494, rx: 15, ry: 42 },
    { id: "wrist-flexors", side: "left", cx: 150, cy: 509, rx: 10, ry: 25 },
    { id: "wrist-extensors", side: "right", cx: 440, cy: 519, rx: 18, ry: 78 },
    { id: "rectus-abdominis", side: "right", cx: 303, cy: 413, rx: 20, ry: 18 },
    { id: "external-oblique", side: "right", cx: 336, cy: 500, rx: 23, ry: 46 },
    { id: "internal-oblique", side: "right", cx: 340, cy: 486, rx: 9, ry: 21, rot: -8 },
    { id: "transversus-abdominis", side: "right", cx: 336, cy: 529, rx: 9, ry: 13 },
    { id: "iliopsoas", side: "right", cx: 301, cy: 548, rx: 11, ry: 21, rot: -8 },
    { id: "tensor-fasciae-latae", side: "left", cx: 205, cy: 602, rx: 13, ry: 25 },
    { id: "quadriceps", side: "left", cx: 191, cy: 692, rx: 17, ry: 48 },
    { id: "hip-adductors", side: "right", cx: 301, cy: 649, rx: 9, ry: 40 },
    { id: "gastrocnemius", side: "left", cx: 222, cy: 894, rx: 11, ry: 28 },
    { id: "tibialis-anterior", side: "left", cx: 184, cy: 959, rx: 19, ry: 128 },
    { id: "fibularis-longus", side: "right", cx: 383, cy: 903, rx: 9, ry: 35 },
    { id: "extensor-digitorum-longus", side: "right", cx: 373, cy: 970, rx: 8, ry: 25 },
    { id: "extensor-hallucis-longus", side: "right", cx: 364, cy: 1022, rx: 7, ry: 17 },
  ],
};

const ART_BACK: PhotoView = {
  src: "/muscle/male-back.svg",
  box: "518 90 390 1052",
  spots: [
    { id: "suboccipitals", side: "right", cx: 729, cy: 199, rx: 13, ry: 12 },
    { id: "trapezius", side: "right", cx: 757, cy: 264, rx: 35, ry: 20 },
    { id: "deltoid-posterior", side: "left", cx: 605, cy: 320, rx: 27, ry: 25 },
    { id: "supraspinatus", side: "left", cx: 666, cy: 308, rx: 21, ry: 12 },
    { id: "infraspinatus", side: "left", cx: 634, cy: 354, rx: 28, ry: 20 },
    { id: "teres-major", side: "right", cx: 792, cy: 353, rx: 28, ry: 17 },
    { id: "rhomboids", side: "right", cx: 746, cy: 338, rx: 19, ry: 29, rot: -16 },
    { id: "latissimus-dorsi", side: "left", cx: 674, cy: 404, rx: 22, ry: 29 },
    { id: "erector-spinae", side: "right", cx: 740, cy: 487, rx: 35, ry: 56 },
    { id: "quadratus-lumborum", side: "right", cx: 779, cy: 510, rx: 9, ry: 17 },
    { id: "triceps-brachii", side: "left", cx: 594, cy: 390, rx: 20, ry: 42 },
    { id: "wrist-extensors", side: "left", cx: 551, cy: 552, rx: 17, ry: 45 },
    { id: "gluteus-medius", side: "left", cx: 645, cy: 540, rx: 21, ry: 19, rot: -10 },
    { id: "gluteus-maximus", side: "left", cx: 676, cy: 581, rx: 37, ry: 49 },
    { id: "hamstrings", side: "left", cx: 647, cy: 713, rx: 22, ry: 77 },
    { id: "gastrocnemius", side: "left", cx: 620, cy: 894, rx: 17, ry: 51 },
    { id: "soleus", side: "left", cx: 630, cy: 985, rx: 20, ry: 70 },
    { id: "tibialis-posterior", side: "right", cx: 784, cy: 952, rx: 13, ry: 36 },
    { id: "fibularis-longus", side: "right", cx: 804, cy: 904, rx: 13, ry: 38 },
    { id: "fibularis-brevis", side: "right", cx: 806, cy: 971, rx: 11, ry: 29 },
    { id: "flexor-digitorum-brevis", side: "right", cx: 805, cy: 1102, rx: 12, ry: 15 },
  ],
};

/* 측면 — 얼굴이 왼쪽을 본다. 몸 앞쪽이 x 가 작은 쪽이다 */
const ART_SIDE: PhotoView = {
  src: "/muscle/male-side.svg",
  box: "1012 90 212 1052",
  spots: [
    { id: "sternocleidomastoid", side: "left", cx: 1137, cy: 230, rx: 15, ry: 25 },
    { id: "trapezius", side: "right", cx: 1166, cy: 261, rx: 25, ry: 35 },
    { id: "deltoid-lateral", side: "right", cx: 1152, cy: 331, rx: 32, ry: 50 },
    { id: "pectoralis-major", side: "left", cx: 1082, cy: 359, rx: 24, ry: 39 },
    { id: "serratus-anterior", side: "left", cx: 1066, cy: 435, rx: 7, ry: 15 },
    { id: "latissimus-dorsi", side: "right", cx: 1160, cy: 427, rx: 17, ry: 40 },
    { id: "triceps-brachii", side: "right", cx: 1162, cy: 406, rx: 31, ry: 51 },
    { id: "biceps-brachii", side: "left", cx: 1124, cy: 411, rx: 9, ry: 36 },
    { id: "wrist-extensors", side: "right", cx: 1130, cy: 487, rx: 23, ry: 38 },
    { id: "external-oblique", side: "left", cx: 1095, cy: 502, rx: 16, ry: 27 },
    { id: "gluteus-medius", side: "right", cx: 1152, cy: 556, rx: 15, ry: 19 },
    { id: "gluteus-maximus", side: "right", cx: 1172, cy: 605, rx: 28, ry: 47 },
    { id: "tensor-fasciae-latae", side: "left", cx: 1126, cy: 608, rx: 13, ry: 23 },
    { id: "quadriceps", side: "left", cx: 1121, cy: 709, rx: 36, ry: 83 },
    { id: "hamstrings", side: "right", cx: 1164, cy: 731, rx: 15, ry: 60 },
    { id: "gastrocnemius", side: "right", cx: 1168, cy: 903, rx: 21, ry: 46 },
    { id: "soleus", side: "right", cx: 1161, cy: 986, rx: 12, ry: 38 },
    { id: "tibialis-anterior", side: "left", cx: 1141, cy: 932, rx: 17, ry: 147 },
  ],
};

/* 여성 3면도(public/muscle/female3.png, 1540x1254 — 설명 글씨·지시선을 지운 판) — 남성과 같은 근육.
   이름표 쪽은 대체로 같고, 이름표 쪽에 칸이 없는 근육은 생성기가 반대쪽으로 옮겨 둔다.
   씨앗이 있는 근육은 scripts/muscle-trace-regions.mjs 가 칸 가운데로 자리를 고쳐 쓴다 */
const FEMALE_FRONT: PhotoView = {
  src: "/muscle/female-front.svg",
  box: "226 110 395 1120",
  spots: [
    { id: "sternocleidomastoid", side: "left", cx: 408, cy: 300, rx: 9, ry: 13 },
    { id: "scalenes", side: "right", cx: 450, cy: 300, rx: 10, ry: 16, rot: -10 },
    { id: "trapezius", side: "left", cx: 387, cy: 321, rx: 10, ry: 11 },
    { id: "deltoid-anterior", side: "left", cx: 318, cy: 368, rx: 34, ry: 42 },
    { id: "deltoid-lateral", side: "right", cx: 551, cy: 387, rx: 10, ry: 38 },
    { id: "pectoralis-major", side: "right", cx: 459, cy: 366, rx: 34, ry: 33 },
    { id: "pectoralis-minor", side: "right", cx: 466, cy: 356, rx: 15, ry: 18, rot: 10 },
    { id: "serratus-anterior", side: "left", cx: 381, cy: 512, rx: 8, ry: 14 },
    { id: "biceps-brachii", side: "left", cx: 312, cy: 458, rx: 22, ry: 59 },
    { id: "triceps-brachii", side: "left", cx: 291, cy: 430, rx: 7, ry: 30 },
    { id: "brachioradialis", side: "left", cx: 274, cy: 579, rx: 17, ry: 56 },
    { id: "wrist-flexors", side: "left", cx: 283, cy: 582, rx: 10, ry: 50 },
    { id: "wrist-extensors", side: "right", cx: 543, cy: 563, rx: 9, ry: 24 },
    { id: "rectus-abdominis", side: "right", cx: 446, cy: 498, rx: 16, ry: 16 },
    { id: "external-oblique", side: "right", cx: 475, cy: 568, rx: 20, ry: 47 },
    { id: "internal-oblique", side: "right", cx: 478, cy: 545, rx: 8, ry: 20, rot: -8 },
    { id: "transversus-abdominis", side: "right", cx: 474, cy: 590, rx: 8, ry: 12 },
    { id: "iliopsoas", side: "right", cx: 442, cy: 590, rx: 13, ry: 22, rot: -8 },
    { id: "tensor-fasciae-latae", side: "left", cx: 321, cy: 695, rx: 7, ry: 13 },
    { id: "quadriceps", side: "left", cx: 333, cy: 780, rx: 19, ry: 56 },
    { id: "hip-adductors", side: "right", cx: 459, cy: 695, rx: 8, ry: 24 },
    { id: "gastrocnemius", side: "left", cx: 370, cy: 980, rx: 12, ry: 35 },
    { id: "tibialis-anterior", side: "left", cx: 329, cy: 1034, rx: 18, ry: 115 },
    { id: "fibularis-longus", side: "right", cx: 540, cy: 964, rx: 10, ry: 36 },
    { id: "extensor-digitorum-longus", side: "right", cx: 528, cy: 1034, rx: 9, ry: 26 },
    { id: "extensor-hallucis-longus", side: "right", cx: 516, cy: 1089, rx: 8, ry: 18 },
  ],
};

const FEMALE_BACK: PhotoView = {
  src: "/muscle/female-back.svg",
  box: "708 110 394 1120",
  spots: [
    { id: "suboccipitals", side: "right", cx: 916, cy: 222, rx: 14, ry: 12 },
    { id: "trapezius", side: "right", cx: 939, cy: 362, rx: 33, ry: 51 },
    { id: "deltoid-posterior", side: "left", cx: 809, cy: 377, rx: 24, ry: 31 },
    { id: "supraspinatus", side: "left", cx: 860, cy: 348, rx: 20, ry: 12 },
    { id: "infraspinatus", side: "left", cx: 851, cy: 379, rx: 12, ry: 25 },
    { id: "teres-major", side: "right", cx: 972, cy: 415, rx: 20, ry: 18 },
    { id: "rhomboids", side: "right", cx: 932, cy: 368, rx: 20, ry: 30, rot: -16 },
    { id: "latissimus-dorsi", side: "left", cx: 854, cy: 564, rx: 22, ry: 30 },
    { id: "erector-spinae", side: "right", cx: 923, cy: 534, rx: 17, ry: 41 },
    { id: "quadratus-lumborum", side: "right", cx: 938, cy: 555, rx: 7, ry: 16 },
    { id: "triceps-brachii", side: "left", cx: 799, cy: 446, rx: 26, ry: 41 },
    { id: "wrist-extensors", side: "left", cx: 748, cy: 637, rx: 17, ry: 27 },
    { id: "gluteus-medius", side: "left", cx: 832, cy: 566, rx: 22, ry: 20, rot: -10 },
    { id: "gluteus-maximus", side: "left", cx: 855, cy: 669, rx: 45, ry: 57 },
    { id: "hamstrings", side: "left", cx: 826, cy: 795, rx: 17, ry: 75 },
    { id: "gastrocnemius", side: "left", cx: 812, cy: 971, rx: 18, ry: 54 },
    { id: "soleus", side: "left", cx: 823, cy: 1066, rx: 20, ry: 57 },
    { id: "tibialis-posterior", side: "right", cx: 972, cy: 1014, rx: 13, ry: 38 },
    { id: "fibularis-longus", side: "right", cx: 992, cy: 964, rx: 13, ry: 40 },
    { id: "fibularis-brevis", side: "right", cx: 995, cy: 1034, rx: 11, ry: 30 },
    { id: "flexor-digitorum-brevis", side: "right", cx: 981, cy: 1186, rx: 12, ry: 15 },
  ],
};

const FEMALE_SIDE: PhotoView = {
  src: "/muscle/female-side.svg",
  box: "1228 110 224 1120",
  spots: [
    { id: "sternocleidomastoid", side: "left", cx: 1332, cy: 308, rx: 8, ry: 22, rot: -25 },
    { id: "trapezius", side: "right", cx: 1361, cy: 294, rx: 23, ry: 37 },
    { id: "deltoid-lateral", side: "right", cx: 1361, cy: 379, rx: 31, ry: 52 },
    { id: "pectoralis-major", side: "left", cx: 1311, cy: 389, rx: 13, ry: 30 },
    { id: "serratus-anterior", side: "left", cx: 1299, cy: 519, rx: 19, ry: 17 },
    { id: "latissimus-dorsi", side: "right", cx: 1362, cy: 535, rx: 7, ry: 22 },
    { id: "triceps-brachii", side: "right", cx: 1370, cy: 450, rx: 16, ry: 38 },
    { id: "biceps-brachii", side: "left", cx: 1336, cy: 464, rx: 15, ry: 46 },
    { id: "wrist-extensors", side: "right", cx: 1321, cy: 668, rx: 22, ry: 57 },
    { id: "external-oblique", side: "left", cx: 1276, cy: 577, rx: 6, ry: 22 },
    { id: "gluteus-medius", side: "right", cx: 1360, cy: 594, rx: 18, ry: 20 },
    { id: "gluteus-maximus", side: "right", cx: 1383, cy: 661, rx: 38, ry: 47 },
    { id: "tensor-fasciae-latae", side: "left", cx: 1329, cy: 651, rx: 15, ry: 24 },
    { id: "quadriceps", side: "left", cx: 1321, cy: 823, rx: 27, ry: 62 },
    { id: "hamstrings", side: "right", cx: 1377, cy: 802, rx: 13, ry: 56 },
    { id: "gastrocnemius", side: "right", cx: 1379, cy: 988, rx: 20, ry: 59 },
    { id: "soleus", side: "right", cx: 1364, cy: 1081, rx: 24, ry: 42 },
    { id: "tibialis-anterior", side: "left", cx: 1349, cy: 1002, rx: 14, ry: 59 },
  ],
};

/* 발 — 주인이 준 발 5면도(public/muscle/foot3.png, 2662x1224) 중 두 면. 남녀 같은 그림을 쓴다 (2026-09-22)
   발바닥 그림은 살갗(발볼·발꿈치)만 그려져 근육 선이 없어서, 근육 칸은 해부학 자리 다각형을 발 윤곽으로 잘라 만든다 */
/* 발등(위에서 본 모습) — 엄지가 오른쪽이라 오른쪽이 안쪽(엄지 쪽) */
const FOOT_DORSUM: PhotoView = {
  src: "/muscle/foot-dorsum.svg",
  box: "30 190 370 925",
  spots: [
    { id: "extensor-digitorum-brevis", side: "left", cx: 134, cy: 670, rx: 56, ry: 86 },
    { id: "extensor-digitorum-longus", side: "left", cx: 189, cy: 751, rx: 75, ry: 204 },
    { id: "fibularis-brevis", side: "left", cx: 117, cy: 562, rx: 29, ry: 131 },
    { id: "extensor-hallucis-longus", side: "right", cx: 303, cy: 730, rx: 42, ry: 221 },
    { id: "tibialis-anterior", side: "right", cx: 316, cy: 506, rx: 31, ry: 167 },
  ],
};

/* 발바닥(아래에서 본 모습) — 엄지가 왼쪽이라 왼쪽이 안쪽(엄지 쪽) */
const FOOT_SOLE: PhotoView = {
  src: "/muscle/foot-sole.svg",
  box: "2315 190 340 925",
  spots: [
    { id: "flexor-hallucis-brevis", side: "left", cx: 2404, cy: 423, rx: 64, ry: 79 },
    { id: "abductor-hallucis", side: "left", cx: 2390, cy: 639, rx: 37, ry: 182 },
    { id: "tibialis-posterior", side: "left", cx: 2390, cy: 700, rx: 12, ry: 20 },
    { id: "flexor-digitorum-brevis", side: "left", cx: 2468, cy: 676, rx: 63, ry: 138 },
    { id: "quadratus-plantae", side: "left", cx: 2465, cy: 765, rx: 24, ry: 20 },
    { id: "foot-lumbricals", side: "right", cx: 2513, cy: 377, rx: 67, ry: 18 },
    { id: "adductor-hallucis", side: "right", cx: 2487, cy: 481, rx: 53, ry: 46 },
    { id: "flexor-digiti-minimi-brevis", side: "right", cx: 2614, cy: 495, rx: 29, ry: 25 },
    { id: "fibularis-longus", side: "right", cx: 2480, cy: 605, rx: 12, ry: 40, rot: -55 },
    { id: "abductor-digiti-minimi", side: "right", cx: 2564, cy: 687, rx: 68, ry: 160 },
  ],
};

/** 기본 그림(주인 3면도) */
const ART_VIEWS = { front: ART_FRONT, back: ART_BACK, side: ART_SIDE, sole: FOOT_SOLE, dorsum: FOOT_DORSUM } as const;

export type BodySex = "male" | "female";

/** 남·여 그림 묶음 — 앞·뒤·옆 모양이 같아서 전환 버튼 하나로 바꿔 본다. 발 두 면은 남녀 같이 쓴다. (주인 요청 2026-09-21) */
export const ART_SETS: Record<BodySex, typeof ART_VIEWS> = {
  male: ART_VIEWS,
  female: { front: FEMALE_FRONT, back: FEMALE_BACK, side: FEMALE_SIDE, sole: FOOT_SOLE, dorsum: FOOT_DORSUM },
};
