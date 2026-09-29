// 근육 도감 — 주인이 준 남성 3면도(male-source.png, 1312x1199)에서 위 제목·왼쪽 부위 글씨·눈금선을 지워 male-clean.png 를 만든다. (2026-09-22)
// 결과를 male3.png 로 public/muscle/ 에 두고 → muscle-vectorize.cjs (선화) → muscle-trace-regions.mjs (근육 칸)
/* eslint-disable @typescript-eslint/no-require-imports -- 프로젝트 밖(작업 폴더)에서 node 로 바로 돌리는 CommonJS 스크립트 */
const Jimp = require("jimp");
(async () => {
  const im = await Jimp.read("male-source.png");
  const W = im.bitmap.width, H = im.bitmap.height, d = im.bitmap.data;
  const orig = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) orig[i] = (d[i * 4] + d[i * 4 + 1] + d[i * 4 + 2]) / 3;
  const set = (x, y, v) => { const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = v; };
  const BG = 251;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (y < 88 || x < 80) set(x, y, BG);
  let erased = 0;
  for (let y = 4; y < H - 4; y++) {
    let x = 80, lineRow = false;
    const dark = (xx, yy) => orig[yy * W + xx] < 246;
    while (x < 320) {
      if (!dark(x, y)) { x++; continue; }
      let e = x;
      while (e < 320 && dark(e, y) && !dark(e, y - 4) && !dark(e, y + 4)) e++;
      if ((x < 90 && e - x >= 6) || (lineRow && e - x >= 3)) {
        lineRow = true;
        for (let xx = x; xx < e; xx++) for (let yy = y - 2; yy <= y + 2; yy++) set(xx, yy, BG);
        erased++;
      }
      x = e + 1;
    }
  }
  // 팔·손을 가로지르는 눈금선: 눈금 줄(그림 왼쪽 x 80~87 에서 가는 선이 있는 줄)을 찾아,
  // 그 줄에서 위아래 3px 평균보다 어두운 점만 평균으로 메운다 — 팔 윤곽처럼 굵은 선은 위아래도 어두워 그대로 남는다
  const tickRows = [];
  for (let y = 90; y < H - 4; y++) {
    let c = 0;
    // 눈금은 글씨(x 25~60) 오른쪽, 세로 기준선(x 72) 왼쪽 x 62~70 을 반드시 지난다
    for (let x = 62; x < 71; x++) if (orig[y * W + x] < 246 && orig[(y - 4) * W + x] > 247 && orig[(y + 4) * W + x] > 247) c++;
    if (c >= 7) tickRows.push(y);
  }
  for (const y of tickRows) for (let yy = y - 1; yy <= y + 1; yy++) for (let x = 80; x < 330; x++) {
    const avg = (orig[(yy - 3) * W + x] + orig[(yy + 3) * W + x]) / 2;
    if (orig[yy * W + x] < avg - 2 && Math.abs(orig[(yy - 3) * W + x] - orig[(yy + 3) * W + x]) < 25) set(x, yy, Math.round(avg));
  }
  console.log("지운 눈금선", erased, "눈금 줄", tickRows.join(","));
  await im.writeAsync("male-clean.png");
})();
