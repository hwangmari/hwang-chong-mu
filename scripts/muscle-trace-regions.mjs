// 근육 도감 — 주인 3면도에서 "근육 선으로 둘러싸인 칸"을 찾아 근육 모양(SVG path)으로 뽑는다. (2026-09-21)
//
//   1) 그림 속 선을 벽으로 삼아 몸 안의 칸을 모두 나눈다 (선 틈은 DIL 만큼 부풀려 메운다)
//   2) 근육마다 적어 둔 씨앗 점이 들어간 칸들을 모은다 — 씨앗은 손으로 골랐다(아래 SETS 의 seeds)
//      한 칸에 근육 둘이 붙어 있으면 clip(네모·다각형)으로 잘라 나눈다
//   3) 부풀린 만큼 다시 키워 선에 딱 붙게 하고, 경계를 매끈한 path 로 바꾼다
//   4) 손잡이 자리(photoMap.ts 의 cx·cy·rx·ry)를 그 칸의 가운데·크기로 고쳐 쓴다
//   씨앗이 없는 근육(속근육 등)은 photoMap.ts 의 타원을 그대로 쓴다.
//
// 쓰는 법: dev 서버를 3001 로 띄운 뒤 `node scripts/muscle-trace-regions.mjs`
//   Playwright 가 필요하다(프로젝트에는 없어서 스크래치패드 같은 곳에 설치해 돌린다).
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "fs";

// 프로젝트 폴더 — 스크립트를 작업 폴더로 복사해 돌릴 때는 MUSCLE_ROOT 로 알려 준다
const ROOT = process.env.MUSCLE_ROOT ?? new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const MAP_FILE = `${ROOT}/app/muscle/components/photoMap.ts`;
const OUT_FILE = `${ROOT}/app/muscle/components/artPaths.ts`;
const DIL = 4;
const TH = 6;

/* 씨앗 점 — 칸 번호 확인 그림(2배로 잘라 화면 폭에 맞춰 줄인 것) 위의 좌표다. 실제 좌표 = 칸 왼쪽 위 + 점 × seedScale
   { pts, clip: [x0, y0, x1, y1] } 로 적으면 모은 칸을 그 네모(같은 좌표)로 잘라 쓴다 — 한 칸에 근육 둘이 붙어 있을 때 */
