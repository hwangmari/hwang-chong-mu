// 황총무 오피스 그림 — 플러스위키 픽셀 오피스(scripts/office/index.html)의 색·그리는 방식을 가져왔다.
// 바깥 그림 파일 없이 전부 사각형으로 그린다. 1칸 = 캔버스 S px.
import {
  BLOCKS,
  DECOR,
  GLASS_X,
  MAP_H,
  MAP_W,
  ROW_Y,
  STATIONS,
  WALL_Y,
  type Station,
} from "./stations";

export const S = 4;

const C = {
  wallTop: "#eceae4", wallTrim: "#c9c4ba", wallBase: "#8d877c",
  wood: "#c08552", woodLine: "#a96f42", woodHi: "#cb9060",
  floor: "#868f9c", floorAlt: "#7f8895", floorDot: "#939caa",
  carpet: "#a7b1bf", carpetLine: "#9ea8b6",
  tile: "#e9ebee", tileAlt: "#dfe2e6", gym: "#6f8a7e", gymLine: "#678176",
  desk: "#eeece6", deskSide: "#c9c4b8",
  chair: "#2f3440", chairHi: "#4a5060", chairBase: "#1e2129",
  monFrame: "#2b2f38", screen: "#7cc4f0",
  shelf: "#8a5a2e", shelfIn: "#5a3a1c",
  books: ["#d9634f", "#4f8fd9", "#58b06a", "#f2c14e", "#9b6bd1", "#ec8a3d", "#f1ede4"],
  notes: ["#ffd36b", "#ff9d8a", "#a8e0a0", "#ffffff"],
  leaf: "#4e9e57", leafHi: "#6cc073", pot: "#cf7a4b", potShade: "#a85f37",
  glass: "rgba(175,220,245,0.42)", glassFrame: "#9fb3c4",
  partition: "#a9b8c9", partitionHi: "#d2dce7",
  cabinet: "#d5d9df", cabinetTop: "#eef0f3",
};

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x * S, y * S, w * S, h * S);
}
// 모서리를 한 칸 깎은 사각형 — 픽셀인데 덜 딱딱하게
function soft(ctx: Ctx, x: number, y: number, w: number, h: number, color: string) {
  rect(ctx, x + 1, y, w - 2, h, color);
  rect(ctx, x, y + 1, w, h - 2, color);
}
function rnd(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function shadow(ctx: Ctx, x: number, y: number, w: number) {
  ctx.fillStyle = "rgba(30,25,40,.16)";
  ctx.fillRect((x + 1) * S, y * S, (w - 2) * S, 2 * S);
}

/* ── 바닥 · 벽 ── */
function drawFloors(ctx: Ctx) {
  // 돈 관리: 나무 바닥
  rect(ctx, 0, WALL_Y, 96, ROW_Y - WALL_Y, C.wood);
  for (let y = WALL_Y; y < ROW_Y; y += 6) {
    rect(ctx, 0, y, 96, 1, C.woodLine);
    for (let x = (y / 6) % 2 ? 0 : 12; x < 96; x += 24) rect(ctx, x, y, 1, 6, C.woodLine);
  }
  // 일과 시간: 회색 타일 카펫
  rect(ctx, 96, WALL_Y, GLASS_X - 96, ROW_Y - WALL_Y, C.floor);
  for (let y = WALL_Y; y < ROW_Y; y += 12)
    for (let x = 96; x < GLASS_X; x += 12) {
      if (((x + y) / 12) % 2 === 0) rect(ctx, x, y, 12, 12, C.floorAlt);
      rect(ctx, x + ((x * 7 + y) % 9) + 1, y + ((x + y * 3) % 10) + 1, 1, 1, C.floorDot);
    }
  // 친구들과 함께: 회의실 카펫
  rect(ctx, GLASS_X, WALL_Y, MAP_W - GLASS_X, ROW_Y - WALL_Y, C.carpet);
  for (let y = WALL_Y; y < ROW_Y; y += 10) rect(ctx, GLASS_X, y, MAP_W - GLASS_X, 1, C.carpetLine);
  // 몸과 습관: 왼쪽 탕비실 타일 · 오른쪽 헬스장 고무 바닥
  for (let x = 0; x < 196; x += 8)
    for (let y = ROW_Y; y < MAP_H; y += 8) rect(ctx, x, y, 8, 8, ((x + y) / 8) % 2 === 0 ? C.tileAlt : C.tile);
  rect(ctx, 196, ROW_Y, MAP_W - 196, MAP_H - ROW_Y, C.gym);
  for (let x = 196; x < MAP_W; x += 16) rect(ctx, x, ROW_Y, 1, MAP_H - ROW_Y, C.gymLine);
  for (let y = ROW_Y; y < MAP_H; y += 16) rect(ctx, 196, y, MAP_W - 196, 1, C.gymLine);
}

function drawWindow(ctx: Ctx, x: number, y: number, w: number, h: number, gold: boolean) {
  soft(ctx, x - 1, y - 1, w + 2, h + 2, "#b9c0c9");
  rect(ctx, x, y, w, h, "#a9d6f5");
  rect(ctx, x, y + Math.floor(h / 2), w, h - Math.floor(h / 2), "#c6e5f8");
  const r = rnd(x * 3 + 11);
  for (let bx = x; bx < x + w; ) {
    let bw = 4 + Math.floor(r() * 5);
    const bh = 5 + Math.floor(r() * (h - 6));
    const col = ["#8aa0b8", "#7d93ad", "#9fb2c6", "#6f85a0"][Math.floor(r() * 4)];
    bw = Math.min(bw, x + w - bx);
    rect(ctx, bx, y + h - bh, bw, bh, col);
    for (let ly = y + h - bh + 2; ly < y + h - 1; ly += 3)
      for (let lx = bx + 1; lx < bx + bw - 1; lx += 2) if (r() < 0.45) rect(ctx, lx, ly, 1, 1, "#fff6c8");
    bx += bw + (r() < 0.3 ? 1 : 0);
  }
  if (gold) {
    const gx = x + Math.floor(w * 0.6);
    rect(ctx, gx, y + 3, 5, h - 3, "#e2b64f");
    rect(ctx, gx + 1, y + 1, 3, 2, "#e2b64f");
    for (let gy = y + 5; gy < y + h; gy += 2) rect(ctx, gx + 1, gy, 3, 1, "#f4d27a");
  }
  rect(ctx, x, y, w, 2, "#e3e6ea");
  rect(ctx, x + Math.floor(w / 2), y, 1, h, "#b9c0c9");
  rect(ctx, x - 1, y + h + 1, w + 2, 1, "#d7dbe0");
}

function drawWall(ctx: Ctx) {
  rect(ctx, 0, 0, MAP_W, WALL_Y, C.wallTop);
  rect(ctx, 0, WALL_Y - 4, MAP_W, 1, C.wallTrim);
  rect(ctx, 0, WALL_Y - 3, MAP_W, 3, C.wallBase);
  // 창문: 벽에 건 것 사이 빈 곳
  drawWindow(ctx, 52, 4, 38, 19, false);
  drawWindow(ctx, 274, 4, 40, 19, true);
}

function drawPartitions(ctx: Ctx) {
  // 위/아래 줄 사이 낮은 칸막이 (BLOCKS 와 같은 자리)
  const segs: [number, number][] = [[0, 30], [64, 150], [186, GLASS_X]];
  segs.forEach(([a, b]) => {
    rect(ctx, a, ROW_Y - 3, b - a, 5, C.partition);
    rect(ctx, a, ROW_Y - 3, b - a, 1, C.partitionHi);
  });
  // 유리 회의실: 왼쪽 유리벽 + 아래 유리벽 (문은 비워 둔다)
  const glassV = (y0: number, y1: number) => {
    rect(ctx, GLASS_X - 2, y0, 3, y1 - y0, C.glass);
    rect(ctx, GLASS_X - 2, y0, 1, y1 - y0, C.glassFrame);
  };
  glassV(WALL_Y, 62);
  glassV(90, ROW_Y);
  const glassH = (x0: number, x1: number) => {
    rect(ctx, x0, ROW_Y - 4, x1 - x0, 6, C.glass);
    rect(ctx, x0, ROW_Y - 4, x1 - x0, 1, C.glassFrame);
    rect(ctx, x0, ROW_Y - 1, x1 - x0, 1, "rgba(255,255,255,0.55)");
  };
  glassH(GLASS_X - 2, 244);
  glassH(276, MAP_W);
  // 문틀
  rect(ctx, GLASS_X - 3, 61, 5, 1, "#7d8b9a");
  rect(ctx, GLASS_X - 3, 90, 5, 1, "#7d8b9a");
  rect(ctx, 243, ROW_Y - 5, 1, 7, "#7d8b9a");
  rect(ctx, 276, ROW_Y - 5, 1, 7, "#7d8b9a");
}

/* ── 장식 ── */
function drawPlant(ctx: Ctx, x: number, y: number) {
  soft(ctx, x + 1, y + 10, 10, 8, C.pot);
  rect(ctx, x + 1, y + 16, 10, 2, C.potShade);
  soft(ctx, x, y + 2, 12, 9, C.leaf);
  soft(ctx, x + 3, y, 6, 6, C.leafHi);
  rect(ctx, x + 2, y + 4, 2, 2, C.leafHi);
  rect(ctx, x + 8, y + 5, 2, 2, C.leafHi);
}
function drawSofa(ctx: Ctx, x: number, y: number) {
  shadow(ctx, x, y + 16, 40);
  soft(ctx, x, y, 40, 10, "#d97f97");
  soft(ctx, x, y + 6, 40, 10, "#e59ab0");
  rect(ctx, x + 2, y + 7, 17, 6, "#eeb0c2");
  rect(ctx, x + 21, y + 7, 17, 6, "#eeb0c2");
  soft(ctx, x + 6, y + 2, 7, 6, "#ffd36b");
}
function drawWater(ctx: Ctx, x: number, y: number) {
  soft(ctx, x, y + 6, 10, 12, "#f4f6f8");
  soft(ctx, x + 1, y, 8, 8, "#cfe8f7");
  rect(ctx, x + 3, y + 10, 4, 1, "#5b6170");
  rect(ctx, x + 4, y + 12, 2, 2, "#9fd2f2");
}

/* ── 서비스 가구 ── */
function deskTop(ctx: Ctx, x: number, y: number, w: number, h: number) {
  shadow(ctx, x, y + h, w);
  soft(ctx, x, y, w, h, C.desk);
  rect(ctx, x + 1, y, w - 2, 1, "#f8f7f3");
  rect(ctx, x + 1, y + h - 3, w - 2, 3, C.deskSide);
}
function woodDesk(ctx: Ctx, x: number, y: number, w: number, h: number) {
  shadow(ctx, x, y + h, w);
  soft(ctx, x, y, w, h, "#a8744a");
  rect(ctx, x + 1, y, w - 2, 1, "#c08a5c");
  rect(ctx, x + 1, y + h - 3, w - 2, 3, "#7f5434");
}
function monitor(ctx: Ctx, x: number, y: number, screen = C.screen) {
  soft(ctx, x, y, 14, 10, C.monFrame);
  rect(ctx, x + 1, y + 1, 12, 7, screen);
  rect(ctx, x + 6, y + 10, 2, 2, C.monFrame);
  rect(ctx, x + 4, y + 12, 6, 1, C.monFrame);
}
function chairBack(ctx: Ctx, cx: number, y: number) {
  soft(ctx, cx - 6, y, 12, 9, C.chair);
  rect(ctx, cx - 5, y + 1, 10, 2, C.chairHi);
  rect(ctx, cx - 1, y + 9, 2, 2, C.chairBase);
  rect(ctx, cx - 5, y + 11, 10, 1, C.chairBase);
}
function paper(ctx: Ctx, x: number, y: number, w = 8, h = 10) {
  soft(ctx, x, y, w, h, "#ffffff");
  for (let i = 0; i < Math.floor((h - 2) / 2); i++) rect(ctx, x + 1, y + 2 + i * 2, w - 2 - (i % 2), 1, "#b9c2d0");
}
function wallBoard(ctx: Ctx, x: number, y: number, w: number, h: number, frame = "#9aa3b5", inner = "#f7f8fb") {
  soft(ctx, x, y, w, h, frame);
  rect(ctx, x + 1, y + 1, w - 2, h - 2, inner);
}

const DRAW: Record<string, (ctx: Ctx, s: Station) => void> = {
  // 가계부: 나무 책상 위 펼친 장부 + 계산기 + 동전
  "account-book": (ctx, { rect: r }) => {
    woodDesk(ctx, r.x, r.y + 4, r.w, r.h - 4);
    soft(ctx, r.x + 4, r.y + 6, 16, 10, "#ffffff");
    rect(ctx, r.x + 12, r.y + 6, 1, 10, "#d5dae3");
    for (let i = 0; i < 4; i++) {
      rect(ctx, r.x + 5, r.y + 8 + i * 2, 6, 1, "#b9c2d0");
      rect(ctx, r.x + 14, r.y + 8 + i * 2, 5, 1, i === 3 ? "#d9634f" : "#4f8fd9");
    }
    soft(ctx, r.x + 23, r.y + 6, 7, 9, "#5b6170");
    rect(ctx, r.x + 24, r.y + 7, 5, 2, "#a8e0a0");
    for (let i = 0; i < 3; i++) rect(ctx, r.x + 24 + i * 2, r.y + 11, 1, 1, "#eeeae2");
    for (let i = 0; i < 3; i++) rect(ctx, r.x + 24 + i * 2, r.y + 13, 1, 1, "#eeeae2");
    soft(ctx, r.x + 20, r.y + 1, 4, 4, "#f2c14e");
    soft(ctx, r.x + 25, r.y + 2, 4, 3, "#e2b64f");
  },
  // 경조사비: 선물 상자·봉투가 가득한 선반
  "gift-log": (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    soft(ctx, r.x, r.y, r.w, r.h, "#b98b5e");
    rect(ctx, r.x + 1, r.y, r.w - 2, 2, "#cfa173");
    for (let row = 0; row < 3; row++) rect(ctx, r.x + 2, r.y + 3 + row * 8, r.w - 4, 6, "#7a5638");
    const box = ["#d9634f", "#f2c14e", "#58b06a", "#ff8fb3", "#4f8fd9"];
    [[3, 4], [10, 5], [18, 3], [3, 12], [12, 12], [20, 13]].forEach(([dx, dy], i) => {
      const c = box[i % box.length];
      soft(ctx, r.x + dx, r.y + dy, 6, 6 - (dy % 2), c);
      rect(ctx, r.x + dx + 2, r.y + dy, 2, 6 - (dy % 2), "#ffffff");
    });
    for (let i = 0; i < 4; i++) {
      rect(ctx, r.x + 3 + i * 6, r.y + 20, 5, 4, "#f7f8fb");
      rect(ctx, r.x + 3 + i * 6, r.y + 20, 5, 1, "#d9634f");
    }
  },
  // 업무 캘린더: 벽 칸반 보드 + 달력 칸
  schedule: (ctx, { rect: r }) => {
    wallBoard(ctx, r.x, r.y, r.w, r.h);
    rect(ctx, r.x + 2, r.y + 1, r.w - 4, 3, "#d9634f");
    for (let c = 0; c < 7; c++)
      for (let w = 0; w < 3; w++) {
        const on = (c + w * 3) % 5 === 0;
        rect(ctx, r.x + 3 + c * 5 + (c > 3 ? 1 : 0), r.y + 6 + w * 4, 4, 3, on ? C.notes[(c + w) % 3] : "#e6e9ef");
      }
  },
  // 야근 계산기: 황총무 책상 — 모니터 둘 + 달 모양 스탠드 + 커피
  overtime: (ctx, { rect: r }) => {
    deskTop(ctx, r.x, r.y + 6, r.w, r.h - 6);
    monitor(ctx, r.x + 5, r.y - 2, "#5b6fae");
    rect(ctx, r.x + 8, r.y + 1, 4, 1, "#ffd36b");
    rect(ctx, r.x + 8, r.y + 3, 6, 1, "#9fc6ec");
    monitor(ctx, r.x + 20, r.y - 2);
    rect(ctx, r.x + 33, r.y + 2, 1, 8, "#5b6170");
    soft(ctx, r.x + 32, r.y - 2, 5, 5, "#ffd36b");
    rect(ctx, r.x + 34, r.y - 1, 2, 2, "#fff6c8");
    soft(ctx, r.x + 9, r.y + 12, 16, 3, "#eeeae2");
    soft(ctx, r.x + 28, r.y + 11, 4, 4, "#ffffff");
    rect(ctx, r.x + 29, r.y + 12, 2, 2, "#8a5a2e");
    // 명패
    soft(ctx, r.x + 2, r.y + 12, 6, 3, "#f2c14e");
    chairBack(ctx, r.x + 20, r.y + r.h + 1);
  },
  // 약속 잡기: 벽 달력 (동그라미 친 날)
  meeting: (ctx, { rect: r }) => {
    wallBoard(ctx, r.x, r.y, r.w, r.h, "#9aa3b5", "#ffffff");
    rect(ctx, r.x + 1, r.y + 1, r.w - 2, 4, "#4f8fd9");
    rect(ctx, r.x + 6, r.y - 1, 1, 3, "#5b6170");
    rect(ctx, r.x + r.w - 7, r.y - 1, 1, 3, "#5b6170");
    for (let c = 0; c < 5; c++)
      for (let w = 0; w < 3; w++) rect(ctx, r.x + 3 + c * 4, r.y + 7 + w * 4, 2, 2, "#c3c9d1");
    soft(ctx, r.x + 10, r.y + 10, 5, 5, "#ff9d8a");
    rect(ctx, r.x + 11, r.y + 11, 2, 2, "#d9634f");
  },
  // 장소잡기: 벽 지도 + 핀
  place: (ctx, { rect: r }) => {
    wallBoard(ctx, r.x, r.y, r.w, r.h, "#a98a62", "#cfe8c8");
    rect(ctx, r.x + 1, r.y + 12, r.w - 2, 3, "#9fd2f2");
    rect(ctx, r.x + 12, r.y + 1, 2, r.h - 2, "#f7f8fb");
    rect(ctx, r.x + 1, r.y + 6, r.w - 2, 1, "#f7f8fb");
    soft(ctx, r.x + 20, r.y + 3, 6, 5, "#b7dca9");
    soft(ctx, r.x + 6, r.y + 7, 3, 4, "#d9634f");
    rect(ctx, r.x + 7, r.y + 11, 1, 2, "#d9634f");
    soft(ctx, r.x + 24, r.y + 9, 3, 4, "#4f8fd9");
    rect(ctx, r.x + 25, r.y + 13, 1, 2, "#4f8fd9");
  },
  // 여행 플랜: 캐리어 두 개
  travel: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    soft(ctx, r.x, r.y + 2, 10, 14, "#4fc1b5");
    rect(ctx, r.x + 3, r.y, 4, 2, "#3b3f52");
    rect(ctx, r.x + 2, r.y + 6, 6, 1, "#3e9d93");
    rect(ctx, r.x + 2, r.y + 10, 6, 1, "#3e9d93");
    soft(ctx, r.x + 10, r.y + 6, 8, 10, "#f2b84b");
    rect(ctx, r.x + 12, r.y + 4, 4, 2, "#3b3f52");
    soft(ctx, r.x + 12, r.y + 9, 4, 3, "#ffffff");
  },
  // 여행 경비 계산기: 회의 테이블 위 영수증·동전·노트북
  calc: (ctx, { rect: r }) => {
    for (let i = 0; i < 4; i++) {
      soft(ctx, r.x + 4 + i * 11, r.y - 6, 9, 8, C.chair);
      soft(ctx, r.x + 4 + i * 11, r.y + r.h - 1, 9, 8, C.chair);
    }
    shadow(ctx, r.x, r.y + r.h, r.w);
    soft(ctx, r.x, r.y, r.w, r.h, C.desk);
    rect(ctx, r.x + 1, r.y + r.h - 3, r.w - 2, 3, C.deskSide);
    soft(ctx, r.x + 17, r.y + 4, 14, 9, "#e9eef5");
    rect(ctx, r.x + 19, r.y + 6, 10, 5, "#9fc6ec");
    paper(ctx, r.x + 4, r.y + 4, 7, 11);
    paper(ctx, r.x + 36, r.y + 6, 7, 9);
    soft(ctx, r.x + 12, r.y + 13, 4, 4, "#f2c14e");
    soft(ctx, r.x + 31, r.y + 13, 4, 4, "#f2c14e");
  },
  // 게임방: 오락기
  game: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    soft(ctx, r.x, r.y, r.w, r.h, "#9b6bd1");
    rect(ctx, r.x + 1, r.y + 1, r.w - 2, 3, "#ff8fb3");
    soft(ctx, r.x + 2, r.y + 5, r.w - 4, 9, "#2b2f38");
    rect(ctx, r.x + 4, r.y + 7, 3, 2, "#7ef0a0");
    rect(ctx, r.x + 9, r.y + 9, 3, 2, "#ffd36b");
    rect(ctx, r.x + 2, r.y + 15, r.w - 4, 4, "#7d55b0");
    rect(ctx, r.x + 4, r.y + 15, 1, 3, "#2b2f38");
    soft(ctx, r.x + 3, r.y + 14, 3, 2, "#d9634f");
    rect(ctx, r.x + 9, r.y + 16, 2, 2, "#4f8fd9");
    rect(ctx, r.x + 12, r.y + 16, 2, 2, "#f2c14e");
  },
  // 테니스 대회: 라켓 거치대 + 공 바구니
  tennis: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    rect(ctx, r.x + 1, r.y + 2, 16, 2, "#5b6170");
    [0, 6, 12].forEach((dx, i) => {
      soft(ctx, r.x + dx, r.y + 3, 6, 8, ["#d9634f", "#4f8fd9", "#3b3f52"][i]);
      rect(ctx, r.x + dx + 1, r.y + 4, 4, 6, "#f1ede4");
      rect(ctx, r.x + dx + 2, r.y + 11, 2, 4, "#3b3f52");
    });
    soft(ctx, r.x + 3, r.y + 14, 12, 8, "#c3c9d1");
    for (let i = 0; i < 4; i++) soft(ctx, r.x + 4 + i * 3, r.y + 13 - (i % 2), 3, 3, "#d8ea4f");
  },
  // 습관 트래커: 체크 표가 붙은 이동식 화이트보드
  habit: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    rect(ctx, r.x + 3, r.y + 16, 1, 6, "#7d858f");
    rect(ctx, r.x + r.w - 4, r.y + 16, 1, 6, "#7d858f");
    wallBoard(ctx, r.x, r.y, r.w, 17);
    for (let row = 0; row < 3; row++)
      for (let c = 0; c < 5; c++) {
        const done = (row * 5 + c) % 4 !== 3;
        rect(ctx, r.x + 3 + c * 5, r.y + 3 + row * 4, 3, 3, done ? "#58b06a" : "#e6e9ef");
      }
  },
  // 하루 일기: 작은 책상 + 펼친 일기장 + 스탠드
  daily: (ctx, { rect: r }) => {
    woodDesk(ctx, r.x, r.y + 2, r.w, r.h - 2);
    soft(ctx, r.x + 5, r.y + 4, 16, 9, "#fff6c8");
    rect(ctx, r.x + 13, r.y + 4, 1, 9, "#e2c98a");
    for (let i = 0; i < 3; i++) {
      rect(ctx, r.x + 6, r.y + 6 + i * 2, 6, 1, "#c9b37a");
      rect(ctx, r.x + 15, r.y + 6 + i * 2, 5, 1, "#c9b37a");
    }
    rect(ctx, r.x + 20, r.y + 9, 6, 1, "#d9634f");
    rect(ctx, r.x + 27, r.y - 2, 1, 8, "#5b6170");
    soft(ctx, r.x + 25, r.y - 4, 5, 3, "#ffd36b");
  },
  // 식단·체중: 냉장고
  diet: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    soft(ctx, r.x, r.y, r.w, r.h, "#e6e9ee");
    rect(ctx, r.x + 1, r.y + 11, r.w - 2, 1, "#b8bec7");
    rect(ctx, r.x + r.w - 4, r.y + 3, 1, 5, "#8a909c");
    rect(ctx, r.x + r.w - 4, r.y + 14, 1, 7, "#8a909c");
    soft(ctx, r.x + 3, r.y + 3, 6, 5, "#a8e0a0");
    rect(ctx, r.x + 4, r.y + 15, 4, 4, "#ff9d8a");
    rect(ctx, r.x + 5, r.y + 14, 1, 1, "#58b06a");
  },
  // 인바디: 체성분 측정기
  inbody: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    soft(ctx, r.x, r.y + 16, r.w, 8, "#d5d9df");
    rect(ctx, r.x + 3, r.y + 17, 4, 5, "#9aa3ad");
    rect(ctx, r.x + 9, r.y + 17, 4, 5, "#9aa3ad");
    rect(ctx, r.x + 7, r.y + 4, 2, 12, "#c3c9d1");
    soft(ctx, r.x + 1, r.y, 14, 7, "#eef0f3");
    rect(ctx, r.x + 3, r.y + 1, 10, 4, "#4f8fd9");
    rect(ctx, r.x + 4, r.y + 2, 3, 1, "#ffffff");
    rect(ctx, r.x, r.y + 5, 2, 4, "#5b6170");
    rect(ctx, r.x + 14, r.y + 5, 2, 4, "#5b6170");
  },
  // 근육 지도: 세워 둔 근육 포스터
  muscle: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    rect(ctx, r.x + 4, r.y + 22, 1, 6, "#7d858f");
    rect(ctx, r.x + r.w - 5, r.y + 22, 1, 6, "#7d858f");
    wallBoard(ctx, r.x, r.y, r.w, 23, "#9aa3b5", "#fff8f2");
    const cx = r.x + Math.floor(r.w / 2);
    soft(ctx, cx - 2, r.y + 2, 4, 4, "#f2b9a0");
    soft(ctx, cx - 4, r.y + 6, 8, 7, "#e86a5c");
    rect(ctx, cx - 1, r.y + 7, 2, 5, "#c94f43");
    rect(ctx, cx - 6, r.y + 7, 2, 6, "#ec8a7d");
    rect(ctx, cx + 4, r.y + 7, 2, 6, "#ec8a7d");
    rect(ctx, cx - 3, r.y + 13, 2, 7, "#e86a5c");
    rect(ctx, cx + 1, r.y + 13, 2, 7, "#e86a5c");
  },
  // 운동 기록: 벤치 + 덤벨 거치대
  workout: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    soft(ctx, r.x, r.y + 8, 18, 6, "#3b3f52");
    rect(ctx, r.x + 1, r.y + 8, 16, 2, "#5b6170");
    rect(ctx, r.x + 3, r.y + 14, 2, 4, "#2b2f38");
    rect(ctx, r.x + 13, r.y + 14, 2, 4, "#2b2f38");
    soft(ctx, r.x + 21, r.y + 4, 19, 14, "#9aa3ad");
    rect(ctx, r.x + 22, r.y + 9, 17, 1, "#7d858f");
    [0, 6, 12].forEach((dx, i) => {
      const c = ["#d9634f", "#f2c14e", "#4f8fd9"][i];
      rect(ctx, r.x + 23 + dx, r.y + 6, 1, 3, c);
      rect(ctx, r.x + 24 + dx, r.y + 7, 2, 1, "#3b3f52");
      rect(ctx, r.x + 26 + dx, r.y + 6, 1, 3, c);
      rect(ctx, r.x + 23 + dx, r.y + 12, 1, 3, c);
      rect(ctx, r.x + 24 + dx, r.y + 13, 2, 1, "#3b3f52");
      rect(ctx, r.x + 26 + dx, r.y + 12, 1, 3, c);
    });
  },
  // 레슨 일지: 볼머신 + 클립보드
  lesson: (ctx, { rect: r }) => {
    shadow(ctx, r.x, r.y + r.h, r.w);
    soft(ctx, r.x, r.y + 6, 16, 14, "#4f8fd9");
    rect(ctx, r.x + 1, r.y + 6, 14, 2, "#7aaee8");
    soft(ctx, r.x + 3, r.y + 1, 10, 6, "#3b3f52");
    for (let i = 0; i < 3; i++) soft(ctx, r.x + 4 + i * 3, r.y + 2, 3, 3, "#d8ea4f");
    rect(ctx, r.x + 6, r.y + 12, 4, 3, "#2b2f38");
    soft(ctx, r.x + 18, r.y + 8, 8, 11, "#a98a62");
    paper(ctx, r.x + 19, r.y + 10, 6, 8);
    rect(ctx, r.x + 20, r.y + 7, 4, 2, "#7d858f");
  },
  // 블로그: 벽 책장
  blog: (ctx, { rect: r }) => {
    soft(ctx, r.x, r.y, r.w, r.h, C.shelf);
    const rr = rnd(7);
    for (let row = 0; row < 3; row++) {
      rect(ctx, r.x + 2, r.y + 2 + row * 7, r.w - 4, 6, C.shelfIn);
      for (let bx = r.x + 3; bx < r.x + r.w - 3; ) {
        const bw = 2 + Math.floor(rr() * 2);
        const bh = 4 + Math.floor(rr() * 2);
        rect(ctx, bx, r.y + 8 + row * 7 - bh, bw, bh, C.books[Math.floor(rr() * C.books.length)]);
        bx += bw + (rr() < 0.2 ? 2 : 0);
      }
    }
  },
  // 포트폴리오: 벽 액자 (황총무 얼굴)
  portfolio: (ctx, { rect: r }) => {
    soft(ctx, r.x, r.y, r.w, r.h, "#e2b64f");
    rect(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4, "#cfe0ff");
    const cx = r.x + Math.floor(r.w / 2);
    soft(ctx, cx - 4, r.y + 3, 8, 7, "#3b2a24");
    soft(ctx, cx - 3, r.y + 5, 6, 5, "#f6d2b8");
    soft(ctx, cx - 5, r.y + 10, 10, 5, "#e86a5c");
  },
};

