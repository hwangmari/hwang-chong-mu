// 픽셀 코트·픽셀 대진표가 같이 쓰는 꼬마 선수 그림 (2026-10-28 PixelCourtPanel 에서 옮김)

const SKIN = "#f2c7a0";
const HAIR_M = "#3a2a22";
const HAIR_F = "#5a3524";
const SHORTS = "#2b3340";
export const BLUSH = "#f59a9a";

export type Sprite = { shirt: string; female: boolean };

export function px(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, c: string) {
  ctx.fillStyle = c;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}

// 8×12 선수 — 머리가 몸보다 큰 2등신 꼬마 (주인 요청 2026-10-27 "더 귀엽게", 2026-10-28 "픽셀 인간들 좀 더 귀엽게").
// 위 머리카락 → 팀 색 머리띠 → 얼굴 4줄(세로 콩 눈·볼터치·작은 입) → 작은 몸. 남성은 삐죽 머리 한 가닥,
// 여성은 긴 옆머리 + 분홍 리본 + 흰 치마. 크기(8×12)는 그대로라 코트·벤치·대진표·시상식 자리 계산은 안 바뀐다
const MOUTH = "#d4626c";
const RIBBON = "#ff6fa5";

export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: Sprite,
  frame: number,
  facing: 1 | -1,
  cheer: boolean,
) {
  const bob = frame % 2;
  const hair = s.female ? HAIR_F : HAIR_M;
  px(ctx, x + 1, y + 11, 6, 1, "#0003"); // 그림자
  // 큰 머리
  px(ctx, x + 2, y, 4, 1, hair);
  px(ctx, x + 1, y + 1, 6, 1, hair);
  px(ctx, x + 1, y + 2, 6, 1, s.shirt); // 머리띠
  px(ctx, x + 1, y + 3, 6, 3, SKIN);
  px(ctx, x + 2, y + 6, 4, 1, SKIN); // 동그란 턱
  if (s.female) {
    px(ctx, x, y + 2, 1, 5, hair); // 긴 옆머리
    px(ctx, x + 7, y + 2, 1, 5, hair);
    px(ctx, x + 1, y + 3, 1, 1, hair); // 앞머리 끝
    px(ctx, x + 6, y + 3, 1, 1, hair);
    px(ctx, x + 6, y, 2, 1, RIBBON); // 리본
    px(ctx, x + 7, y + 1, 1, 1, RIBBON);
  } else {
    px(ctx, x + 4, y - 1, 1, 1, hair); // 삐죽 머리 한 가닥
  }
  // 세로 콩 눈 + 볼터치 + 보는 쪽으로 살짝 치우친 입
  px(ctx, x + 2, y + 4, 1, 2, "#222");
  px(ctx, x + 5, y + 4, 1, 2, "#222");
  px(ctx, x + 1, y + 5, 1, 1, BLUSH);
  px(ctx, x + 6, y + 5, 1, 1, BLUSH);
  px(ctx, x + (facing > 0 ? 4 : 3), y + 6, 1, 1, MOUTH);
  // 작은 몸
  px(ctx, x + 2, y + 7, 4, 2, s.shirt);
  if (s.female) px(ctx, x + 1, y + 9, 6, 1, "#ffffff");
  else px(ctx, x + 2, y + 9, 4, 1, SHORTS);
  px(ctx, x + 2, y + 10, 1, 2 - bob, SKIN);
  px(ctx, x + 5, y + 10, 1, 1 + bob, SKIN);
  if (cheer) {
    px(ctx, x, y + 4 - bob, 1, 3, SKIN); // 만세 손
    px(ctx, x + 7, y + 4 - bob, 1, 3, SKIN);
    px(ctx, x + 1, y + 7, 1, 1, s.shirt);
    px(ctx, x + 6, y + 7, 1, 1, s.shirt);
  } else {
    px(ctx, x + 1, y + 7, 1, 2, s.shirt); // 소매
    px(ctx, x + 6, y + 7, 1, 2, s.shirt);
    const rx = facing > 0 ? x + 7 : x - 2;
    px(ctx, rx, y + 5, 2, 3, "#1b1b1b"); // 라켓 머리
    px(ctx, rx, y + 5, 2, 1, "#3a3a3a");
    px(ctx, facing > 0 ? x + 7 : x, y + 8, 1, 2, "#7a5a3a"); // 손잡이
  }
}

// 5×4 하트 — 이긴 팀 머리 위에 뜬다
export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const c = "#ff5c8a";
  px(ctx, x + 1, y, 1, 1, c);
  px(ctx, x + 3, y, 1, 1, c);
  px(ctx, x, y + 1, 5, 1, c);
  px(ctx, x + 1, y + 2, 3, 1, c);
  px(ctx, x + 2, y + 3, 1, 1, c);
}