const SETS = {
  male: {
    // 주인이 새로 준 남성 3면도(2026-09-22, 설명 글씨만 지운 판) — 칸 번호 그림은 2배로 잘라 높이 2000px 로 줄인 것(0.526)
    image: "/muscle/male3.png",
    seedScale: 0.526,
    views: {
      front: {
        map: "ART_FRONT",
        seeds: {
          trapezius: [[270, 330], [485, 330]],
          "deltoid-anterior": [[185, 420], [580, 415]],
          "deltoid-lateral": [[128, 420], [120, 490], [632, 412], [645, 478]],
          "pectoralis-major": [[290, 460], [465, 460]],
          "serratus-anterior": [[275, 580], [272, 685]],
          "biceps-brachii": [[160, 590], [600, 590]],
          brachioradialis: [[80, 765]],
          "wrist-flexors": [[133, 795]],
          "wrist-extensors": [[680, 810], [630, 800]],
          "rectus-abdominis": [[330, 565], [430, 565], [338, 610], [423, 610], [340, 680], [423, 682], [345, 780], [415, 790]],
          "external-oblique": [[280, 790], [485, 775]],
          // 허벅지 바깥 윗칸의 골반 쪽 끝만 대퇴근막장근
          "tensor-fasciae-latae": { pts: [[225, 962]], clip: [[185, 930], [258, 930], [240, 1010], [185, 1010]] },
          // 가쪽넓은근·넙다리곧은근·안쪽넓은근(무릎 위 안쪽 눈물방울) 칸
          quadriceps: [[240, 1030], [215, 1140], [290, 1200], [205, 1220], [245, 1335], [520, 1050], [545, 1170], [470, 1210], [515, 1325]],
          "hip-adductors": [[342, 1080], [305, 1052], [420, 1060], [455, 1060]],
          gastrocnemius: [[270, 1525], [480, 1510]],
          "tibialis-anterior": [[200, 1650], [555, 1650]],
        },
      },
      back: {
        map: "ART_BACK",
        seeds: {
          trapezius: [[348, 258], [400, 262], [290, 325], [455, 325], [325, 430], [410, 440], [412, 373]],
          "deltoid-posterior": [[165, 435], [575, 435]],
          infraspinatus: [[220, 500], [475, 445]],
          "teres-major": [[520, 497], [215, 560]],
          "latissimus-dorsi": [[285, 590], [445, 595], [290, 785], [465, 790], [505, 635]],
          "erector-spinae": [[345, 700], [400, 700]],
          "triceps-brachii": [[145, 565], [600, 575]],
          "wrist-extensors": [[60, 880], [680, 880]],
          "gluteus-maximus": [[290, 985], [445, 990]],
          hamstrings: [[245, 1180], [280, 1270], [300, 1175], [325, 1100], [490, 1200], [440, 1170], [415, 1100]],
          gastrocnemius: [[240, 1480], [190, 1520], [500, 1450], [540, 1480]],
          soleus: { pts: [[210, 1720], [520, 1700]], clip: [0, 0, 9999, 1860] },
        },
      },
      side: {
        map: "ART_SIDE",
        seeds: {
          trapezius: [[285, 320]],
          sternocleidomastoid: [[238, 265]],
          "deltoid-lateral": [[265, 455]],
          "pectoralis-major": [[130, 510]],
          "biceps-brachii": [[212, 610]],
          // 위팔 뒤 칸이 아래팔까지 이어져 있어 팔꿈치(y 700)에서 나눈다
          "triceps-brachii": { pts: [[300, 580]], clip: [230, 520, 360, 700] },
          "wrist-extensors": { pts: [[225, 760]], clip: [150, 700, 330, 900] },
          "serratus-anterior": [[100, 655], [112, 740]],
          "external-oblique": [[160, 780]],
          "gluteus-maximus": [[300, 1005]],
          quadriceps: [[200, 1170]],
          hamstrings: [[290, 1210]],
          gastrocnemius: [[295, 1540]],
          // 정강이 칸 하나를 앞(전경골근)·뒤 아래(가자미근)로
          "tibialis-anterior": { pts: [[245, 1550]], clip: [180, 1300, 268, 1860] },
          soleus: { pts: [[280, 1740]], clip: [268, 1640, 340, 1860] },
        },
      },
    },
  },
  // 발 — 발바닥 그림에는 근육 선이 없어 area(해부학 자리 다각형 ∩ 발 윤곽)로 칠한다. 좌표는 칸 번호 그림(2배, 줄이지 않음) 기준
  foot: {
    image: "/muscle/foot3.png",
    seedScale: 0.5,
    views: {
      dorsum: {
        map: "FOOT_DORSUM",
        // 다리가 칸 위로 이어져 위 가장자리는 몸 안이다
        openTop: true,
        seeds: {
          "extensor-digitorum-brevis": { area: [[110, 820], [300, 780], [330, 920], [290, 1080], [170, 1160], [90, 1060]] },
          "extensor-digitorum-longus": { area: [[330, 600], [420, 600], [440, 850], [440, 1150], [400, 1420], [100, 1420], [200, 1180], [320, 880]] },
          "extensor-hallucis-longus": { area: [[440, 600], [490, 600], [590, 1100], [640, 1480], [570, 1490], [520, 1100]] },
          "tibialis-anterior": { area: [[500, 300], [560, 300], [600, 650], [650, 950], [600, 980], [540, 650]] },
          "fibularis-brevis": { area: [[190, 480], [240, 480], [200, 750], [150, 1010], [100, 1000], [150, 750]] },
        },
      },
      sole: {
        map: "FOOT_SOLE",
        seeds: {
          // 엄지 발볼 칸 = 짧은엄지굽힘근 (그림 선으로 둘러싸인 칸 그대로)
          "flexor-hallucis-brevis": [[170, 460]],
          "abductor-hallucis": { area: [[30, 1330], [175, 1330], [190, 1100], [200, 880], [215, 700], [205, 600], [40, 600]] },
          "flexor-digitorum-brevis": { area: [[175, 1250], [330, 1250], [400, 1180], [430, 950], [440, 760], [330, 690], [215, 700], [200, 880], [190, 1100]] },
          "abductor-digiti-minimi": { area: [[330, 1250], [540, 1330], [520, 1100], [560, 900], [620, 760], [640, 660], [540, 660], [470, 800], [440, 950], [400, 1180]] },
          "flexor-digiti-minimi-brevis": { area: [[540, 560], [660, 560], [650, 660], [540, 660]] },
          "adductor-hallucis": { area: [[245, 470], [440, 520], [470, 640], [330, 690], [240, 620]] },
          "foot-lumbricals": { area: [[260, 330], [540, 350], [530, 410], [270, 410]] },
        },
      },
    },
  },
  female: {
    image: "/muscle/female3.png",
    seedScale: 0.56,
    views: {
      front: {
        map: "FEMALE_FRONT",
        seeds: {
          trapezius: [[290, 377]],
          sternocleidomastoid: [[323, 336], [391, 327]],
          "deltoid-anterior": [[165, 460], [535, 455]],
          "deltoid-lateral": [[580, 490]],
          // 가슴 위 칸이 양쪽 가슴에 걸친 한 칸이라, 몸 가운데 줄(x 352)에서 이름표 쪽(오른쪽) 반만
          "pectoralis-major": { pts: [[300, 460], [420, 460]], clip: [352, 0, 9999, 9999] },
          "serratus-anterior": [[275, 715]],
          "biceps-brachii": [[150, 620], [550, 620]],
          // 아래팔 칸 하나를 팔꿈치 안쪽(112,720)~손목(80,960) 축으로 나눈다: 바깥 = 완요골근, 안쪽 = 손목 굽힘근
          brachioradialis: { pts: [[85, 820]], clip: [[0, 720], [112, 720], [85, 930], [0, 930]] },
          "wrist-flexors": { pts: [[100, 840]], clip: [[112, 720], [200, 720], [200, 1000], [78, 1000]] },
          "wrist-extensors": [[140, 810], [565, 820]],
          "rectus-abdominis": [[322, 690], [392, 690], [325, 820], [390, 750], [388, 850]],
          "external-oblique": [[270, 820], [440, 815]],
          "tensor-fasciae-latae": [[168, 1043], [538, 1025]],
          quadriceps: [[220, 1000], [190, 1190], [268, 1220], [485, 1040], [515, 1190], [445, 1160], [435, 1255]],
          "hip-adductors": [[292, 1030], [320, 1090], [415, 1045], [385, 1052]],
          gastrocnemius: [[258, 1550], [450, 1550]],
          "tibialis-anterior": [[185, 1600], [520, 1600]],
        },
      },
      back: {
        map: "FEMALE_BACK",
        seeds: {
          trapezius: [[310, 360], [375, 350], [430, 410], [245, 395], [290, 470]],
          "deltoid-posterior": [[180, 470], [525, 470]],
          infraspinatus: [[255, 480], [440, 480]],
          "teres-major": [[228, 545], [470, 540]],
          "latissimus-dorsi": [[300, 690], [440, 700], [410, 685], [435, 760], [255, 790], [435, 828]],
          "erector-spinae": [[318, 755], [385, 755]],
          "triceps-brachii": [[160, 600], [540, 600]],
          "wrist-extensors": [[70, 940], [628, 920]],
          "gluteus-maximus": [[262, 995], [436, 995]],
          hamstrings: [[210, 1220], [255, 1170], [262, 1280], [490, 1210], [440, 1170], [430, 1290]],
          gastrocnemius: [[230, 1460], [185, 1520], [250, 1540], [470, 1450], [440, 1560], [520, 1540]],
          soleus: [[205, 1700], [480, 1720]],
        },
      },
      side: {
        map: "FEMALE_SIDE",
        seeds: {
          trapezius: [[240, 330]],
          "deltoid-lateral": [[240, 480]],
          "pectoralis-major": [[150, 505]],
          "biceps-brachii": [[195, 620]],
          "triceps-brachii": [[255, 610]],
          "serratus-anterior": [[128, 725], [138, 790]],
          "external-oblique": [[85, 830], [135, 845]],
          "wrist-extensors": [[165, 1000]],
          "gluteus-maximus": [[280, 985]],
          quadriceps: [[160, 1270], [220, 1120]],
          hamstrings: [[265, 1240]],
          gastrocnemius: [[270, 1560]],
          "tibialis-anterior": [[215, 1560]],
          soleus: [[255, 1760]],
        },
      },
    },
  },
};

