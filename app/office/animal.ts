// 황총무 오피스 — 동숲 화면 (three.js).
// 플러스위키 동숲 오피스(scripts/office/animal.html)처럼 같은 배치도를 1칸 = 8 사무실 칸 크기의 입체 디오라마로 세운다.
// 걷기·가까이 있는 것은 OfficeView 가 정하고, 여기서는 그리기·이름표 자리·누른 곳만 맡는다.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Facing, OfficeRenderer, WalkerView } from "./draw";
import {
  DECOR,
  GLASS_X,
  MAP_H,
  MAP_W,
  ROW_Y,
  STATIONS,
  WALL_Y,
  type Rect,
  type Station,
} from "./stations";

const T = 8; // 사무실 칸 8 = 3D 1칸
const COLS = MAP_W / T;
const ROWS = MAP_H / T;
const WALL_Z = WALL_Y / T;
const WALL_H = 3.4;
const YAW: Record<Facing, number> = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 };

type AnimalOptions = {
  /** 전체 보기로 바뀌었는지 알려 준다 (휠·두 손가락으로 바뀔 때도) — 버튼 글자·구역 이름표가 따라간다 */
  onOverview?: (on: boolean) => void;
};

export function createAnimalRenderer(host: HTMLElement, opts: AnimalOptions = {}): OfficeRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = "block";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-10, 10, 6, -6, 0.1, 200);
  const hemi = new THREE.HemisphereLight("#f4f0ff", "#b9a98f", 1.6);
  const sun = new THREE.DirectionalLight("#fff3e0", 2.2);
  sun.position.set(COLS / 2 + 10, 24, ROWS / 2 + 14);
  sun.target.position.set(COLS / 2, 0, ROWS / 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.02;
  Object.assign(sun.shadow.camera, { left: -28, right: 28, top: 24, bottom: -24, near: 1, far: 80 });
  scene.add(hemi, sun, sun.target);

  /* ── 재료·모양 모아 두기 (같은 색·크기는 하나만 만든다) ── */
  const mats = new Map<string, THREE.MeshStandardMaterial>();
  function M(hex: string, extra: THREE.MeshStandardMaterialParameters = {}) {
    const k = hex + JSON.stringify(extra);
    let m = mats.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({ color: hex, roughness: 0.8, metalness: 0, ...extra });
      mats.set(k, m);
    }
    return m;
  }
  const geos = new Map<string, THREE.BufferGeometry>();
  function rbox(w: number, h: number, d: number, r: number) {
    const k = [w, h, d, r].join(",");
    let g = geos.get(k);
    if (!g) {
      g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
      geos.set(k, g);
    }
    return g;
  }
  const ball = new THREE.SphereGeometry(1, 20, 14);
  const cyl = (rt: number, rb: number, h: number, n = 16) => {
    const k = `cyl${rt},${rb},${h},${n}`;
    let g = geos.get(k);
    if (!g) {
      g = new THREE.CylinderGeometry(rt, rb, h, n);
      geos.set(k, g);
    }
    return g;
  };
  function add(geo: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = scene) {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  /** 모서리가 둥근 상자 — (x, y, z) 가운데 */
  function B(w: number, h: number, d: number, hex: string, x: number, y: number, z: number, parent: THREE.Object3D = scene, r = 0.05, extra?: THREE.MeshStandardMaterialParameters) {
    return add(rbox(w, h, d, Math.min(r, w / 3, h / 3, d / 3)), M(hex, extra), x, y, z, parent);
  }
  function S(hex: string, x: number, y: number, z: number, sx: number, sy = sx, sz = sx, parent: THREE.Object3D = scene, extra?: THREE.MeshStandardMaterialParameters) {
    const m = add(ball, M(hex, extra), x, y, z, parent);
    m.scale.set(sx, sy, sz);
    return m;
  }
  const glow = (hex: string, i = 0.5) => ({ emissive: new THREE.Color(hex), emissiveIntensity: i });

  /* ── 바닥 받침 · 구역 바닥 · 벽 ── */
  add(new THREE.BoxGeometry(1, 1, 1), M("#b9dd9c", { roughness: 1 }), COLS / 2, -0.62, ROWS / 2).scale.set(200, 0.1, 200);
  B(COLS + 0.5, 0.5, ROWS - WALL_Z + 0.5, "#a79fcf", COLS / 2, -0.3, (WALL_Z + ROWS) / 2, scene, 0.12);
  function floor(x0: number, z0: number, x1: number, z1: number, hex: string) {
    const m = add(new THREE.BoxGeometry(1, 1, 1), M(hex, { roughness: 0.95 }), (x0 + x1) / 2, -0.05, (z0 + z1) / 2);
    m.scale.set(x1 - x0, 0.1, z1 - z0);
    m.castShadow = false;
  }
  const rowZ = ROW_Y / T;
  const glassX = GLASS_X / T;
  floor(0, WALL_Z, 12, rowZ, "#e7c9a0"); // 돈 관리: 나무
  for (let z = WALL_Z; z < rowZ; z += 0.75) floor(0, z, 12, z + 0.04, "#d6b388");
  floor(12, WALL_Z, glassX, rowZ, "#cdd7f2"); // 일과 시간: 카펫
  floor(glassX, WALL_Z, COLS, rowZ, "#cbe9d8"); // 친구들과 함께: 회의실
  // 몸과 습관: 탕비실 바둑판 타일 + 헬스장 매트
  const tileZ0 = rowZ;
  const tiles = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 0.1, 1), M("#ffffff", { roughness: 0.9 }), Math.ceil(24.5) * Math.ceil(ROWS - tileZ0));
  const tmp = new THREE.Object3D();
  let ti = 0;
  for (let x = 0; x < 24.5; x++)
    for (let z = 0; z < ROWS - tileZ0; z++) {
      tmp.position.set(x + 0.5, -0.05, tileZ0 + z + 0.5);
      tmp.updateMatrix();
      tiles.setMatrixAt(ti, tmp.matrix);
      tiles.setColorAt(ti, new THREE.Color((x + z) % 2 ? "#f4f0e7" : "#e7e0d2"));
      ti++;
    }
  tiles.count = ti;
  tiles.receiveShadow = true;
  tiles.frustumCulled = false;
  scene.add(tiles);
  floor(24.5, rowZ, COLS, ROWS, "#c4e4d2");
  for (let x = 25; x < COLS; x += 2) floor(x, rowZ, x + 0.04, ROWS, "#b3d8c3");

  // 뒷벽 + 왼쪽 벽 + 걸레받이
  B(COLS, WALL_H, 0.3, "#dcd5f2", COLS / 2, WALL_H / 2, WALL_Z - 0.15, scene, 0.03);
  B(0.3, WALL_H, ROWS - WALL_Z, "#dcd5f2", -0.15, WALL_H / 2, (WALL_Z + ROWS) / 2, scene, 0.03);
  B(COLS, 0.14, 0.06, "#ffffff", COLS / 2, 0.07, WALL_Z + 0.03);
  function windowAt(x0: number, x1: number) {
    const w = (x1 - x0) / T;
    const cx = (x0 + x1) / 2 / T;
    B(w + 0.2, 1.5, 0.08, "#ffffff", cx, 2.1, WALL_Z + 0.02);
    add(new THREE.BoxGeometry(w, 1.25, 0.02), M("#bfe3ff", { roughness: 0.15, ...glow("#9fd3ff", 0.25) }), cx, 2.1, WALL_Z + 0.07);
    B(0.05, 1.3, 0.04, "#ffffff", cx, 2.1, WALL_Z + 0.09);
    [-1, 1].forEach((sd) => B(0.28, 1.8, 0.08, "#f7f2ff", cx + sd * (w / 2 + 0.22), 2.05, WALL_Z + 0.1, scene, 0.04));
  }
  windowAt(52, 90);
  windowAt(274, 314);
  // 벽 뒤로 고개를 내민 동글 나무
  [-3, 4, 11, 18, 25, 32, 39, 44].forEach((x, i) => {
    add(cyl(0.2, 0.28, 2.6), M("#9a6b43"), x, 0.7, WALL_Z - 2.4 - (i % 2) * 0.6);
    S(["#7cc46a", "#6ab85c", "#8fd07a"][i % 3], x, 3.4, WALL_Z - 2.4 - (i % 2) * 0.6, 1.3, 1.15, 1.3);
  });

  // 칸막이 (낮은 흰 벽) + 유리 회의실
  function lowWall(x0: number, x1: number) {
    B((x1 - x0) / T, 0.55, 0.22, "#ffffff", (x0 + x1) / 2 / T, 0.275, rowZ);
    B((x1 - x0) / T, 0.08, 0.26, "#f2b84b", (x0 + x1) / 2 / T, 0.58, rowZ);
  }
  lowWall(0, 30);
  lowWall(64, 150);
  lowWall(186, GLASS_X);
  // 유리벽은 허리 높이로 낮고 옅게 — 회의실 안 가구·황총무를 가리지 않게 (2026-10-27 "겹치는 게 많아")
  const glassMat = M("#cfeeff", { transparent: true, opacity: 0.18, roughness: 0.1 });
  function glassWall(x: number, z: number, w: number, d: number) {
    const g = add(new THREE.BoxGeometry(w, 0.95, d), glassMat, x, 0.475, z);
    g.castShadow = false;
    B(w + 0.04, 0.06, d + 0.04, "#9fb3c4", x, 0.97, z);
    B(w + 0.04, 0.06, d + 0.04, "#9fb3c4", x, 0.03, z);
  }
  glassWall(glassX, (WALL_Z + 62 / T) / 2, 0.08, 62 / T - WALL_Z);
  glassWall(glassX, (90 / T + rowZ) / 2, 0.08, rowZ - 90 / T);
  glassWall((GLASS_X + 244) / 2 / T, rowZ, (244 - GLASS_X) / T, 0.08);
  glassWall((276 + MAP_W) / 2 / T, rowZ, (MAP_W - 276) / T, 0.08);

  /* ── 장식 ── */
  function plant(x: number, z: number, s = 1) {
    add(cyl(0.22 * s, 0.17 * s, 0.38 * s), M("#f3c9d6"), x, 0.19 * s, z);
    S("#5fae43", x, 0.62 * s, z, 0.34 * s, 0.3 * s, 0.34 * s);
    S("#7cc46a", x + 0.12 * s, 0.82 * s, z + 0.05, 0.2 * s);
  }
  DECOR.forEach((d) => {
    const x = d.x / T;
    const z = d.y / T;
    if (d.kind === "plant") plant(x + 0.75, z + 1.6);
    if (d.kind === "water") {
      B(0.9, 1.1, 0.8, "#f4f6f8", x + 0.6, 0.55, z + 1.7);
      add(cyl(0.3, 0.3, 0.55), M("#bfe3ff", { transparent: true, opacity: 0.75 }), x + 0.6, 1.4, z + 1.7);
    }
    if (d.kind === "sofa") {
      B(5, 0.45, 1.6, "#e59ab0", x + 2.5, 0.25, z + 1.3, scene, 0.15);
      B(5, 0.8, 0.45, "#d97f97", x + 2.5, 0.6, z + 0.6, scene, 0.15);
      [-1, 1].forEach((sd) => B(0.45, 0.65, 1.6, "#d97f97", x + 2.5 + sd * 2.4, 0.4, z + 1.3, scene, 0.15));
      B(0.8, 0.7, 0.25, "#ffd36b", x + 1.2, 0.75, z + 0.9, scene, 0.12);
    }
  });

  /* ── 서비스 가구 — 키별로 하나씩. r = 바닥 자리(3D 칸) ── */
  type R3 = { x: number; z: number; w: number; d: number; cx: number; cz: number };
  const r3 = (r: Rect): R3 => ({ x: r.x / T, z: r.y / T, w: r.w / T, d: r.h / T, cx: (r.x + r.w / 2) / T, cz: (r.y + r.h / 2) / T });
  // 벽 그림: 사무실 y(4~24) → 벽 높이(3.0 ~ 1.2)
  const wallY = (my: number) => 3.36 - 0.09 * my;
  function onWall(r: Rect, hex: string, g: THREE.Group, frame = "#c9a27a") {
    const w = r.w / T;
    const h = r.h * 0.09;
    const cx = (r.x + r.w / 2) / T;
    const cy = wallY(r.y + r.h / 2);
    B(w + 0.16, h + 0.16, 0.05, frame, cx, cy, WALL_Z + 0.03, g, 0.03);
    B(w, h, 0.08, hex, cx, cy, WALL_Z + 0.06, g, 0.03);
    return { w, h, cx, cy, z: WALL_Z + 0.11 };
  }
  function desk(r: R3, top: string, leg: string, g: THREE.Group, h = 0.75) {
    B(r.w, 0.1, r.d * 0.8, top, r.cx, h, r.cz, g, 0.04);
    [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => B(0.1, h, 0.1, leg, r.cx + sx * (r.w / 2 - 0.15), h / 2, r.cz + sz * (r.d * 0.4 - 0.12), g, 0.02)));
  }
  function chair(x: number, z: number, hex: string, g: THREE.Group, back = 1) {
    B(0.6, 0.12, 0.6, hex, x, 0.45, z, g, 0.05);
    B(0.6, 0.6, 0.12, hex, x, 0.78, z + back * 0.26, g, 0.05);
    add(cyl(0.04, 0.04, 0.4), M("#5b6170"), x, 0.22, z, g);
    add(cyl(0.25, 0.25, 0.04), M("#3b3f52"), x, 0.03, z, g);
  }
  function monitor(x: number, y: number, z: number, screen: string, g: THREE.Group) {
    B(0.9, 0.6, 0.06, "#2b2f38", x, y + 0.42, z, g, 0.03);
    B(0.8, 0.5, 0.02, screen, x, y + 0.42, z + 0.035, g, 0.01, glow(screen, 0.45));
    add(cyl(0.03, 0.03, 0.15), M("#2b2f38"), x, y + 0.08, z, g);
    B(0.3, 0.03, 0.2, "#2b2f38", x, y + 0.01, z, g, 0.01);
  }
  function giftBox(x: number, y: number, z: number, s: number, hex: string, g: THREE.Group) {
    B(s, s, s, hex, x, y + s / 2, z, g, 0.03);
    B(s + 0.01, s + 0.01, s * 0.18, "#ffffff", x, y + s / 2, z, g, 0.01);
    S("#ffffff", x, y + s + 0.04, z, s * 0.2, s * 0.12, s * 0.2, g);
  }

  const BUILD: Record<string, (s: Station, g: THREE.Group) => void> = {
    "account-book": (s, g) => {
      const r = r3(s.rect);
      desk(r, "#c08a5c", "#8a5a2e", g);
      [-1, 1].forEach((sd) => {
        const p = B(0.75, 0.04, 0.95, "#ffffff", r.cx - 0.6 + sd * 0.38, 0.83, r.cz, g, 0.01);
        p.rotation.z = sd * -0.08;
      });
      B(0.5, 0.06, 0.65, "#5b6170", r.cx + 1.15, 0.84, r.cz, g, 0.03);
      B(0.4, 0.02, 0.18, "#a8e0a0", r.cx + 1.15, 0.88, r.cz - 0.18, g, 0.01, glow("#a8e0a0", 0.3));
      for (let i = 0; i < 4; i++) add(cyl(0.12, 0.12, 0.05), M("#f2c14e", { metalness: 0.4, roughness: 0.4 }), r.cx + 0.6, 0.83 + i * 0.055, r.cz - 0.3, g);
      chair(r.cx, r.cz + r.d * 0.55, "#e86a5c", g);
    },
    "gift-log": (s, g) => {
      // 앞이 열린 선반: 뒤판 + 옆판 + 선반 세 칸에 선물 상자
      const r = r3(s.rect);
      const z = r.cz - 0.4;
      B(r.w, 2.2, 0.06, "#ebe5d6", r.cx, 1.1, z - 0.42, g, 0.02);
      [-1, 1].forEach((sd) => B(0.08, 2.2, 0.9, "#f4f1ea", r.cx + sd * (r.w / 2 - 0.04), 1.1, z, g, 0.02));
      B(r.w, 0.08, 0.9, "#f4f1ea", r.cx, 2.18, z, g, 0.02);
      const cols = ["#e86a5c", "#f2b84b", "#7cc46a", "#ff8fb3", "#5aa0e0", "#b07fd9"];
      for (let row = 0; row < 3; row++) {
        const y = 0.06 + row * 0.7;
        B(r.w - 0.16, 0.06, 0.85, "#e2dccd", r.cx, y, z, g, 0.01);
        for (let i = 0; i < 3; i++) giftBox(r.cx - 0.95 + i * 0.95, y + 0.03, z + 0.05, 0.34 + ((i + row) % 2) * 0.08, cols[(row * 3 + i) % cols.length], g);
      }
    },
    schedule: (s, g) => {
      const w = onWall(s.rect, "#ffffff", g);
      B(w.w - 0.2, 0.18, 0.02, "#e86a5c", w.cx, w.cy + w.h / 2 - 0.18, w.z, g, 0.01);
      for (let c = 0; c < 7; c++)
        for (let k = 0; k < 3; k++) {
          const on = (c + k * 3) % 5 === 0;
          B(0.55, 0.32, 0.02, on ? ["#ffe58a", "#ffb3c1", "#c8f0c0"][(c + k) % 3] : "#eef0f5", w.cx - w.w / 2 + 0.45 + c * 0.66, w.cy + 0.3 - k * 0.42, w.z, g, 0.01);
        }
    },
    overtime: (s, g) => {
      const r = r3(s.rect);
      desk(r, "#ffffff", "#c9c4b8", g);
      monitor(r.cx - 0.85, 0.8, r.cz - 0.35, "#7f8fd9", g);
      monitor(r.cx + 0.25, 0.8, r.cz - 0.35, "#7cc4f0", g);
      // 달 스탠드 (야근!)
      add(cyl(0.02, 0.02, 0.6), M("#5b6170"), r.cx + 1.6, 1.1, r.cz - 0.3, g);
      S("#ffd36b", r.cx + 1.6, 1.45, r.cz - 0.3, 0.16, 0.16, 0.16, g, glow("#ffd36b", 0.9));
      B(1.0, 0.04, 0.32, "#eeeae2", r.cx - 0.3, 0.82, r.cz + 0.2, g, 0.01);
      add(cyl(0.08, 0.07, 0.16), M("#ffffff"), r.cx + 0.9, 0.88, r.cz + 0.2, g);
      B(0.5, 0.16, 0.1, "#f2c14e", r.cx - 1.7, 0.88, r.cz + 0.25, g, 0.03);
      chair(r.cx - 0.3, r.cz + r.d * 0.6, "#5aa0e0", g);
    },
    meeting: (s, g) => {
      const w = onWall(s.rect, "#ffffff", g, "#9aa3b5");
      B(w.w - 0.1, 0.3, 0.02, "#5aa0e0", w.cx, w.cy + w.h / 2 - 0.2, w.z, g, 0.01);
      for (let c = 0; c < 5; c++)
        for (let k = 0; k < 3; k++) B(0.22, 0.2, 0.02, "#d5dae3", w.cx - 1.0 + c * 0.5, w.cy + 0.15 - k * 0.32, w.z, g, 0.01);
      const ring = add(new THREE.TorusGeometry(0.2, 0.035, 8, 24), M("#e86a5c"), w.cx, w.cy - 0.17, w.z + 0.02, g);
      ring.castShadow = false;
    },
    place: (s, g) => {
      const w = onWall(s.rect, "#cfe8c8", g);
      B(w.w - 0.1, 0.22, 0.02, "#9fd2f2", w.cx, w.cy - 0.25, w.z, g, 0.01);
      B(0.14, w.h - 0.1, 0.02, "#ffffff", w.cx - 0.6, w.cy, w.z + 0.005, g, 0.01);
      [[-1.3, 0.3, "#e86a5c"], [1.1, -0.1, "#5aa0e0"], [0.2, 0.45, "#f2b84b"]].forEach(([dx, dy, c]) => {
        add(cyl(0.015, 0.015, 0.2), M("#5b6170"), w.cx + (dx as number), w.cy + (dy as number), w.z + 0.1, g).rotation.x = Math.PI / 2;
        S(c as string, w.cx + (dx as number), w.cy + (dy as number), w.z + 0.2, 0.08, 0.08, 0.08, g);
      });
    },
    travel: (s, g) => {
      const r = r3(s.rect);
      B(0.9, 1.3, 0.5, "#4fc1b5", r.cx - 0.5, 0.7, r.cz, g, 0.12);
      B(0.4, 0.25, 0.06, "#3b3f52", r.cx - 0.5, 1.45, r.cz, g, 0.03);
      B(0.95, 0.08, 0.52, "#3e9d93", r.cx - 0.5, 0.95, r.cz, g, 0.02);
      B(0.75, 1.0, 0.45, "#f2b84b", r.cx + 0.55, 0.55, r.cz + 0.1, g, 0.12);
      B(0.36, 0.22, 0.06, "#3b3f52", r.cx + 0.55, 1.15, r.cz + 0.1, g, 0.03);
      B(0.28, 0.2, 0.02, "#ffffff", r.cx + 0.55, 0.65, r.cz + 0.34, g, 0.02);
      [-0.8, -0.2, 0.3, 0.8].forEach((dx) => S("#3b3f52", r.cx + dx, 0.06, r.cz + 0.2, 0.06, 0.06, 0.06, g));
    },
    calc: (s, g) => {
      const r = r3(s.rect);
      B(r.w, 0.14, r.d * 0.85, "#ffffff", r.cx, 0.75, r.cz, g, 0.2);
      add(cyl(0.15, 0.25, 0.72), M("#c9c4b8"), r.cx - r.w / 4, 0.36, r.cz, g);
      add(cyl(0.15, 0.25, 0.72), M("#c9c4b8"), r.cx + r.w / 4, 0.36, r.cz, g);
      const cols = ["#7cc46a", "#ff8fb3", "#5aa0e0", "#f2b84b"];
      for (let i = 0; i < 4; i++) {
        const x = r.x + 0.75 + i * 1.4;
        chair(x, r.z - 0.35, cols[i], g, -1);
        chair(x, r.z + r.d + 0.35, cols[3 - i], g, 1);
      }
      B(1.0, 0.04, 0.7, "#e9eef5", r.cx, 0.84, r.cz, g, 0.02);
      const lid = B(1.0, 0.65, 0.04, "#e9eef5", r.cx, 1.15, r.cz - 0.33, g, 0.02);
      lid.rotation.x = -0.25;
      [[-2, 0.1], [2.1, -0.2]].forEach(([dx, dz]) => {
        const p = B(0.45, 0.02, 0.6, "#ffffff", r.cx + dx, 0.83, r.cz + dz, g, 0.005);
        p.rotation.y = dx * 0.1;
      });
      for (let i = 0; i < 3; i++) add(cyl(0.11, 0.11, 0.05), M("#f2c14e", { metalness: 0.4, roughness: 0.4 }), r.cx - 1.2, 0.84 + i * 0.05, r.cz + 0.35, g);
    },
    game: (s, g) => {
      const r = r3(s.rect);
      B(1.5, 2.2, 1.4, "#b07fd9", r.cx, 1.1, r.cz, g, 0.1);
      B(1.56, 0.35, 1.46, "#ff8fb3", r.cx, 2.1, r.cz, g, 0.08, glow("#ff8fb3", 0.3));
      const sc = B(1.2, 0.8, 0.05, "#2b2f38", r.cx - 0.73, 1.5, r.cz, g, 0.03);
      sc.rotation.y = -Math.PI / 2;
      const scIn = B(1.05, 0.65, 0.02, "#7ef0a0", r.cx - 0.76, 1.5, r.cz, g, 0.01, glow("#7ef0a0", 0.6));
      scIn.rotation.y = -Math.PI / 2;
      B(0.5, 0.12, 1.2, "#7d55b0", r.cx - 0.85, 1.0, r.cz, g, 0.04);
      add(cyl(0.03, 0.03, 0.18), M("#2b2f38"), r.cx - 0.9, 1.15, r.cz - 0.3, g);
      S("#e86a5c", r.cx - 0.9, 1.26, r.cz - 0.3, 0.07, 0.07, 0.07, g);
      [0.05, 0.3].forEach((dz) => add(cyl(0.06, 0.06, 0.04), M(dz > 0.1 ? "#f2b84b" : "#5aa0e0"), r.cx - 0.9, 1.08, r.cz + dz, g));
    },
    tennis: (s, g) => {
      const r = r3(s.rect);
      B(0.12, 1.4, 0.12, "#8a5a2e", r.cx - 0.9, 0.7, r.cz - 0.3, g, 0.03);
      B(0.12, 1.4, 0.12, "#8a5a2e", r.cx + 0.9, 0.7, r.cz - 0.3, g, 0.03);
      B(1.9, 0.1, 0.12, "#8a5a2e", r.cx, 1.35, r.cz - 0.3, g, 0.03);
      ["#e86a5c", "#5aa0e0", "#3b3f52"].forEach((c, i) => {
        const rk = new THREE.Group();
        rk.position.set(r.cx - 0.55 + i * 0.55, 0.9, r.cz - 0.2);
        rk.rotation.x = -0.18;
        g.add(rk);
        add(new THREE.TorusGeometry(0.22, 0.035, 8, 22), M(c), 0, 0.15, 0, rk).scale.set(1, 1.25, 1);
        add(new THREE.CircleGeometry(0.2, 20), M("#f1ede4", { side: THREE.DoubleSide }), 0, 0.15, 0, rk).scale.set(1, 1.25, 1);
        add(cyl(0.03, 0.03, 0.5), M("#3b3f52"), 0, -0.35, 0, rk);
      });
      add(cyl(0.45, 0.38, 0.5), M("#c3c9d1", { metalness: 0.3 }), r.cx, 0.25, r.cz + 0.6, g);
      for (let i = 0; i < 7; i++) S("#d6f04a", r.cx - 0.25 + (i % 4) * 0.17, 0.55 + Math.floor(i / 4) * 0.1, r.cz + 0.5 + (i % 3) * 0.12, 0.1, 0.1, 0.1, g, { roughness: 0.95 });
    },
    habit: (s, g) => {
      const r = r3(s.rect);
      [-1, 1].forEach((sd) => B(0.08, 1.9, 0.08, "#9aa3ad", r.cx + sd * 1.4, 0.95, r.cz, g, 0.02));
      B(3.0, 1.5, 0.08, "#9aa3b5", r.cx, 1.5, r.cz, g, 0.04);
      B(2.85, 1.35, 0.04, "#ffffff", r.cx, 1.5, r.cz + 0.05, g, 0.02);
      for (let row = 0; row < 3; row++)
        for (let c = 0; c < 5; c++) {
          const done = (row * 5 + c) % 4 !== 3;
          B(0.32, 0.28, 0.02, done ? "#7cc46a" : "#e6e9ef", r.cx - 1.1 + c * 0.55, 1.88 - row * 0.4, r.cz + 0.08, g, 0.04);
        }
    },
    daily: (s, g) => {
      const r = r3(s.rect);
      desk(r, "#c08a5c", "#8a5a2e", g);
      [-1, 1].forEach((sd) => {
        const p = B(0.6, 0.04, 0.75, "#fff6c8", r.cx - 0.5 + sd * 0.31, 0.83, r.cz, g, 0.01);
        p.rotation.z = sd * -0.1;
      });
      add(cyl(0.012, 0.012, 0.55), M("#e86a5c"), r.cx + 0.3, 0.85, r.cz + 0.1, g).rotation.z = Math.PI / 2.4;
      add(cyl(0.02, 0.02, 0.55), M("#5b6170"), r.cx + 1.4, 1.08, r.cz - 0.2, g);
      add(new THREE.ConeGeometry(0.2, 0.22, 16, 1, true), M("#ffd36b", { side: THREE.DoubleSide, ...glow("#ffd36b", 0.6) }), r.cx + 1.4, 1.4, r.cz - 0.2, g);
      chair(r.cx, r.cz + r.d * 0.6, "#f2b84b", g);
    },
    diet: (s, g) => {
      const r = r3(s.rect);
      B(r.w, 2.4, 1.3, "#f4f6f8", r.cx, 1.2, r.cz, g, 0.14);
      B(r.w + 0.02, 0.05, 1.32, "#d5d9df", r.cx, 1.45, r.cz, g, 0.01);
      [0.85, 1.9].forEach((y) => B(0.06, 0.5, 0.08, "#9aa3ad", r.cx + 0.75, y, r.cz + 0.68, g, 0.02));
      S("#ff8aa0", r.cx - 0.5, 1.9, r.cz + 0.66, 0.1, 0.1, 0.04, g);
      S("#7cc46a", r.cx - 0.2, 0.9, r.cz + 0.66, 0.1, 0.1, 0.04, g);
      S("#f2b84b", r.cx - 0.55, 0.7, r.cz + 0.66, 0.08, 0.08, 0.04, g);
    },
    inbody: (s, g) => {
      const r = r3(s.rect);
      B(1.6, 0.18, 1.1, "#d5d9df", r.cx, 0.09, r.cz + 0.5, g, 0.06);
      [-1, 1].forEach((sd) => B(0.5, 0.03, 0.75, "#9aa3ad", r.cx + sd * 0.4, 0.19, r.cz + 0.5, g, 0.02));
      B(0.2, 1.6, 0.2, "#c3c9d1", r.cx, 0.9, r.cz - 0.1, g, 0.05);
      B(1.1, 0.7, 0.25, "#eef0f3", r.cx, 1.75, r.cz - 0.05, g, 0.08);
      B(0.85, 0.45, 0.02, "#5aa0e0", r.cx, 1.75, r.cz + 0.09, g, 0.02, glow("#5aa0e0", 0.5));
      [-1, 1].forEach((sd) => B(0.1, 0.4, 0.1, "#5b6170", r.cx + sd * 0.62, 1.55, r.cz, g, 0.03));
    },
    muscle: (s, g) => {
      const r = r3(s.rect);
      [-1, 1].forEach((sd) => B(0.08, 2.2, 0.08, "#9aa3ad", r.cx + sd * 1.1, 1.1, r.cz, g, 0.02));
      B(2.3, 2.0, 0.08, "#9aa3b5", r.cx, 1.35, r.cz, g, 0.04);
      B(2.15, 1.85, 0.04, "#fff8f2", r.cx, 1.35, r.cz + 0.05, g, 0.02);
      const z = r.cz + 0.09;
      S("#f2b9a0", r.cx, 2.0, z, 0.16, 0.16, 0.03, g);
      B(0.55, 0.6, 0.03, "#e86a5c", r.cx, 1.55, z, g, 0.1);
      [-1, 1].forEach((sd) => {
        B(0.14, 0.55, 0.03, "#ec8a7d", r.cx + sd * 0.38, 1.5, z, g, 0.06);
        B(0.18, 0.6, 0.03, "#e86a5c", r.cx + sd * 0.14, 0.95, z, g, 0.08);
      });
    },
    workout: (s, g) => {
      const r = r3(s.rect);
      B(2.0, 0.22, 0.7, "#3b3f52", r.x + 1.1, 0.55, r.cz, g, 0.08);
      [-1, 1].forEach((sd) => B(0.12, 0.45, 0.5, "#2b2f38", r.x + 1.1 + sd * 0.7, 0.22, r.cz, g, 0.03));
      B(2.2, 0.1, 0.9, "#9aa3ad", r.x + 3.8, 0.9, r.cz, g, 0.03);
      B(2.2, 0.1, 0.9, "#9aa3ad", r.x + 3.8, 0.4, r.cz, g, 0.03);
      [-1, 1].forEach((sd) => B(0.1, 1.0, 0.9, "#7d858f", r.x + 3.8 + sd * 1.05, 0.5, r.cz, g, 0.03));
      ["#e86a5c", "#f2b84b", "#5aa0e0"].forEach((c, i) =>
        [0.98, 0.48].forEach((y) => {
          const db = new THREE.Group();
          db.position.set(r.x + 3.1 + i * 0.7, y + 0.1, r.cz);
          g.add(db);
          add(cyl(0.03, 0.03, 0.4), M("#9aa0a6", { metalness: 0.5, roughness: 0.4 }), 0, 0, 0, db).rotation.x = Math.PI / 2;
          [-1, 1].forEach((sd) => add(cyl(0.1, 0.1, 0.09), M(c), 0, 0, sd * 0.2, db).rotation.x = Math.PI / 2);
        }),
      );
    },
    lesson: (s, g) => {
      const r = r3(s.rect);
      B(1.3, 1.0, 1.0, "#5aa0e0", r.x + 0.8, 0.55, r.cz, g, 0.12);
      add(cyl(0.5, 0.35, 0.4), M("#3b3f52"), r.x + 0.8, 1.25, r.cz, g);
      for (let i = 0; i < 6; i++) S("#d6f04a", r.x + 0.55 + (i % 3) * 0.25, 1.48, r.cz - 0.12 + Math.floor(i / 3) * 0.24, 0.12, 0.12, 0.12, g, { roughness: 0.95 });
      add(cyl(0.04, 0.04, 0.4), M("#2b2f38"), r.x + 0.15, 0.65, r.cz, g).rotation.z = Math.PI / 2;
      B(0.08, 1.2, 0.08, "#8a5a2e", r.x + 2.5, 0.6, r.cz, g, 0.02);
      const cb = B(0.7, 0.9, 0.06, "#c9a27a", r.x + 2.5, 1.35, r.cz + 0.05, g, 0.04);
      cb.rotation.x = -0.2;
      const pp = B(0.58, 0.72, 0.02, "#ffffff", r.x + 2.5, 1.33, r.cz + 0.1, g, 0.01);
      pp.rotation.x = -0.2;
    },
    blog: (s, g) => {
      const r = s.rect;
      const w = r.w / T;
      const cx = (r.x + r.w / 2) / T;
      const z = WALL_Z + 0.32;
      B(w, 2.4, 0.06, "#ebe5d6", cx, 1.2, WALL_Z + 0.04, g, 0.02);
      [-1, 1].forEach((sd) => B(0.08, 2.4, 0.6, "#f4f1ea", cx + sd * (w / 2 - 0.04), 1.2, z, g, 0.02));
      B(w, 0.08, 0.6, "#f4f1ea", cx, 2.38, z, g, 0.02);
      let seed = 7;
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      for (let k = 0; k < 3; k++) {
        const sy = 0.12 + k * 0.76;
        B(w - 0.15, 0.05, 0.55, "#e2dccd", cx, sy, z, g, 0.01);
        for (let bx = cx - w / 2 + 0.25; bx < cx + w / 2 - 0.25; bx += 0.17 + rnd() * 0.05) {
          if (rnd() < 0.1) continue;
          const bh = 0.38 + rnd() * 0.2;
          B(0.13, bh, 0.42, ["#e86a5c", "#5aa0e0", "#f2b84b", "#7cc46a", "#b07fd9", "#ff8fb3", "#4fc1b5"][Math.floor(rnd() * 7)], bx, sy + bh / 2 + 0.03, z, g, 0.015);
        }
      }
      // 부엉이
      S("#a1887f", cx + w / 2 - 0.5, 2.62, z, 0.2, 0.22, 0.17, g);
      [-1, 1].forEach((sd) => {
        S("#ffffff", cx + w / 2 - 0.5 + sd * 0.07, 2.7, z + 0.14, 0.055, 0.055, 0.055, g);
        S("#2d1f18", cx + w / 2 - 0.5 + sd * 0.07, 2.7, z + 0.19, 0.028, 0.028, 0.028, g);
      });
    },
    portfolio: (s, g) => {
      const w = onWall(s.rect, "#cfe0ff", g, "#e2b64f");
      S("#3b2a24", w.cx, w.cy + 0.15, w.z, 0.3, 0.3, 0.04, g);
      S("#f6d2b8", w.cx, w.cy + 0.08, w.z + 0.03, 0.22, 0.22, 0.03, g);
      B(0.7, 0.35, 0.03, "#e86a5c", w.cx, w.cy - 0.45, w.z + 0.01, g, 0.12);
    },
  };

  // 가구 묶음마다 재료를 따로 둔다 — 황총무를 가릴 때 그 가구만 반투명하게 만들려고
  const groups: { g: THREE.Group; mats: THREE.MeshStandardMaterial[]; fade: number }[] = [];
  STATIONS.forEach((s) => {
    const g = new THREE.Group();
    g.userData.key = s.key;
    scene.add(g);
    BUILD[s.key]?.(s, g);
    const own: THREE.MeshStandardMaterial[] = [];
    g.traverse((o) => {
      if (o instanceof THREE.Mesh && o.material instanceof THREE.MeshStandardMaterial && !o.material.transparent) {
        o.material = o.material.clone();
        own.push(o.material);
      }
    });
    groups.push({ g, mats: own, fade: 1 });
  });

  /* ── 가까이 있는 가구 표시: 바닥에 노란 동그라미 ── */
  const marker = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.62, 32), new THREE.MeshBasicMaterial({ color: "#ffd36b", transparent: true, opacity: 0.9 }));
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  scene.add(marker);

  /* ── 황총무 캐릭터 — 동글동글 2등신 · 단발 · 산호색 니트 · 노란 명찰 ── */
  const hw = (() => {
    const root = new THREE.Group();
    const body = new THREE.Group();
    const head = new THREE.Group();
    root.add(body);
    scene.add(root);
    const soft = { roughness: 0.85 };
    const limb = (x: number, y: number) => {
      const g = new THREE.Group();
      g.position.set(x, y, 0);
      body.add(g);
      return g;
    };
    const skin = "#f6d2b8";
    const hair = "#3b2a24";
    const legs = [limb(-0.09, 0.28), limb(0.09, 0.28)];
    legs.forEach((g) => {
      add(cyl(0.045, 0.045, 0.2), M(skin, soft), 0, -0.1, 0, g);
      S("#2b2f38", 0, -0.22, 0.035, 0.11, 0.08, 0.15, g, { roughness: 0.5 });
      S("#f4f4f4", 0, -0.27, 0.035, 0.115, 0.025, 0.155, g);
    });
    S("#e86a5c", 0, 0.54, 0, 0.23, 0.23, 0.2, body, soft);
    add(cyl(0.21, 0.2, 0.12), M("#3c4a66", soft), 0, 0.36, 0, body);
    S("#ffd36b", 0.1, 0.6, 0.19, 0.05, 0.065, 0.02, body);
    const arms = [limb(-0.23, 0.66), limb(0.23, 0.66)];
    arms.forEach((g, i) => {
      S("#e86a5c", 0, -0.03, 0, 0.09, 0.09, 0.09, g, soft);
      add(cyl(0.035, 0.035, 0.14), M(skin, soft), (i ? 1 : -1) * 0.015, -0.13, 0, g);
      S(skin, (i ? 1 : -1) * 0.02, -0.22, 0.005, 0.07, 0.066, 0.07, g, soft);
    });
    head.position.set(0, 1.17, 0);
    body.add(head);
    S(skin, 0, 0, 0, 0.5, 0.47, 0.47, head, { roughness: 0.75 });
    [-1, 1].forEach((sd) => S(skin, sd * 0.25, -0.19, 0.21, 0.23, 0.23, 0.23, head, { roughness: 0.75 }));
    // 단발: 둥근 바가지 + 양옆으로 턱선까지 + 일자 앞머리
    S(hair, 0, 0.1, -0.04, 0.54, 0.47, 0.52, head, { roughness: 0.82 });
    [-1, 1].forEach((sd) => S(hair, sd * 0.4, -0.12, -0.04, 0.17, 0.34, 0.38, head, { roughness: 0.82 }));
    S(hair, 0, 0.27, 0.3, 0.42, 0.14, 0.2, head, { roughness: 0.82 });
    const eyes: THREE.Mesh[] = [];
    [-1, 1].forEach((sd) => {
      const ex = sd * 0.19;
      eyes.push(S("#24160f", ex, -0.03, 0.42, 0.1, 0.13, 0.04, head, { roughness: 0.15 }));
      eyes.push(S("#6b4a3a", ex, -0.07, 0.435, 0.075, 0.06, 0.03, head, { roughness: 0.15 }));
      eyes.push(S("#ffffff", ex - 0.035, 0.015, 0.46, 0.038, 0.044, 0.012, head, { roughness: 0.05 }));
      S("#ff8aa0", sd * 0.29, -0.16, 0.43, 0.1, 0.065, 0.02, head, { roughness: 0.9, transparent: true, opacity: 0.75 });
    });
    [-0.03, 0.03].forEach((cx) => S("#6e3a30", cx, -0.2, 0.455, 0.022, 0.011, 0.011, head));
    root.scale.setScalar(0.95);
    return { root, body, head, legs, arms, eyes, yaw: 0, phase: 0, amp: 0 };
  })();

  /* ── 발밑 흙먼지: 미리 만들어 둔 작은 구름 8개를 돌려 쓴다 ── */
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const puffs = Array.from({ length: 8 }, () => {
    const m = new THREE.Mesh(ball, new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, transparent: true, opacity: 0 }));
    m.visible = false;
    scene.add(m);
    return { m, t: 1 };
  });
  let puffAt = 0;
  function puff(x: number, z: number) {
    const p = puffs[puffAt++ % puffs.length];
    const back = hw.yaw; // 뒤꿈치 쪽으로 조금
    p.m.position.set(x - Math.sin(back) * 0.15 + (Math.random() - 0.5) * 0.15, 0.06, z - Math.cos(back) * 0.15);
    p.t = 0;
    p.m.visible = true;
  }
  function stepPuffs(dt: number) {
    puffs.forEach((p) => {
      if (p.t >= 1) return;
      p.t = Math.min(1, p.t + dt * 2.2);
      const s = 0.09 + p.t * 0.17;
      p.m.scale.set(s, s * 0.7, s);
      p.m.position.y += dt * 0.25;
      (p.m.material as THREE.MeshStandardMaterial).opacity = 0.8 * (1 - p.t);
      if (p.t >= 1) p.m.visible = false;
    });
  }

  /* ── 카메라: 오른쪽 앞 위에서 비스듬히 내려다본다 (정사영) ──
   * 기본은 황총무를 따라가는 가까운 화면. 확대·축소는 버튼(－ ＋)·휠·두 손가락, '전체 보기'는 사무실 한 장.
   * 화면을 끌어서 옮기는 기능은 두지 않는다 — 카메라는 늘 황총무 아니면 사무실 전체 (2026-10-27 "확대랑 화면 이동이 복잡해") */
  const center = new THREE.Vector3(COLS / 2 + 1.5, 0, (WALL_Z + ROWS) / 2 + 0.5);
  const OFFSET = new THREE.Vector3(10, 16, 20);
  const TO_CAM = OFFSET.clone().normalize();
  const ZOOMS = [0.7, 0.85, 1, 1.25, 1.55, 1.9];
  let zoomAt = 2;
  let overview = false;
  let half = 7.5;
  let halfGoal = 7.5;
  let snapped = false;
  const look = center.clone();
  function goal() {
    const aspect = (host.clientWidth || 1) / (host.clientHeight || 1);
    // 따라가기: 세로 폰에서도 좌우로 바닥 11칸 넘게 보이게 (예전엔 7칸뿐이라 주변 가구가 안 보였다)
    return overview ? Math.max(14.2, 22.5 / aspect) : Math.max(7.5, 5.6 / aspect) / ZOOMS[zoomAt];
  }
  function applyHalf() {
    const aspect = (host.clientWidth || 1) / (host.clientHeight || 1);
    Object.assign(camera, { left: -half * aspect, right: half * aspect, top: half, bottom: -half });
    camera.updateProjectionMatrix();
  }
  function resize() {
    renderer.setSize(host.clientWidth || 1, host.clientHeight || 1, false);
    halfGoal = goal();
    applyHalf();
  }
  function setOverview(on: boolean) {
    if (overview === on) return;
    overview = on;
    halfGoal = goal();
    opts.onOverview?.(on);
  }
  function zoom(dir: 1 | -1) {
    if (overview) {
      if (dir > 0) setOverview(false); // 전체 보기에서 확대하면 다시 황총무 곁으로
      return;
    }
    if (dir < 0 && zoomAt === 0) return setOverview(true); // 가장 작게 보다가 더 줄이면 전체 보기
    zoomAt = Math.max(0, Math.min(ZOOMS.length - 1, zoomAt + dir));
    halfGoal = goal();
  }
  resize();
  half = halfGoal;
  applyHalf();

  // 휠: 전체 화면(페이지 스크롤이 잠긴 때)이면 그냥, 페이지 안이면 ⌘/Ctrl 과 함께 (트랙패드 오므리기도 Ctrl 휠로 온다)
  let wheelAcc = 0;
  const onWheel = (e: WheelEvent) => {
    const locked = document.documentElement.style.overflow === "hidden";
    if (!locked && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) < 60) return;
    zoom(wheelAcc < 0 ? 1 : -1);
    wheelAcc = 0;
  };
  // 두 손가락 오므리기·벌리기
  const touches = new Map<number, { x: number; y: number }>();
  let pinchStart = 0;
  const dist = () => {
    const [a, b] = [...touches.values()];
    return Math.hypot(a.x - b.x, a.y - b.y);
  };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "touch") return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) pinchStart = dist();
  };
  const onMove = (e: PointerEvent) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size !== 2 || !pinchStart) return;
    const r = dist() / pinchStart;
    if (r > 1.25 || r < 0.8) {
      zoom(r > 1 ? 1 : -1);
      pinchStart = dist();
    }
  };
  const onUp = (e: PointerEvent) => {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinchStart = 0;
  };
  const el = renderer.domElement;
  el.style.touchAction = "pan-x pan-y"; // 한 손가락은 페이지 스크롤, 두 손가락은 우리가 확대
  el.addEventListener("wheel", onWheel, { passive: false });
  el.addEventListener("pointerdown", onDown);
  el.addEventListener("pointermove", onMove);
  el.addEventListener("pointerup", onUp);
  el.addEventListener("pointercancel", onUp);

  // 황총무를 가리는 가구는 반투명하게: 카메라 쪽에서 황총무(머리·허리)로 선을 그어 걸리는 가구를 찾는다
  const occRay = new THREE.Raycaster();
  const occFrom = new THREE.Vector3();
  const occDir = TO_CAM.clone().negate();
  function fadeOccluders(x: number, z: number) {
    const hitKeys = new Set<THREE.Group>();
    [1.25, 0.6].forEach((h) => {
      const target = new THREE.Vector3(x, h, z);
      occFrom.copy(target).addScaledVector(TO_CAM, 60);
      occRay.set(occFrom, occDir);
      occRay.far = 59.7;
      occRay.intersectObjects(groups.map((q) => q.g), true).forEach((hit) => {
        for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) if (o.userData.key) hitKeys.add(o as THREE.Group);
      });
    });
    groups.forEach((q) => {
      const want = hitKeys.has(q.g) ? 0.28 : 1;
      if (Math.abs(q.fade - want) < 0.01) return;
      q.fade += (want - q.fade) * 0.25;
      if (Math.abs(q.fade - want) < 0.01) q.fade = want;
      const see = q.fade < 0.99;
      q.mats.forEach((m) => {
        if (m.transparent !== see) {
          m.transparent = see;
          m.needsUpdate = true;
        }
        m.opacity = q.fade;
        m.depthWrite = !see;
      });
    });
  }

  let last = performance.now();
  let lastX = -1;
  let lastY = -1;
  function draw(v: WalkerView) {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const moving = Math.abs(v.x - lastX) + Math.abs(v.y - lastY) > 0.01;
    lastX = v.x;
    lastY = v.y;

    hw.root.position.set(v.x / T, 0, v.y / T);
    const dy = ((YAW[v.facing] - hw.yaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
    hw.yaw += dy * 0.3;
    hw.root.rotation.y = hw.yaw;
    // 걷기 세기(amp)를 서서히 올리고 내려서 멈출 때 '톡' 하고 자리 잡게
    hw.amp += ((moving ? 1 : 0) - hw.amp) * Math.min(1, dt * 12);
    const prevPhase = hw.phase;
    hw.phase += moving ? dt * 13 : 0;
    const a = hw.amp;
    const sw = Math.sin(hw.phase) * a;
    const hop = Math.abs(Math.sin(hw.phase)) * a; // 한 걸음마다 통
    hw.legs[0].rotation.x = sw * 0.85;
    hw.legs[1].rotation.x = -sw * 0.85;
    hw.arms[0].rotation.x = -sw * 0.9;
    hw.arms[1].rotation.x = sw * 0.9;
    hw.arms[0].rotation.z = -0.25 * a; // 팔을 살짝 벌리고 콩콩
    hw.arms[1].rotation.z = 0.25 * a;
    hw.body.position.y = hop * 0.1;
    if (!calm) {
      hw.body.rotation.z = sw * 0.1; // 뒤뚱뒤뚱
      hw.body.rotation.x = 0.12 * a; // 앞으로 살짝 기울여 종종걸음
      hw.head.rotation.z = -sw * 0.08; // 머리는 반대로 까딱
      // 땅에 닿을 때 말랑하게 눌렸다가 뜰 때 늘어난다
      const squish = (1 - hop / Math.max(a, 0.001)) * a;
      hw.body.scale.set(1 + squish * 0.05, 1 - squish * 0.06 + hop * 0.03, 1 + squish * 0.05);
      // 발이 닿는 순간(위상이 π 를 넘을 때마다) 흙먼지
      if (moving && Math.floor(hw.phase / Math.PI) !== Math.floor(prevPhase / Math.PI)) puff(v.x / T, v.y / T);
    }
    stepPuffs(dt);
    // 가끔 눈 깜빡
    const blink = Math.floor(now / 100) % 38 === 0 ? 0.15 : 1;
    hw.eyes.forEach((e) => (e.scale.y = (e.userData.sy ??= e.scale.y) * blink));

    if (v.near) {
      marker.visible = true;
      marker.position.set(v.near.spot.x / T, 0.02, v.near.spot.y / T);
    } else marker.visible = false;

    const me = new THREE.Vector3(v.x / T, 0, v.y / T);
    if (!snapped) {
      look.copy(me); // 처음엔 바로 황총무에게
      snapped = true;
    }
    look.lerp(overview ? center : me, Math.min(1, dt * 8));
    if (Math.abs(half - halfGoal) > 0.001) {
      half += (halfGoal - half) * Math.min(1, dt * 10); // 확대·축소는 부드럽게
      applyHalf();
    }
    fadeOccluders(me.x, me.z);
    camera.position.copy(look).add(OFFSET);
    camera.lookAt(look);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
  }

  const ray = new THREE.Raycaster();
  const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();
  function pick(cx: number, cy: number) {
    const r = renderer.domElement.getBoundingClientRect();
    ray.setFromCamera(new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1), camera);
    const first = ray
      .intersectObjects(scene.children, true)
      .find((h) => !(h.object instanceof THREE.Mesh && (h.object.material as THREE.Material).transparent && h.object !== marker));
    let key: string | undefined;
    for (let o: THREE.Object3D | null = first?.object ?? null; o; o = o.parent) if (o.userData.key) key = o.userData.key;
    const p = first?.point ?? (ray.ray.intersectPlane(floorPlane, hit) ? hit : null);
    if (!p) return null;
    return { x: p.x * T, y: Math.max(WALL_Y + 6, p.z * T), key };
  }

  function project(x: number, y: number, h: number) {
    const v = new THREE.Vector3(x / T, h, y / T).project(camera);
    if (v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05) return null;
    return { left: (v.x + 1) * 50, top: (1 - v.y) * 50 };
  }

  return {
    draw,
    project,
    pick,
    resize,
    zoom,
    setOverview,
    dispose: () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      groups.forEach((q) => q.mats.forEach((m) => m.dispose()));
      geos.forEach((g) => g.dispose());
      mats.forEach((m) => m.dispose());
      puffs.forEach((p) => (p.m.material as THREE.Material).dispose());
      ball.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

/** 이름표 높이 — 벽에 건 것은 벽 높이, 바닥 가구는 가구 위 (3D 칸) */
export function labelHeight(s: Station) {
  if (s.onWall) return 3.36 - 0.09 * s.rect.y + 0.2;
  const tall: Record<string, number> = { "gift-log": 2.4, game: 2.5, diet: 2.6, habit: 2.4, muscle: 2.5, inbody: 2.3, travel: 1.7, tennis: 1.6, lesson: 1.9 };
  return tall[s.key] ?? 1.4;
}
