// 근육 도감 — 주인 3면도(남 public/muscle/male3.png, 여 public/muscle/female3.png)를 앞/뒤/옆으로 잘라
// potrace 로 SVG 선화를 만든다. 확대해도 깨지지 않게 하려고 (주인 요청 2026-09-21).
// 결과: {male,female}-{front,back,side}.svg — public/muscle/ 로 복사한다
// 쓰는 법: potrace·jimp 를 프로젝트가 아닌 작업 폴더에 설치하고(npm i potrace jimp@0.22),
//   두 그림을 그 폴더에 두고 `node muscle-vectorize.cjs`
//   BOXES 는 photoMap.ts 의 box 와 같아야 한다
/* eslint-disable @typescript-eslint/no-require-imports -- 프로젝트 밖(작업 폴더)에서 node 로 바로 돌리는 CommonJS 스크립트 */
const Jimp = require("jimp");
const potrace = require("potrace");
const fs = require("fs");
const SETS = {
  // 남성은 주인이 새로 준 3면도에서 설명 글씨·눈금선만 지운 판(male3.png = scripts/muscle-male-clean.cjs 의 결과, 속옷 없음 — 주인 요청 2026-09-22).
  // 칸은 손끝·코끝·발끝까지 들어가게 잰 값 (2026-09-22)
  male: { src: "male3.png", boxes: { front: [80, 90, 402, 1052], back: [518, 90, 390, 1052], side: [1012, 90, 212, 1052] } },
  // 여성 그림은 설명 글씨·지시선을 지운 판(female3.png)을 쓴다
  // 발: 주인이 준 발 5면도(foot3.png, 2662x1224) 중 정면(위에서 본 모습) = 발등, 바닥면 = 발바닥. 남녀 같이 쓴다 (2026-09-22)
  foot: { src: "foot3.png", boxes: { dorsum: [30, 190, 370, 925], sole: [2315, 190, 340, 925] } },
  female: { src: "female3.png", boxes: { front: [226, 110, 395, 1120], back: [708, 110, 394, 1120], side: [1228, 110, 224, 1120] } },
};
const SCALE = 2; // 작은 선까지 살리려고 2배로 키워서 따라 그린 뒤 줄인다

(async () => {
  const out = {};
  for (const [sex, { src: file0, boxes }] of Object.entries(SETS)) {
  const src = await Jimp.read(file0);
  for (const [view, [x, y, w, h]] of Object.entries(boxes)) {
    const name = `${sex}-${view}`;
    const crop = src.clone().crop(x, y, w, h).greyscale().resize(w * SCALE, h * SCALE, Jimp.RESIZE_BICUBIC);
    const file = `crop-${name}.png`;
    await crop.writeAsync(file);
    const svg = await new Promise((res, rej) =>
      potrace.posterize(file, {
        steps: [110, 160, 200, 224],   // 짙은 선 / 중간 명암 / 옅은 명암 / 아주 옅은 근육선
        fillStrategy: potrace.Potrace.FILL_MEAN,
        rangeDistribution: potrace.Potrace.RANGES_EQUAL,
        turdSize: 6,
        optTolerance: 0.5,
        background: "transparent",
      }, (err, s) => (err ? rej(err) : res(s))),
    );
    fs.writeFileSync(`${name}.svg`, svg);
    out[name] = svg.length;
  }
  }
  console.log("SVG 크기(KB):", Object.fromEntries(Object.entries(out).map(([k, v]) => [k, Math.round(v / 1024)])));
})();