let MAP = readFileSync(MAP_FILE, "utf8");
const boxOf = (name) => {
  const start = MAP.indexOf(`const ${name}`);
  return MAP.slice(start, MAP.indexOf("};", start)).match(/box: "([\d ]+)"/)[1].split(" ").map(Number);
};

/** 다각형 모서리를 세 번 깎아 둥글게 (area 모양이 도형처럼 각지지 않게) */
const chaikin = (poly, rounds = 3) => {
  let p = poly;
  for (let r = 0; r < rounds; r++) {
    const next = [];
    for (let i = 0; i < p.length; i++) {
      const [ax, ay] = p[i], [bx, by] = p[(i + 1) % p.length];
      next.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75]);
    }
    p = next;
  }
  return p;
};

/** 근육 id → 이름표가 서는 쪽 */
const sidesOf = (name) => {
  const start = MAP.indexOf(`const ${name}`);
  const block = MAP.slice(start, MAP.indexOf("};", start));
  return Object.fromEntries([...block.matchAll(/\{ id: "([a-z-]+)", side: "(\w+)"/g)].map((m) => [m[1], m[2]]));
};

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await (await browser.newContext({ viewport: { width: 800, height: 600 } })).newPage();
await page.goto("http://localhost:3001/muscle", { waitUntil: "domcontentloaded" });

const out = {};
for (const [sex, set] of Object.entries(SETS)) {
  const jobs = Object.entries(set.views).map(([view, v]) => {
    const box = boxOf(v.map);
    const k = set.seedScale;
    // 씨앗은 origin(없으면 칸 왼쪽 위) 기준 좌표 — 칸을 넓혀도 씨앗을 다시 적지 않게, 칸 기준으로 옮겨 준다
    const [ox, oy] = v.origin ? [v.origin[0] - box[0], v.origin[1] - box[1]] : [0, 0];
    const seeds = {};
    const clips = {};
    const areas = {};
    for (const [id, entry] of Object.entries(v.seeds)) {
      const { pts = [], clip, area } = Array.isArray(entry) ? { pts: entry } : entry;
      seeds[id] = pts.map(([x, y]) => [Math.round(ox + x * k), Math.round(oy + y * k)]);
      // area: 선으로 나뉜 칸 대신 이 다각형 ∩ 몸(발) 윤곽을 그대로 근육 칸으로 쓴다
      if (area) areas[id] = chaikin(area).map(([x, y]) => [ox + x * k, oy + y * k]);
      // 네모 [x0, y0, x1, y1] 또는 다각형 [[x, y], ...] — 다각형이면 비스듬한 경계(아래팔 축 등)로 자를 수 있다
      if (clip)
        clips[id] = typeof clip[0] === "number"
          ? [ox + clip[0] * k, oy + clip[1] * k, ox + clip[2] * k, oy + clip[3] * k].map(Math.round)
          : clip.map(([x, y]) => [ox + x * k, oy + y * k]);
    }
    return { view, box, seeds, clips, areas, openTop: !!v.openTop, sides: sidesOf(v.map), oneSide: view === "front" || view === "back" };
  });
  out[sex] = await page.evaluate(
    async ({ src, jobs, DIL, TH }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);

      const dilate = (m, w, h, r) => {
        const N = w * h, t = new Uint8Array(N), o = new Uint8Array(N);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = -r; k <= r && !v; k++) { const xx = x + k; if (xx >= 0 && xx < w && m[y * w + xx]) v = 1; } t[y * w + x] = v; }
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let v = 0; for (let k = -r; k <= r && !v; k++) { const yy = y + k; if (yy >= 0 && yy < h && t[yy * w + x]) v = 1; } o[y * w + x] = v; }
        return o;
      };
      // 마칭 스퀘어 — 이진 마스크의 경계를 닫힌 고리들로
      const contours = (mask, w, h) => {
        const at = (x, y) => (x >= 0 && y >= 0 && x < w && y < h ? mask[y * w + x] : 0);
        const segs = new Map();
        const add = (a, b) => {
          const ka = a.join(","), kb = b.join(",");
          if (!segs.has(ka)) segs.set(ka, []);
          if (!segs.has(kb)) segs.set(kb, []);
          segs.get(ka).push(kb);
          segs.get(kb).push(ka);
        };
        const table = { 1: [["L", "B"]], 2: [["B", "R"]], 3: [["L", "R"]], 4: [["T", "R"]], 5: [["L", "T"], ["B", "R"]], 6: [["T", "B"]], 7: [["L", "T"]], 8: [["L", "T"]], 9: [["T", "B"]], 10: [["T", "R"], ["L", "B"]], 11: [["T", "R"]], 12: [["L", "R"]], 13: [["B", "R"]], 14: [["L", "B"]] };
        for (let y = -1; y < h; y++) for (let x = -1; x < w; x++) {
          const code = (at(x, y) << 3) | (at(x + 1, y) << 2) | (at(x + 1, y + 1) << 1) | at(x, y + 1);
          if (code === 0 || code === 15) continue;
          const P = { T: [2 * x + 2, 2 * y + 1], R: [2 * x + 3, 2 * y + 2], B: [2 * x + 2, 2 * y + 3], L: [2 * x + 1, 2 * y + 2] };
          for (const [a, b] of table[code]) add(P[a], P[b]);
        }
        const seen = new Set();
        const loops = [];
        for (const start of segs.keys()) {
          if (seen.has(start)) continue;
          const loop = [];
          let cur = start, prev = null;
          while (cur && !seen.has(cur)) {
            seen.add(cur);
            const [px, py] = cur.split(",").map(Number);
            loop.push([px / 2, py / 2]);
            const next = segs.get(cur).find((n) => n !== prev && !seen.has(n));
            prev = cur;
            cur = next;
          }
          if (loop.length > 6) loops.push(loop);
        }
        return loops;
      };
      const simplify = (pts, eps) => {
        if (pts.length < 4) return pts;
        const keep = new Uint8Array(pts.length);
        keep[0] = keep[pts.length - 1] = 1;
        const stack = [[0, pts.length - 1]];
        while (stack.length) {
          const [a, b] = stack.pop();
          let best = -1, dmax = 0;
          const [ax, ay] = pts[a], [bx, by] = pts[b];
          const len = Math.hypot(bx - ax, by - ay) || 1;
          for (let i = a + 1; i < b; i++) {
            const d = Math.abs((bx - ax) * (ay - pts[i][1]) - (ax - pts[i][0]) * (by - ay)) / len;
            if (d > dmax) { dmax = d; best = i; }
          }
          if (dmax > eps && best > 0) { keep[best] = 1; stack.push([a, best], [best, b]); }
        }
        return pts.filter((_, i) => keep[i]);
      };
      const smoothPath = (pts, ox, oy) => {
        if (pts.length < 3) return "";
        const p = pts.map(([x, y]) => [x + ox, y + oy]);
        const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        const f = (n) => Math.round(n * 10) / 10;
        const m0 = mid(p[p.length - 1], p[0]);
        let d = `M${f(m0[0])} ${f(m0[1])}`;
        for (let i = 0; i < p.length; i++) {
          const m = mid(p[i], p[(i + 1) % p.length]);
          d += `Q${f(p[i][0])} ${f(p[i][1])} ${f(m[0])} ${f(m[1])}`;
        }
        return d + "Z";
      };
      const pointInPoly = (poly, x, y) => {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const [xi, yi] = poly[i], [xj, yj] = poly[j];
          if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        return inside;
      };
      const area = (pts) => {
        let a = 0;
        for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; a += x1 * y2 - x2 * y1; }
        return Math.abs(a / 2);
      };

      const result = {};
      for (const { view, box, seeds, clips, areas, openTop, sides, oneSide } of jobs) {
        const [bx, by, w, h] = box;
        const N = w * h;
        const data = ctx.getImageData(bx, by, w, h).data;
        const gray = new Float32Array(N);
        for (let i = 0; i < N; i++) gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];

        // 선: 둘레보다 뚜렷이 어두운 곳
        const R = 5;
        const S = new Float64Array((w + 1) * (h + 1));
        for (let y = 0; y < h; y++) { let row = 0; for (let x = 0; x < w; x++) { row += gray[y * w + x]; S[(y + 1) * (w + 1) + x + 1] = S[y * (w + 1) + x + 1] + row; } }
        const mean = (x, y) => {
          const x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(w, x + R + 1), y1 = Math.min(h, y + R + 1);
          return (S[y1 * (w + 1) + x1] - S[y0 * (w + 1) + x1] - S[y1 * (w + 1) + x0] + S[y0 * (w + 1) + x0]) / ((x1 - x0) * (y1 - y0));
        };
        const line = new Uint8Array(N);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const g = gray[y * w + x]; line[y * w + x] = g < 130 || g < mean(x, y) - TH ? 1 : 0; }
        const wall = dilate(line, w, h, DIL);

        // 몸 = 테두리에서 선을 건너지 않고 닿지 않는 곳
        const bgWall = dilate(new Uint8Array(N).map((_, i) => (gray[i] < 235 ? 1 : 0)), w, h, 2);
        const bg = new Uint8Array(N);
        const q = [];
        for (let x = 0; x < w; x++) { if (!openTop) q.push(x, 0); q.push(x, h - 1); }
        for (let y = 0; y < h; y++) q.push(0, y, w - 1, y);
        for (let i = 0; i < q.length; i += 2) {
          const x = q[i], y = q[i + 1];
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          const k = y * w + x;
          if (bg[k] || bgWall[k]) continue;
          bg[k] = 1;
          q.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
        }

        // 칸 번호
        const label = new Int32Array(N);
        let next = 1;
        for (let i = 0; i < N; i++) {
          if (bg[i] || wall[i] || label[i]) continue;
          const st = [i];
          label[i] = next;
          while (st.length) {
            const k = st.pop();
            const x = k % w;
            for (const kk of [x < w - 1 ? k + 1 : -1, x > 0 ? k - 1 : -1, k + w, k - w]) {
              if (kk < 0 || kk >= N) continue;
              if (!bg[kk] && !wall[kk] && !label[kk]) { label[kk] = next; st.push(kk); }
            }
          }
          next++;
        }
        // 씨앗 자리의 칸 — 씨앗이 선 위에 떨어졌으면 가장 가까운 칸
        const cellAt = (x, y) => {
          let best = 0, bestD = Infinity;
          for (let dy = -10; dy <= 10; dy++) for (let dx = -10; dx <= 10; dx++) {
            const xx = x + dx, yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
            const id = label[yy * w + xx], dist = dx * dx + dy * dy;
            if (id && dist < bestD) { bestD = dist; best = id; }
          }
          return best;
        };

        // 몸 가운데 줄 — 좌우가 짝인 근육은 이름표 쪽 한 쪽만 칠한다 (양쪽 다 칠하면 보기 어렵다는 주인 의견 2026-09-21)
        let bodyN = 0, bodySx = 0;
        for (let i = 0; i < N; i++) if (!bg[i]) { bodyN++; bodySx += i % w; }
        const midX = bodySx / bodyN;
        const cellX = new Map();
        for (let i = 0; i < N; i++) {
          const c = label[i];
          if (!c) continue;
          const e = cellX.get(c) ?? [0, 0];
          e[0] += i % w; e[1]++;
          cellX.set(c, e);
        }
        const onSide = (c, side) => {
          const [sx, n] = cellX.get(c);
          return side === "left" ? sx / n < midX : sx / n >= midX;
        };

        const regions = {};
        const seams = {};
        const pieces = {};
        const missed = [];
        const flips = [];
        // area 로 적은 근육 — 다각형 ∩ 몸 윤곽이 곧 근육 칸 (발바닥처럼 근육 선이 안 그려진 그림)
        // 몸 윤곽은 배경의 반대를 닫고(8) 구멍을 메운 꽉 찬 모양 — 옅은 선 틈으로 배경이 새어 든 곳을 막는다
        let solid = null;
        if (Object.keys(areas).length) {
          const body = new Uint8Array(N).map((_, i) => (bg[i] ? 0 : 1));
          const inv = dilate(body, w, h, 8).map((v) => 1 - v);
          const closed = dilate(inv, w, h, 8).map((v) => 1 - v);
          const out = new Uint8Array(N);
          const oq = [];
          for (let x = 0; x < w; x++) { if (!openTop) oq.push(x, 0); oq.push(x, h - 1); }
          for (let y = 0; y < h; y++) oq.push(0, y, w - 1, y);
          for (let i = 0; i < oq.length; i += 2) {
            const x = oq[i], y = oq[i + 1];
            if (x < 0 || y < 0 || x >= w || y >= h) continue;
            const k = y * w + x;
            if (out[k] || closed[k]) continue;
            out[k] = 1;
            oq.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
          }
          solid = out.map((v) => 1 - v);
        }
        for (const [id, poly] of Object.entries(areas)) {
          const mask = new Uint8Array(N);
          let n = 0, sx = 0, sy = 0, x0 = w, x1 = 0, y0 = h, y1 = 0;
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            if (!solid[y * w + x] || !pointInPoly(poly, x, y)) continue;
            mask[y * w + x] = 1;
            n++; sx += x; sy += y;
            if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
          if (!n) { missed.push(id); continue; }
          const loops = contours(mask, w, h).filter((l) => area(l) > 30);
          regions[id] = loops.map((l) => smoothPath(simplify(l, 0.9), bx, by)).join("");
          pieces[id] = [{ n, cx: sx / n + bx, cy: sy / n + by, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 }];
        }

        for (const [id, pts] of Object.entries(seeds)) {
          if (areas[id]) continue;
          let found = pts.map(([x, y]) => cellAt(x, y)).filter(Boolean);
          if (found.length < pts.length) missed.push(id);
          if (oneSide && sides[id]) {
            const mine = found.filter((c) => onSide(c, sides[id]));
            // 이름표 쪽에 칸이 없으면 이름표를 칸 쪽으로 옮긴다 (지시선이 몸을 가로지르지 않게)
            if (mine.length) found = mine;
            else flips.push(id);
          }
          const cells = new Set(found);
          let mask = new Uint8Array(N);
          for (let i = 0; i < N; i++) if (cells.has(label[i])) mask[i] = 1;
          // 벽 두께만큼 다시 키운다 — 다른 칸은 넘지 않고, 벽(선 둘레)과 제 칸으로만
          for (let round = 0; round < DIL + 1; round++) {
            const grown = mask.slice();
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
              const k = y * w + x;
              if (mask[k] || bg[k] || (label[k] && !cells.has(label[k]))) continue;
              if ((x > 0 && mask[k - 1]) || (x < w - 1 && mask[k + 1]) || (y > 0 && mask[k - w]) || (y < h - 1 && mask[k + w])) grown[k] = 1;
            }
            mask = grown;
          }
          // 근육 안쪽 결 선 때문에 생긴 틈·구멍을 메운다 (닫기 → 구멍 채우기), 몸 밖으로는 안 나가게
          const CLOSE = 6;
          const inv = dilate(mask, w, h, CLOSE).map((v) => 1 - v);
          const closed = dilate(inv, w, h, CLOSE).map((v, i) => (!v && !bg[i] ? 1 : 0));
          const outside = new Uint8Array(N);
          const oq = [];
          for (let x = 0; x < w; x++) oq.push(x, 0, x, h - 1);
          for (let y = 0; y < h; y++) oq.push(0, y, w - 1, y);
          for (let i = 0; i < oq.length; i += 2) {
            const x = oq[i], y = oq[i + 1];
            if (x < 0 || y < 0 || x >= w || y >= h) continue;
            const k = y * w + x;
            if (outside[k] || closed[k]) continue;
            outside[k] = 1;
            oq.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
          }
          // 메우면서 이웃 근육의 칸을 삼키지 않게 — 다른 칸 번호가 붙은 곳은 뺀다
          for (let i = 0; i < N; i++) mask[i] = !outside[i] && !bg[i] && !(label[i] && !cells.has(label[i])) ? 1 : 0;
          // 한 칸이 여러 근육을 품고 있을 때(정강이 앞·뒤 등) 네모 범위로 잘라 나눈다
          if (clips[id]) {
            const clip = clips[id];
            const keep = typeof clip[0] === "number"
              ? (x, y) => x >= clip[0] && x <= clip[2] && y >= clip[1] && y <= clip[3]
              : (x, y) => pointInPoly(clip, x, y);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!keep(x, y)) mask[y * w + x] = 0;
          }
          // 잘리고 남은 부스러기(가장 큰 조각의 8% 미만)는 버린다
          const all = contours(mask, w, h).map((l) => [l, area(l)]);
          const biggest = Math.max(0, ...all.map(([, a]) => a));
          const loops = all.filter(([, a]) => a > 30 && a >= biggest * 0.08).map(([l]) => l);
          regions[id] = loops.map((l) => smoothPath(simplify(l, 0.9), bx, by)).join("");
          // 갈래(칸) 사이 경계선 — 근육 안에서 칸과 칸이 맞닿는 곳만 가는 선으로 (대퇴사두근 네 갈래, 삼각근 앞·옆 등)
          if (cells.size > 1) {
            const seam = new Uint8Array(N);
            // 칸마다 벽 두께만큼 키워 이웃 칸과 겹치는 곳 = 두 칸 사이
            const grownCells = [...cells].map((c) => dilate(label.map((v) => (v === c ? 1 : 0)), w, h, DIL + 4));
            // 겹치는 곳 중에서도 실제 그림 선(line) 픽셀만 — 띠가 아니라 그려진 선 굵기 그대로
            for (let i = 0; i < N; i++) {
              if (!mask[i] || !line[i]) continue;
              let hits = 0;
              for (const g of grownCells) if (g[i]) hits++;
              if (hits >= 2) seam[i] = 1;
            }
            const seamLoops = contours(seam, w, h).filter((l) => area(l) > 20);
            if (seamLoops.length) seams[id] = seamLoops.map((l) => smoothPath(simplify(l, 1.2), bx, by)).join("");
          }
          // 칸별 가운데·크기 (손잡이 자리를 고칠 때 쓴다 — 키우기 전의 칸 하나하나)
          const stat = new Map([...cells].map((c) => [c, { n: 0, sx: 0, sy: 0, x0: w, x1: 0, y0: h, y1: 0 }]));
          for (let i = 0; i < N; i++) {
            const st = stat.get(label[i]);
            if (!st || !mask[i]) continue;
            const x = i % w, y = (i - x) / w;
            st.n++; st.sx += x; st.sy += y;
            if (x < st.x0) st.x0 = x; if (x > st.x1) st.x1 = x; if (y < st.y0) st.y0 = y; if (y > st.y1) st.y1 = y;
          }
          const list = [...stat.values()].filter((st) => st.n > 0).map((st) => ({
            n: st.n, cx: st.sx / st.n + bx, cy: st.sy / st.n + by, rx: (st.x1 - st.x0) / 2 + DIL, ry: (st.y1 - st.y0) / 2 + DIL,
          }));
          pieces[id] = list;
        }
        result[view] = { box, regions, seams, pieces, missed, flips };
      }
      return result;
    },
    { src: set.image, jobs, DIL, TH },
  );
}
await browser.close();