/** 고정된 배경 전체 (바닥·벽·가구) — 한 번 그려 두고 매 장면 복사해 쓴다 */
export function drawBackground(ctx: Ctx) {
  drawFloors(ctx);
  drawWall(ctx);
  drawPartitions(ctx);
  DECOR.forEach((d) => {
    if (d.kind === "plant") drawPlant(ctx, d.x, d.y);
    else if (d.kind === "sofa") drawSofa(ctx, d.x, d.y);
    else if (d.kind === "water") drawWater(ctx, d.x, d.y);
  });
  STATIONS.forEach((s) => DRAW[s.key]?.(ctx, s));
}

/** 가까이 있는 가구 둘레에 노란 테두리 */
export function drawHighlight(ctx: Ctx, s: Station) {
  const { x, y, w, h } = s.rect;
  ctx.strokeStyle = "rgba(255, 211, 107, 0.95)";
  ctx.lineWidth = S * 0.75;
  ctx.strokeRect((x - 1.5) * S, (y - 1.5) * S, (w + 3) * S, (h + 3) * S);
}

/* ── 황총무 캐릭터 (12×20칸) — 단발머리 · 산호색 니트 · 노란 총무 명찰 ── */
export type Facing = "down" | "up" | "left" | "right";

const P = {
  hair: "#3b2a24", hairHi: "#5a4036", skin: "#f6d2b8", eye: "#2b2f38", blush: "#f4a5a0",
  top: "#e86a5c", topShade: "#c94f43", badge: "#ffd36b", pants: "#3c4a66", shoe: "#2b2f38",
};

