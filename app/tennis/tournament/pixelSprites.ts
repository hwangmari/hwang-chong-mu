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

// 8×12 선수 — 큰 얼굴·두 눈·볼터치·팀 색 머리띠의 꼬마 캐릭터 (주인 요청 2026-10-27 "더 귀엽게").
// 여성은 머리가 어깨까지 내려오고 흰 치마를 입는다
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
  px(ctx, x + 1, y + 11, 6, 1, "#0003");
  px(ctx, x + 2, y, 4, 1, hair);
  px(ctx, x + 1, y + 1, 6, 1, s.shirt); // 머리띠
  px(ctx, x + 1, y + 2, 6, 3, SKIN); // 얼굴
  if (s.female) {
    px(ctx, x + 1, y + 2, 1, 4, hair);
    px(ctx, x + 6, y + 2, 1, 4, hair);
    px(ctx, x + 2, y + 4, 1, 1, BLUSH);
    px(ctx, x + 5, y + 4, 1, 1, BLUSH);
  } else {
    px(ctx, x + 1, y + 4, 1, 1, BLUSH);
    px(ctx, x + 6, y + 4, 1, 1, BLUSH);
  }
  const ex = facing > 0 ? 1 : 0; // 보는 쪽으로 눈을 한 칸 민다
  px(ctx, x + 2 + ex, y + 3, 1, 1, "#222");
  px(ctx, x + 4 + ex, y + 3, 1, 1, "#222");
  px(ctx, x + 1, y + 5, 6, 3, s.shirt);
  if (s.female) px(ctx, x + 1, y + 8, 6, 1, "#ffffff");
  else px(ctx, x + 2, y + 8, 4, 1, SHORTS);
  px(ctx, x + 2, y + 9, 1, 2 - bob, SKIN);
  px(ctx, x + 5, y + 9, 1, 1 + bob, SKIN);
  if (cheer) {
    px(ctx, x, y + 2 - bob, 1, 3, SKIN);
    px(ctx, x + 7, y + 2 - bob, 1, 3, SKIN);
  } else {
    px(ctx, facing > 0 ? x + 7 : x - 2, y + 5, 2, 3, "#1b1b1b");
    px(ctx, facing > 0 ? x + 7 : x, y + 7, 1, 2, "#7a5a3a");
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