// 손잡이 자리: 이름표가 서는 쪽(왼/오른)의 큰 칸 가운데로 옮기고, 크기는 그 칸의 반쪽 폭·높이로
for (const set of Object.values(SETS)) {
  for (const [view, v] of Object.entries(set.views)) {
    const res = out[Object.keys(SETS).find((s) => SETS[s] === set)][view];
    const start = MAP.indexOf(`const ${v.map}`);
    const end = MAP.indexOf("};", start);
    let block = MAP.slice(start, end);
    block = block.replace(
      /\{ id: "([a-z-]+)", side: "(\w+)", cx: (\d+), cy: (\d+), rx: (\d+), ry: (\d+)(?:, rot: (-?\d+))? \}/g,
      (whole, id, side0) => {
        const list = res.pieces[id];
        if (!list?.length) return whole;
        const side = res.flips.includes(id) ? (side0 === "left" ? "right" : "left") : side0;
        const biggest = Math.max(...list.map((p) => p.n));
        const big = list.filter((p) => p.n >= biggest * 0.3);
        const best = big.reduce((a, b) => ((side === "left" ? a.cx <= b.cx : a.cx >= b.cx) ? a : b));
        const r = (n) => Math.max(6, Math.round(n));
        return `{ id: "${id}", side: "${side}", cx: ${Math.round(best.cx)}, cy: ${Math.round(best.cy)}, rx: ${r(best.rx)}, ry: ${r(best.ry)} }`;
      },
    );
    MAP = MAP.slice(0, start) + block + MAP.slice(end);
    if (res.missed.length) console.log(view, "씨앗이 칸을 못 찾은 근육:", res.missed.join(", "));
    if (res.flips.length) console.log(view, "이름표 쪽을 바꾼 근육:", res.flips.join(", "));
  }
}
writeFileSync(MAP_FILE, MAP);