/** (fx, fy) = 발 가운데. step = 걷는 그림 번호(0·1·2·3), bob = 점프 높이 */
export function drawHwang(ctx: Ctx, fx: number, fy: number, facing: Facing, step: number, bob = 0) {
  const x = Math.round(fx) - 6;
  const y = Math.round(fy) - 20 - bob;
  const px = (dx: number, dy: number, w: number, h: number, c: string) => rect(ctx, x + dx, y + dy, w, h, c);

  // 발밑 그림자
  ctx.fillStyle = "rgba(30,25,40,.2)";
  ctx.fillRect((x + 2) * S, (Math.round(fy) - 1) * S, 8 * S, 2 * S);

  const walking = step % 2 === 1;
  const legA = step === 1 ? -1 : step === 3 ? 1 : 0;

  // 다리·신발
  if (facing === "left" || facing === "right") {
    px(4, 15, 4, 3, P.pants);
    px(4 + (walking ? legA : 0), 18, 3, 2, P.shoe);
    px(5 - (walking ? legA : 0), 18, 3, 2, P.shoe);
  } else {
    px(3, 15, 3, 3 + (legA < 0 ? -1 : 0), P.pants);
    px(6, 15, 3, 3 + (legA > 0 ? -1 : 0), P.pants);
    px(3, 18 + (legA < 0 ? -1 : 0), 3, 2, P.shoe);
    px(6, 18 + (legA > 0 ? -1 : 0), 3, 2, P.shoe);
  }

  // 몸통 (니트) + 팔
  px(2, 9, 8, 6, P.top);
  px(2, 14, 8, 1, P.topShade);
  if (facing === "down") {
    px(1, 10, 1, 4, P.top);
    px(10, 10, 1, 4, P.top);
    px(1, 14, 1, 1, P.skin);
    px(10, 14, 1, 1, P.skin);
    px(7, 11, 2, 2, P.badge);
  } else if (facing === "up") {
    px(1, 10, 1, 4, P.top);
    px(10, 10, 1, 4, P.top);
  } else {
    const arm = facing === "right" ? 5 + (walking ? legA : 0) : 6 - (walking ? legA : 0);
    px(arm, 10, 1, 4, P.topShade);
    px(arm, 14, 1, 1, P.skin);
    if (facing === "right") px(8, 11, 1, 2, P.badge);
    else px(3, 11, 1, 2, P.badge);
  }

  // 머리 (단발)
  if (facing === "up") {
    px(2, 0, 8, 10, P.hair);
    px(3, 1, 6, 1, P.hairHi);
    return;
  }
  px(2, 0, 8, 4, P.hair);
  px(3, 0, 5, 1, P.hairHi);
  if (facing === "down") {
    px(3, 3, 6, 6, P.skin);
    px(2, 3, 1, 6, P.hair);
    px(9, 3, 1, 6, P.hair);
    px(3, 3, 6, 1, P.hair); // 앞머리
    px(4, 5, 1, 2, P.eye);
    px(7, 5, 1, 2, P.eye);
    px(3, 7, 1, 1, P.blush);
    px(8, 7, 1, 1, P.blush);
    px(5, 8, 2, 1, "#d98a7a");
  } else {
    const r = facing === "right";
    px(r ? 4 : 3, 3, 5, 6, P.skin);
    px(r ? 2 : 8, 3, 2, 7, P.hair); // 뒷머리
    px(r ? 4 : 3, 3, 5, 1, P.hair);
    px(r ? 7 : 4, 5, 1, 2, P.eye);
    px(r ? 7 : 4, 7, 1, 1, P.blush);
  }
}