// 5×6 불꽃 — 패자조로 내려간 팀 머리 위에서 활활 (주인 요청 2026-10-28 "승부를 불태우게")
export function drawFire(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number) {
  const f = frame % 2;
  px(ctx, x + 2, y + f, 1, 1, "#ffe066");
  px(ctx, x + 1 + f, y + 1, 2, 1, "#ffb020");
  px(ctx, x + 1, y + 2, 3, 1, "#ffb020");
  px(ctx, x, y + 3, 5, 2, "#ff5a1f");
  px(ctx, x + 1, y + 3, 3, 1, "#ffb020");
  px(ctx, x + 2, y + 3, 1, 1, "#ffe066");
  px(ctx, x + 1, y + 5, 3, 1, "#e0391a");
}

// ───── 코트 그림 (픽셀 코트·팀별 여정이 같이 씀, 2026-10-28 PixelCourtPanel 에서 옮김) ─────
export const COURT_W = 160;
export const COURT_H = 88;
const W = COURT_W;
const H = COURT_H;

// 코트 색: 대회장(아식스 테니스 아카데미) 2026 코트처럼 안쪽 보라 · 바깥 파랑, 밝고 화사하게 (주인 요청 2026-10-27)
const OUT_A = "#4fb0f7";
const OUT_B = "#5ab8fa";
const IN = "#9a7cff";
const IN_LIGHT = "#a68bff";
const LINE = "#ffffff";

export function drawCourt(ctx: CanvasRenderingContext2D) {
  px(ctx, 0, 0, W, H, OUT_A);
  for (let i = 0; i < W; i += 8) px(ctx, i, 0, 4, H, OUT_B);
  const cx = 16, cy = 12, cw = W - 32, ch = H - 24;
  px(ctx, cx, cy, cw, ch, IN);
  // 반사광 한 줄 — 바닥이 반짝여 보이게
  px(ctx, cx + 1, cy + 1, cw - 2, 1, IN_LIGHT);
  px(ctx, cx, cy, cw, 1, LINE);
  px(ctx, cx, cy + ch - 1, cw, 1, LINE);
  px(ctx, cx, cy, 1, ch, LINE);
  px(ctx, cx + cw - 1, cy, 1, ch, LINE);
  px(ctx, cx, cy + 6, cw, 1, LINE);
  px(ctx, cx, cy + ch - 7, cw, 1, LINE);
  const sx = Math.round(cw * 0.23);
  px(ctx, cx + sx, cy + 6, 1, ch - 12, LINE);
  px(ctx, cx + cw - sx - 1, cy + 6, 1, ch - 12, LINE);
  px(ctx, cx + sx, cy + ch / 2, cw - sx * 2, 1, LINE);
  px(ctx, W / 2 - 1, cy - 4, 2, ch + 8, "#f4f1ea");
  px(ctx, W / 2 - 1, cy - 5, 2, 2, "#2b3340");
  px(ctx, W / 2 - 1, cy + ch + 3, 2, 2, "#2b3340");
  drawDecor(ctx);
}

// 코트 밖 꾸밈: 네 구석 화분 · 네트 옆 심판 의자 · 공 바구니 · 수건
function drawDecor(ctx: CanvasRenderingContext2D) {
  for (const [bx, by] of [[1, 0], [W - 9, 0], [1, H - 9], [W - 9, H - 9]] as const) {
    px(ctx, bx + 1, by + 1, 6, 4, "#3fbf6e");
    px(ctx, bx + 2, by, 4, 1, "#3fbf6e");
    px(ctx, bx + 2, by + 2, 1, 1, "#7be09a");
    px(ctx, bx + 5, by + 1, 1, 1, "#ff8fb1"); // 꽃 한 송이
    px(ctx, bx + 2, by + 5, 4, 3, "#ff9f5a");
    px(ctx, bx + 2, by + 5, 4, 1, "#e07b38");
  }
  // 심판 의자
  px(ctx, W / 2 + 4, 1, 5, 3, "#ffcf4a");
  px(ctx, W / 2 + 4, 4, 1, 6, "#c98f2a");
  px(ctx, W / 2 + 8, 4, 1, 6, "#c98f2a");
  // 공 바구니
  px(ctx, 22, H - 9, 8, 5, "#ffffff");
  px(ctx, 22, H - 7, 8, 1, "#d6dde2");
  for (const bx of [23, 25, 27]) px(ctx, bx, H - 11, 2, 2, "#d8f24a");
  // 오른쪽 아래 수건
  px(ctx, W - 32, H - 8, 7, 3, "#ff8fb1");
  px(ctx, W - 32, H - 7, 7, 1, "#ffffff");
}