const paths = Object.fromEntries(
  Object.entries(out).map(([sex, views]) => [sex, Object.fromEntries(Object.entries(views).map(([view, r]) => [view, { box: r.box, regions: r.regions, seams: r.seams }]))]),
);
const body = JSON.stringify(paths);
writeFileSync(
  OUT_FILE,
  `// 생성된 파일 — 손으로 고치지 말 것. (scripts/muscle-trace-regions.mjs 가 주인 3면도를 읽어 만든다 — dev 서버 3001 이 떠 있어야 한다)
// 그림 속 근육 선으로 둘러싸인 칸을 근육마다 모아 모양(regions)으로 뽑았다. 발은 해부학 자리 다각형을 발 윤곽으로 잘랐다. (2026-09-22)

export type ArtView = {
  /** 이 보기가 차지하는 칸 "x y w h" */
  box: [number, number, number, number];
  /** 근육 id → 그림 속 근육 선을 따라 뽑은 칸 (양쪽 몸이면 조각 여러 개) */
  regions: Record<string, string>;
  /** 근육 id → 갈래(칸) 사이 경계 띠 — 고르거나 손을 올리면 갈래가 나뉘어 보이게 */
  seams: Record<string, string>;
};

/** 묶음(male·female·foot) → 보기(front·back·side / sole·dorsum) → 근육 칸 */
export const ART_PATHS: Record<string, Record<string, ArtView> | undefined> = ${body};
`,
);
console.log("크기(KB):", Math.round(body.length / 1024));
for (const [sex, views] of Object.entries(out)) for (const [k, v] of Object.entries(views)) console.log(sex, k, "근육 칸", Object.keys(v.regions).length);