/** 발 상자(가로 8 · 세로 4)가 막힌 곳과 겹치는지 */
export function blockedAt(fx: number, fy: number) {
  const l = fx - 4;
  const t = fy - 3;
  if (l < 0 || fx + 4 > MAP_W || fy + 1 > MAP_H) return true;
  return BLOCKS.some((b) => l < b.x + b.w && l + 8 > b.x && t < b.y + b.h && t + 4 > b.y);
}

/* ── 픽셀 화면 — OfficeView 가 매 장면 부른다 ── */
export type WalkerView = { x: number; y: number; facing: Facing; step: number; near: Station | null };

export type OfficeRenderer = {
  draw: (v: WalkerView) => void;
  /** 사무실 칸(x, y)과 높이 h(칸)가 그림 위 어디인지 — 그림 왼쪽 위 기준 % */
  project: (x: number, y: number, h: number) => { left: number; top: number } | null;
  /** 화면에서 누른 곳 → 사무실 칸 (+ 누른 가구) */
  pick: (clientX: number, clientY: number) => { x: number; y: number; key?: string } | null;
  resize: () => void;
  dispose: () => void;
  /** 동숲 화면만: 확대(+1)·축소(-1) */
  zoom?: (dir: 1 | -1) => void;
  /** 동숲 화면만: 사무실 전체 보기 ↔ 황총무 따라가기 */
  setOverview?: (on: boolean) => void;
};

/* ── 사무실 바깥 풍경 (걸어갈 수 없는 곳) — 잔디 · 나무 · 연못 · 꽃밭 · 입구 길 · 도로 ──
 * 사무실 좌표 그대로 그리되 바깥은 음수/사무실 크기 너머다. 전체 화면에서 빈 검은 곳이 보이지 않게 (2026-10-27) */
const M = 140; // 사무실 둘레로 그려 두는 바깥 폭 (칸)
const DOOR = { x: 150, w: 36 }; // 아래 벽 가운데 입구 (탕비실·헬스장 사이 칸막이 문과 같은 줄)

function drawTree(ctx: Ctx, x: number, y: number, k: number) {
  ctx.fillStyle = "rgba(30,50,30,.18)";
  ctx.fillRect((x - 9) * S, (y + 18) * S, 22 * S, 4 * S);
  rect(ctx, x + 1, y + 12, 4, 9, "#8a5a2e");
  const leaf = ["#4e9e57", "#58a85f", "#468f4f"][k % 3];
  soft(ctx, x - 8, y + 2, 22, 13, leaf);
  soft(ctx, x - 5, y - 4, 16, 10, leaf);
  soft(ctx, x - 2, y - 3, 7, 5, "#6cc073");
  rect(ctx, x + 6, y + 4, 3, 2, "#6cc073");
}

function drawOutdoors(ctx: Ctx) {
  const x0 = -M;
  const y0 = -M;
  const w = MAP_W + M * 2;
  const h = MAP_H + M * 2;
  const r = rnd(42);
  // 잔디 + 바둑판 결 + 풀잎·작은 꽃
  rect(ctx, x0, y0, w, h, "#8cc46a");
  for (let y = y0; y < y0 + h; y += 16)
    for (let x = x0; x < x0 + w; x += 16) if (((x + y) / 16) % 2 === 0) rect(ctx, x, y, 16, 16, "#86bf64");
  for (let i = 0; i < 900; i++) {
    const x = x0 + Math.floor(r() * w);
    const y = y0 + Math.floor(r() * h);
    const c = r();
    rect(ctx, x, y, 1, c < 0.85 ? 2 : 1, c < 0.85 ? "#76b058" : ["#ffffff", "#ffd36b", "#ff9db5"][Math.floor(r() * 3)]);
  }
  // 입구에서 아래로 내려가는 돌길 + 도로
  const roadY = MAP_H + 58;
  for (let y = MAP_H; y < roadY; y += 6)
    for (let x = DOOR.x; x < DOOR.x + DOOR.w; x += 9) soft(ctx, x + ((y / 6) % 2 ? 4 : 0), y + 1, 8, 5, "#e8dcc4");
  rect(ctx, x0, roadY - 4, w, 4, "#d5d9df"); // 보도
  rect(ctx, x0, roadY, w, 26, "#5b6170");
  for (let x = x0; x < x0 + w; x += 20) rect(ctx, x, roadY + 12, 10, 2, "#ffd36b");
  rect(ctx, x0, roadY + 26, w, 4, "#d5d9df");
  // 길가 자동차 하나
  soft(ctx, 250, roadY + 3, 30, 10, "#e86a5c");
  soft(ctx, 256, roadY, 18, 6, "#cfe8f7");
  rect(ctx, 254, roadY + 12, 5, 3, "#2b2f38");
  rect(ctx, 272, roadY + 12, 5, 3, "#2b2f38");
  // 연못 (왼쪽) + 연잎
  soft(ctx, -96, 96, 64, 40, "#7fbfdf");
  soft(ctx, -90, 92, 52, 48, "#7fbfdf");
  soft(ctx, -86, 100, 40, 30, "#9fd2f2");
  [[-80, 108], [-60, 118], [-70, 100]].forEach(([x, y]) => soft(ctx, x, y, 7, 4, "#58b06a"));
  rect(ctx, -58, 117, 2, 2, "#ff9db5");
  // 입구 양옆 꽃밭
  [DOOR.x - 34, DOOR.x + DOOR.w + 6].forEach((fx) => {
    soft(ctx, fx, MAP_H + 6, 28, 12, "#8a5a2e");
    for (let i = 0; i < 10; i++) rect(ctx, fx + 2 + (i % 5) * 5, MAP_H + 8 + Math.floor(i / 5) * 5, 3, 3, ["#ff9db5", "#ffd36b", "#ffffff", "#e86a5c"][i % 4]);
  });
  // 벤치 · 가로등
  soft(ctx, DOOR.x + DOOR.w + 44, MAP_H + 30, 22, 5, "#a8744a");
  rect(ctx, DOOR.x + DOOR.w + 46, MAP_H + 35, 2, 3, "#5b6170");
  rect(ctx, DOOR.x + DOOR.w + 62, MAP_H + 35, 2, 3, "#5b6170");
  [DOOR.x - 10, DOOR.x + DOOR.w + 8].forEach((lx) => {
    rect(ctx, lx, MAP_H + 24, 2, 22, "#5b6170");
    soft(ctx, lx - 2, MAP_H + 20, 6, 5, "#fff6c8");
  });
  // 나무: 사무실·길·도로·연못을 피해 흩어 심는다
  const trees: [number, number][] = [];
  for (let y = y0 + 8; y < y0 + h - 20; y += 30)
    for (let x = x0 + 8; x < x0 + w - 16; x += 34) {
      const tx = x + Math.floor(r() * 14);
      const ty = y + Math.floor(r() * 10);
      const inOffice = tx > -18 && tx < MAP_W + 12 && ty > -26 && ty < MAP_H + 4;
      const onPath = tx > DOOR.x - 46 && tx < DOOR.x + DOOR.w + 70 && ty > MAP_H - 10 && ty < roadY;
      const onRoad = ty > roadY - 26 && ty < roadY + 34;
      const onPond = tx > -110 && tx < -20 && ty > 72 && ty < 150;
      if (!inOffice && !onPath && !onRoad && !onPond && r() < 0.62) trees.push([tx, ty]);
    }
  trees.sort((a, b) => a[1] - b[1]).forEach(([tx, ty], i) => drawTree(ctx, tx, ty, i));
  // 건물 둘레: 바닥 그림자 + 바깥벽 (왼쪽·오른쪽·아래, 아래 가운데는 입구)
  ctx.fillStyle = "rgba(30,25,40,.22)";
  ctx.fillRect(-2 * S, (MAP_H + 3) * S, (MAP_W + 6) * S, 5 * S);
  ctx.fillRect((MAP_W + 3) * S, 4 * S, 4 * S, (MAP_H + 2) * S);
  const wall = "#c9c4ba";
  rect(ctx, -3, 0, 3, MAP_H + 3, wall);
  rect(ctx, MAP_W, 0, 3, MAP_H + 3, wall);
  rect(ctx, -3, MAP_H, DOOR.x + 3, 3, wall);
  rect(ctx, DOOR.x + DOOR.w, MAP_H, MAP_W - DOOR.x - DOOR.w + 3, 3, wall);
  rect(ctx, -3, 0, 1, MAP_H + 3, "#e3dfd7");
  rect(ctx, MAP_W + 2, 0, 1, MAP_H + 3, "#a9a398");
  soft(ctx, DOOR.x + 4, MAP_H, DOOR.w - 8, 4, "#b98b5e"); // 현관 매트
}

type PixelOptions = { onOverview?: (on: boolean) => void; overview?: boolean };

/** 픽셀 화면 — 사무실 + 바깥 풍경을 큰 그림 한 장으로 그려 두고, 카메라(황총무 따라가기 · 전체 보기)로 잘라 보여 준다 */
export function createPixelRenderer(canvas: HTMLCanvasElement, host: HTMLElement, opts: PixelOptions = {}): OfficeRenderer {
  const ctx = canvas.getContext("2d")!;
  const world = document.createElement("canvas");
  world.width = (MAP_W + M * 2) * S;
  world.height = (MAP_H + M * 2) * S;
  const wctx = world.getContext("2d")!;
  wctx.translate(M * S, M * S);
  drawOutdoors(wctx);
  drawBackground(wctx);

  // 걷는 모션: 한 걸음마다 1칸 통통 + 발이 닿을 때 흙먼지 (움직임 줄이기 설정이면 흙먼지는 뺀다)
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const puffs: { x: number; y: number; t: number }[] = [];
  let lastX = NaN;
  let lastY = NaN;
  let lastStep = -1;

  /* 카메라 — 기본 크기는 예전(사무실이 화면에 꽉 차던 크기)의 0.8배 (2026-10-27 "0.8 배 느낌") */
  const BASE = 0.8;
  const ZOOMS = [0.7, 0.85, 1, 1.25, 1.55, 1.9];
  let zoomAt = 2;
  let overview = !!opts.overview;
  let cw = 1;
  let ch = 1;
  let dpr = 1;
  let scale = 1; // 화면 px(캔버스) / 사무실 칸
  let scaleGoal = 1;
  let camX = MAP_W / 2;
  let camY = MAP_H / 2;
  let snapped = false;
  const fitScale = () => Math.min(cw / MAP_W, ch / MAP_H); // 사무실이 화면에 딱 맞는 배율
  function goalScale() {
    // 전체 보기 = 사무실 전체 + 둘레 풍경 조금 / 따라가기 = 화면 높이 기준(세로 폰도 같은 크기)
    if (overview) return fitScale() * BASE;
    // 예전 크기: 가로 화면은 사무실이 딱 맞게, 세로 폰은 화면 높이에 맞게 — 그 0.8배
    const before = cw < ch ? ch / MAP_H : fitScale();
    return before * BASE * ZOOMS[zoomAt];
  }
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = Math.max(1, Math.round((host.clientWidth || 1) * dpr));
    ch = Math.max(1, Math.round((host.clientHeight || 1) * dpr));
    canvas.width = cw;
    canvas.height = ch;
    scaleGoal = goalScale();
    if (!snapped) scale = scaleGoal;
  }
  function setOverview(on: boolean) {
    if (overview === on) return;
    overview = on;
    scaleGoal = goalScale();
    opts.onOverview?.(on);
  }
  function zoom(dir: 1 | -1) {
    if (overview) {
      if (dir > 0) setOverview(false);
      return;
    }
    if (dir < 0 && zoomAt === 0) return setOverview(true);
    zoomAt = Math.max(0, Math.min(ZOOMS.length - 1, zoomAt + dir));
    scaleGoal = goalScale();
  }
  resize();
  opts.onOverview?.(overview);

  // 화면에 보이는 반쪽 크기(칸)만큼 카메라가 그려 둔 바깥 풍경 밖으로 나가지 않게 묶는다
  function clampCam(x: number, y: number) {
    const hx = cw / scale / 2;
    const hy = ch / scale / 2;
    const cx = hx * 2 >= MAP_W + M * 2 ? MAP_W / 2 : Math.min(Math.max(x, -M + hx), MAP_W + M - hx);
    const cy = hy * 2 >= MAP_H + M * 2 ? MAP_H / 2 : Math.min(Math.max(y, -M + hy), MAP_H + M - hy);
    return [cx, cy];
  }
  const offX = () => cw / 2 - camX * scale;
  const offY = () => ch / 2 - camY * scale;

  let last = performance.now();
  return {
    draw: (v) => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (Math.abs(scale - scaleGoal) > 0.001) scale += (scaleGoal - scale) * Math.min(1, dt * 10);
      const [tx, ty] = overview ? [MAP_W / 2, MAP_H / 2] : clampCam(v.x, v.y - 8);
      if (!snapped) {
        camX = tx;
        camY = ty;
        snapped = true;
      } else {
        camX += (tx - camX) * Math.min(1, dt * 8);
        camY += (ty - camY) * Math.min(1, dt * 8);
      }

      const moving = Math.abs(v.x - lastX) + Math.abs(v.y - lastY) > 0.05;
      lastX = v.x;
      lastY = v.y;
      // 왼발·오른발이 땅에 닿는 순간(그림 0·2)에 먼지 한 번
      if (moving && !calm && v.step !== lastStep && v.step % 2 === 0) puffs.push({ x: v.x + (v.step === 0 ? -2 : 2), y: v.y, t: 0 });
      lastStep = moving ? v.step : -1;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#8cc46a";
      ctx.fillRect(0, 0, cw, ch);
      ctx.imageSmoothingEnabled = false;
      // 그림 함수들은 1칸 = S px 로 그리므로, 화면 배율(scale)에 맞게 S 를 나눠 둔다
      ctx.setTransform(scale / S, 0, 0, scale / S, offX(), offY());
      ctx.drawImage(world, -M * S, -M * S);
      if (v.near) drawHighlight(ctx, v.near);
      for (let i = puffs.length - 1; i >= 0; i--) {
        const p = puffs[i];
        p.t += 1;
        if (p.t > 18) {
          puffs.splice(i, 1);
          continue;
        }
        const k = p.t / 18;
        ctx.fillStyle = `rgba(255, 255, 255, ${0.75 * (1 - k)})`;
        const r = 1 + k * 2;
        ctx.fillRect((p.x - r) * S, (p.y - 1 - k * 3) * S, r * 2 * S, r * S);
        ctx.fillRect((p.x - r / 2) * S, (p.y - 1.5 - k * 3 - r / 2) * S, r * S, r * S);
      }
      drawHwang(ctx, v.x, v.y, v.facing, moving ? v.step : 0, moving && v.step % 2 === 1 ? 1 : 0);
    },
    project: (x, y) => ({ left: ((x * scale + offX()) / cw) * 100, top: ((y * scale + offY()) / ch) * 100 }),
    pick: (cx, cy) => {
      const r = canvas.getBoundingClientRect();
      const x = (((cx - r.left) / r.width) * cw - offX()) / scale;
      const y = (((cy - r.top) / r.height) * ch - offY()) / scale;
      const hit = STATIONS.find((s) => x >= s.rect.x && x <= s.rect.x + s.rect.w && y >= s.rect.y && y <= s.rect.y + s.rect.h);
      return { x, y, key: hit?.key };
    },
    resize,
    zoom,
    setOverview,
    dispose: () => {},
  };
}
