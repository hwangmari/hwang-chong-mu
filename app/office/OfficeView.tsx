"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  blockedAt,
  createPixelRenderer,
  type Facing,
  type OfficeRenderer,
} from "./draw";
import { MAP_H, MAP_W, START, STATIONS, WALL_Y, ZONES, type Station } from "./stations";
import {
  StBar,
  StBarButton,
  StControls,
  StRoot,
  StHot,
  StModeTab,
  StModeTabs,
  StNameTag,
  StOpen,
  StPanel,
  StPanelIcon,
  StPanelText,
  StStage,
  StToggle,
  StZoneTag,
  StZoomBar,
  StGoing,
  StPad,
} from "./page.styles";

export type OfficeMode = "pixel" | "animal";
type Mode = OfficeMode;
const MODE_KEY = "office.mode";
// 사무실 칸 / 1/60초 — 1.7 은 너무 빨라 가구 앞에 서기 어려웠다 (2026-10-27). 동숲 화면 기준 1초에 바닥 약 7칸
const SPEED = 0.95;
// 방향키를 누르기 시작하면 이만큼(1/60초 수) 걸려 서서히 최고 속도 — 톡 누르면 반 걸음만 가서 자리 맞추기 쉽게
const RAMP = 14;
const CELL = 2; // 길찾기 칸 크기

/* ── 길찾기: 2칸 격자에서 넓이 우선 탐색 (8방향, 모서리 끼기 금지) ── */
const GW = Math.floor(MAP_W / CELL);
const GH = Math.floor(MAP_H / CELL);
let FREE: Uint8Array | null = null;
function freeGrid() {
  if (FREE) return FREE;
  FREE = new Uint8Array(GW * GH);
  for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) FREE[j * GW + i] = blockedAt(i * CELL, j * CELL) ? 0 : 1;
  return FREE;
}
function nearestFree(i: number, j: number) {
  const free = freeGrid();
  for (let r = 0; r < 30; r++)
    for (let dj = -r; dj <= r; dj++)
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const a = i + di;
        const b = j + dj;
        if (a >= 0 && b >= 0 && a < GW && b < GH && free[b * GW + a]) return [a, b];
      }
  return null;
}
function findPath(fx: number, fy: number, tx: number, ty: number) {
  const free = freeGrid();
  const s = nearestFree(Math.round(fx / CELL), Math.round(fy / CELL));
  const t = nearestFree(Math.round(tx / CELL), Math.round(ty / CELL));
  if (!s || !t) return [];
  const prev = new Int32Array(GW * GH).fill(-1);
  const start = s[1] * GW + s[0];
  const goal = t[1] * GW + t[0];
  prev[start] = start;
  const q = [start];
  for (let h = 0; h < q.length && prev[goal] < 0; h++) {
    const c = q[h];
    const ci = c % GW;
    const cj = (c - ci) / GW;
    for (let dj = -1; dj <= 1; dj++)
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const a = ci + di;
        const b = cj + dj;
        if (a < 0 || b < 0 || a >= GW || b >= GH) continue;
        const n = b * GW + a;
        if (!free[n] || prev[n] >= 0) continue;
        if (di && dj && (!free[cj * GW + a] || !free[b * GW + ci])) continue;
        prev[n] = c;
        q.push(n);
      }
  }
  if (prev[goal] < 0) return [];
  const path: { x: number; y: number }[] = [];
  for (let c = goal; c !== start; c = prev[c]) path.push({ x: (c % GW) * CELL, y: Math.floor(c / GW) * CELL });
  return path.reverse();
}

/** 지금 발 위치에서 가장 가까운 가구 (벽 그림은 그 앞 자리까지, 바닥 가구는 가구 둘레까지 거리) */
function nearestStation(x: number, y: number) {
  let best: Station | null = null;
  let bd = 11;
  STATIONS.forEach((s) => {
    let d: number;
    if (s.onWall) d = Math.hypot(s.spot.x - x, s.spot.y - y) * 0.8;
    else {
      const dx = Math.max(s.rect.x - x, 0, x - (s.rect.x + s.rect.w));
      const dy = Math.max(s.rect.y - y, 0, y - 3 - (s.rect.y + s.rect.h));
      d = Math.hypot(dx, dy);
    }
    if (d < bd) {
      bd = d;
      best = s;
    }
  });
  return best as Station | null;
}

/** "가계부로" · "운동 기록으로" — 마지막 글자에 받침이 있으면(ㄹ 받침 빼고) 으로 */
function toward(name: string) {
  const c = name.charCodeAt(name.length - 1) - 0xac00;
  if (c < 0 || c > 11171) return "로";
  const jong = c % 28;
  return jong === 0 || jong === 8 ? "로" : "으로";
}

/** 픽셀은 넓은 화면의 페이지 안에서만 사무실 전체로 시작 — 폰은 너무 작아져서 처음부터 황총무 곁 */
function startOverview(full: boolean) {
  return !full && window.innerWidth >= 768;
}

const KEY_DIR: Record<string, [number, number]> = {
  ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
  w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0], W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
};

type Props = {
  /** 전체 화면 모드 — 헤더·푸터·소개 없이 사무실만 화면 가득 */
  full: boolean;
  onFullChange: (full: boolean) => void;
  /** 바깥(내 서비스 요약)이 모드를 정할 때 — 없으면 이 화면이 스스로 기억한다 */
  mode?: OfficeMode;
  onModeChange?: (mode: OfficeMode) => void;
  /** 도구를 열 때 주소 뒤에 붙일 것 — 내 서비스 요약에서 열면 "?from=my" (뒤로 가기가 다시 오피스로) */
  hrefSuffix?: string;
};

export default function OfficeView({ full, onFullChange, mode: modeProp, onModeChange, hrefSuffix = "" }: Props) {
  const router = useRouter();
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const tagRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const hotRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const zoneRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const rendererRef = useRef<OfficeRenderer | null>(null);
  const fullRef = useRef(full);
  // 동숲 화면: 사무실 전체 보기 중인지 (구역 이름표는 전체 보기에서만 — 가까이 볼 땐 가구 이름표와 겹친다)
  const [overview, setOverview] = useState(false);
  const overviewRef = useRef(false);

  const [innerMode, setInnerMode] = useState<Mode>("pixel");
  const [webglFailed, setWebglFailed] = useState(false);
  // 3D 를 못 그리는 브라우저면 동숲을 골라도 픽셀로 보여 준다
  const mode: Mode = webglFailed ? "pixel" : (modeProp ?? innerMode);
  const [ready, setReady] = useState(false);
  const [near, setNear] = useState<Station | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  // 도구로 가는 중 — 다음 화면이 뜰 때까지 1~3초 비어 보여서 여러 번 누르게 됐다 (2026-10-27)
  const [going, setGoing] = useState<Station | null>(null);
  const goingRef = useRef(false);
  const [allTags, setAllTags] = useState(false);
  const [focused, setFocused] = useState(false);
  // 손가락으로 쓰는 기기(폰·태블릿): 방향 패드를 보여 주고 안내 문구를 바꾼다
  const [touch, setTouch] = useState(false);
  // 전체 화면 조작 안내 줄은 들어간 뒤 4초만 — 늘 떠 있으면 사무실을 가린다 (2026-10-27)
  const [hintOn, setHintOn] = useState(true);
  useEffect(() => {
    if (!full) return;
    setHintOn(true);
    const id = setTimeout(() => setHintOn(false), 4000);
    return () => clearTimeout(id);
  }, [full]);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const read = () => setTouch(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  // 걷는 상태는 매 장면 바뀌어서 React 상태가 아니라 ref 에 둔다
  const walker = useRef({
    x: START.x, y: START.y, facing: "up" as Facing, dist: 0,
    path: [] as { x: number; y: number }[], goal: null as Station | null,
    keys: new Set<string>(), near: null as Station | null, held: 0,
  });

  // 지난번에 고른 화면 기억 (없거나 못 읽으면 픽셀)
  useEffect(() => {
    if (modeProp) return;
    try {
      if (localStorage.getItem(MODE_KEY) === "animal") setInnerMode("animal");
    } catch {}
  }, [modeProp]);
  const chooseMode = (m: Mode) => {
    if (onModeChange) return onModeChange(m);
    setInnerMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {}
  };

  // 화면(픽셀/동숲) 만들기 + 매 장면 걷기
  useEffect(() => {
    let r: OfficeRenderer | null = null;
    let raf = 0;
    let alive = true;
    setReady(false);
    overviewRef.current = false;
    setOverview(false);

    const start = (renderer: OfficeRenderer) => {
      if (!alive) return renderer.dispose();
      r = renderer;
      rendererRef.current = renderer;
      setReady(true);
      let last = performance.now();
      const tick = (now: number) => {
        // 화면 주사율(60·120Hz)이 달라도 같은 빠르기로 걷게 1/60초 기준 배수
        speed = SPEED * Math.min(3, (now - last) / (1000 / 60));
        last = now;
        step();
        renderer.draw({ x: w.x, y: w.y, facing: w.facing, step: Math.floor(w.dist / 5) % 4, near: w.near });
        placeTags(renderer);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const w = walker.current;
    let speed = SPEED;
    let heightOf: ((s: Station) => number) | null = null;
    const onOverview = (on: boolean) => {
      overviewRef.current = on;
      setOverview(on);
    };
    // 픽셀: 페이지 안에선 사무실 전체(+둘레 풍경), 전체 화면에선 황총무를 따라간다
    if (mode === "pixel" && canvasRef.current && stageRef.current)
      start(createPixelRenderer(canvasRef.current, stageRef.current, { overview: startOverview(fullRef.current), onOverview }));
    if (mode === "animal" && hostRef.current) {
      const host = hostRef.current;
      import("./animal")
        .then(({ createAnimalRenderer, labelHeight }) => {
          heightOf = labelHeight;
          start(createAnimalRenderer(host, { onOverview }));
        })
        .catch(() => {
          if (!alive) return;
          setWebglFailed(true);
        });
    }
    function placeTags(renderer: OfficeRenderer) {
      STATIONS.forEach((s) => {
        const el = tagRefs.current[s.key];
        const hot = hotRefs.current[s.key];
        const cx = s.rect.x + s.rect.w / 2;
        const p =
          mode === "pixel"
            ? renderer.project(cx, s.rect.y - 1.5, 0)
            : renderer.project(cx, s.onWall ? WALL_Y : s.rect.y + s.rect.h / 2, heightOf ? heightOf(s) : 1.4);
        if (el) {
          el.style.visibility = p ? "visible" : "hidden";
          if (p) {
            el.style.left = `${p.left}%`;
            el.style.top = `${p.top}%`;
          }
        }
        // 픽셀은 가구 자리(카메라를 거친 화면 위치)에 누르는 곳을 얹는다 (동숲은 3D 에서 직접 고른다)
        if (hot && mode === "pixel") {
          const a = renderer.project(s.rect.x, s.rect.y, 0);
          const b = renderer.project(s.rect.x + s.rect.w, s.rect.y + s.rect.h, 0);
          if (a && b)
            Object.assign(hot.style, { left: `${a.left}%`, top: `${a.top}%`, width: `${b.left - a.left}%`, height: `${b.top - a.top}%` });
        }
      });
      ZONES.forEach((z) => {
        const el = zoneRefs.current[z.id];
        const p =
          mode === "pixel" ? renderer.project(z.x, z.y, 0) : overviewRef.current ? renderer.project(z.x + 4, z.y + 4, 0.05) : null;
        if (el) {
          el.style.visibility = p ? "visible" : "hidden";
          if (p) {
            el.style.left = `${p.left}%`;
            el.style.top = `${p.top}%`;
          }
        }
      });
    }

    function step() {
      let dx = 0;
      let dy = 0;
      w.keys.forEach((k) => {
        const d = KEY_DIR[k];
        if (d) {
          dx += d[0];
          dy += d[1];
        }
      });
      if (!dx && !dy) w.held = 0; // 손을 떼면 다음 누름은 다시 천천히부터
      if (dx || dy) {
        w.path = [];
        w.goal = null;
        w.held = Math.min(RAMP, w.held + speed / SPEED);
        const ease = 0.3 + 0.7 * (w.held / RAMP);
        const len = Math.hypot(dx, dy);
        move((dx / len) * speed * ease, (dy / len) * speed * ease);
      } else if (w.path.length) {
        const t = w.path[0];
        const ddx = t.x - w.x;
        const ddy = t.y - w.y;
        const d = Math.hypot(ddx, ddy);
        if (d <= speed) {
          w.x = t.x;
          w.y = t.y;
          w.dist += d;
          w.path.shift();
          if (!w.path.length && w.goal) {
            // 도착하면 가구 쪽을 본다
            w.facing = w.goal.onWall || w.goal.rect.y + w.goal.rect.h <= w.y ? "up" : w.goal.rect.x > w.x ? "right" : "left";
            w.goal = null;
          }
        } else move((ddx / d) * speed, (ddy / d) * speed, true);
      }
      const n = nearestStation(w.x, w.y);
      if (n !== w.near) {
        w.near = n;
        setNear(n);
      }
    }

    function move(mx: number, my: number, onPath = false) {
      if (Math.abs(mx) > Math.abs(my) * 1.1) w.facing = mx > 0 ? "right" : "left";
      else if (my) w.facing = my > 0 ? "down" : "up";
      const x0 = w.x;
      const y0 = w.y;
      if (onPath) {
        w.x += mx;
        w.y += my;
      } else {
        // 벽에 부딪히면 미끄러지듯 한쪽으로만
        if (!blockedAt(w.x + mx, w.y)) w.x += mx;
        if (!blockedAt(w.x, w.y + my)) w.y += my;
      }
      w.dist += Math.hypot(w.x - x0, w.y - y0);
    }

    const onResize = () => r?.resize();
    window.addEventListener("resize", onResize);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      r?.dispose();
      rendererRef.current = null;
    };
  }, [mode]);

  const walkTo = (x: number, y: number, goal: Station | null = null) => {
    const w = walker.current;
    w.path = findPath(w.x, w.y, x, y);
    w.goal = goal;
  };
  const openStation = (s: Station) => {
    if (goingRef.current) return;
    goingRef.current = true;
    walker.current.keys.clear();
    walker.current.path = [];
    setGoing(s);
    router.push(s.href + hrefSuffix);
  };
  // 혹시 이동이 막혀 이 화면에 그대로 남으면 8초 뒤 다시 누를 수 있게
  useEffect(() => {
    if (!going) return;
    const id = setTimeout(() => {
      goingRef.current = false;
      setGoing(null);
    }, 8000);
    return () => clearTimeout(id);
  }, [going]);
  // 가구 앞에 서면 그 도구 화면을 미리 받아 둔다 → 열 때 빨리 뜬다
  useEffect(() => {
    if (near) router.prefetch(near.href + hrefSuffix);
  }, [near, router, hrefSuffix]);

  const goStation = (s: Station) => {
    if (goingRef.current) return;
    const w = walker.current;
    if (w.near?.key === s.key && !w.path.length) return openStation(s);
    walkTo(s.spot.x, s.spot.y, s);
  };

  // 키보드: 사무실을 누른(초점이 있는) 동안만 — 페이지 스크롤과 다투지 않게
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (goingRef.current) return e.preventDefault();
    if (KEY_DIR[e.key]) {
      e.preventDefault();
      walker.current.keys.add(e.key);
    } else if ((e.key === "x" || e.key === "X" || e.key === "Enter" || e.key === " ") && walker.current.near) {
      if (e.target instanceof HTMLButtonElement && e.key !== "x" && e.key !== "X") return; // 버튼 위 Enter 는 버튼이 처리
      e.preventDefault();
      openStation(walker.current.near);
    }
  };
  const onKeyUp = (e: React.KeyboardEvent) => walker.current.keys.delete(e.key);

  useEffect(() => {
    fullRef.current = full;
  }, [full]);

  // 전체 화면: 들어가면 바로 방향키가 먹게 초점 + 3D 크기 다시 맞추기, 페이지 스크롤 잠그기, Esc 로 나가기
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      rendererRef.current?.resize();
      // 픽셀: 전체 화면에 들어가면 황총무 따라가기, 나오면 사무실 전체 (동숲은 늘 따라가기로 시작)
      if (mode === "pixel") rendererRef.current?.setOverview?.(startOverview(full));
      if (full) stageRef.current?.focus({ preventScroll: true });
    });
    if (!full) return () => cancelAnimationFrame(id);
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFullChange(false);
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      cancelAnimationFrame(id);
      root.style.overflow = prev;
      window.removeEventListener("keydown", onEsc);
    };
  }, [full, onFullChange, mode]);

  const tagToggle = (
    <StToggle type="button" $on={allTags} $full={full} aria-pressed={allTags} onClick={() => setAllTags((v) => !v)}>
      🏷️<span className="more"> 이름표 모두 보기</span>
    </StToggle>
  );

  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    stageRef.current?.focus({ preventScroll: true });
  };

  return (
    <StRoot $full={full} $animal={mode === "animal"}>
      <StBar $full={full}>
        {full && (
          <StBarButton type="button" onClick={() => onFullChange(false)} aria-label="전체 화면 나가기">
            ← 나가기
          </StBarButton>
        )}
        <StModeTabs role="tablist" aria-label="오피스 모양" $full={full}>
          <StModeTab type="button" role="tab" aria-selected={mode === "pixel"} $on={mode === "pixel"} $full={full} onClick={() => chooseMode("pixel")}>
            👾 픽셀<span className="more"> 오피스</span>
          </StModeTab>
          <StModeTab type="button" role="tab" aria-selected={mode === "animal"} $on={mode === "animal"} $full={full} onClick={() => chooseMode("animal")}>
            🍃 동숲<span className="more"> 오피스</span>
          </StModeTab>
        </StModeTabs>
        {full ? (
          tagToggle
        ) : (
          <StBarButton type="button" $light onClick={() => onFullChange(true)}>
            ⛶ 전체 화면
          </StBarButton>
        )}
      </StBar>

      <StStage
        ref={stageRef}
        tabIndex={0}
        aria-label="황총무 오피스 — 방향키로 걸어 다니고 X 로 열어요"
        $animal={mode === "animal"}
        $full={full}
        onKeyDown={onKeyDown}
        onKeyUp={onKeyUp}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          setFocused(false);
          walker.current.keys.clear();
        }}
        onPointerDown={onPointerDown}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("button") || goingRef.current) return;
          const hit = currentPick(e.clientX, e.clientY);
          if (!hit) return;
          const s = hit.key ? STATIONS.find((st) => st.key === hit.key) : null;
          if (s) goStation(s);
          else walkTo(hit.x, hit.y);
        }}
      >
        {mode === "pixel" ? <canvas ref={canvasRef} aria-hidden="true" /> : <div ref={hostRef} className="host" aria-hidden="true" />}

        {ZONES.map((z) => (
          <StZoneTag key={z.id} ref={(el) => { zoneRefs.current[z.id] = el; }} style={{ visibility: "hidden" }}>
            {z.emoji} {z.title}
          </StZoneTag>
        ))}

        {STATIONS.map((s) => (
          <StHot
            key={s.key}
            ref={(el) => { hotRefs.current[s.key] = el; }}
            type="button"
            aria-label={`${s.name} — ${s.desc}`}
            onMouseEnter={() => setHover(s.key)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(s.key)}
            onBlur={() => setHover(null)}
            onClick={() => goStation(s)}
            style={mode === "animal" ? { display: "none" } : undefined}
          />
        ))}

        {STATIONS.map((s) => (
          <StNameTag
            key={s.key}
            ref={(el) => { tagRefs.current[s.key] = el; }}
            $show={ready && (allTags || hover === s.key || near?.key === s.key)}
            $active={near?.key === s.key}
            style={{ visibility: "hidden" }}
          >
            {s.icon} {s.name}
          </StNameTag>
        ))}
        {going && (
          <StGoing role="status" aria-live="assertive">
            <div>
              <span className="icon" aria-hidden="true">
                {going.icon}
              </span>
              <strong>{going.name}{toward(going.name)} 가는 중…</strong>
              <span className="bar" aria-hidden="true">
                <i />
              </span>
            </div>
          </StGoing>
        )}

        {ready && touch && (
          <StPad $full={full} aria-label="방향 패드">
            {(
              [
                ["ArrowUp", "▲", "위로"],
                ["ArrowLeft", "◀", "왼쪽으로"],
                ["ArrowRight", "▶", "오른쪽으로"],
                ["ArrowDown", "▼", "아래로"],
              ] as const
            ).map(([key, label, name]) => (
              <button
                key={key}
                type="button"
                className={key}
                aria-label={name}
                onPointerDown={(e) => {
                  e.preventDefault();
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  if (!goingRef.current) walker.current.keys.add(key);
                }}
                onPointerUp={() => walker.current.keys.delete(key)}
                onPointerCancel={() => walker.current.keys.delete(key)}
                onLostPointerCapture={() => walker.current.keys.delete(key)}
                onContextMenu={(e) => e.preventDefault()}
              >
                {label}
              </button>
            ))}
          </StPad>
        )}

        {ready && (
          <StZoomBar $full={full} role="group" aria-label="보는 크기">
            <button type="button" aria-label="축소" onClick={() => rendererRef.current?.zoom?.(-1)}>
              －
            </button>
            <button type="button" aria-label="확대" onClick={() => rendererRef.current?.zoom?.(1)}>
              ＋
            </button>
            <button type="button" aria-pressed={overview} onClick={() => rendererRef.current?.setOverview?.(!overview)}>
              {overview ? "🧍" : "🗺️"}
              <span className="more">{overview ? " 황총무 곁으로" : " 전체 보기"}</span>
            </button>
          </StZoomBar>
        )}
      </StStage>

      <StControls $full={full} $hide={full && (!hintOn || !!near)}>
        <span>
          {touch ? (
            <>바닥이나 가구를 누르거나 왼쪽 아래 패드로 걸어요. 가구 앞에서 아래 카드의 &quot;열기&quot;를 눌러요</>
          ) : focused ? (
            <>
              <kbd>←↑↓→</kbd> 또는 <kbd>WASD</kbd> 로 걷고, 가구 앞에서 <kbd>X</kbd> 로 열어요
            </>
          ) : (
            <>가고 싶은 바닥이나 가구를 누르면 황총무가 걸어가요. 사무실을 한 번 누르면 방향키로도 움직여요</>
          )}
          {webglFailed && " · 이 브라우저는 동숲 화면(3D)을 못 그려서 픽셀로 보여 드려요"}
          {full && " · Esc 로 나가요"}
        </span>
        {!full && tagToggle}
      </StControls>

      <StPanel aria-live="polite" $full={full} $hide={full && !near}>
        {near ? (
          <>
            <StPanelIcon aria-hidden="true">{near.icon}</StPanelIcon>
            <StPanelText>
              <strong>{near.name}</strong>
              <span>{near.desc}</span>
            </StPanelText>
            <StOpen
              href={near.href + hrefSuffix}
              onClick={(e) => {
                e.preventDefault();
                openStation(near);
              }}
            >
              열기 <kbd>X</kbd>
            </StOpen>
          </>
        ) : (
          <>
            <StPanelIcon aria-hidden="true">🏢</StPanelIcon>
            <StPanelText>
              <strong>황총무 오피스에 오신 걸 환영해요</strong>
              <span>가구 앞에 서면 여기에 무엇인지 보여요. 가구마다 황총무의 실험실 도구가 하나씩 들어 있어요.</span>
            </StPanelText>
            <span />
          </>
        )}
      </StPanel>
    </StRoot>
  );

  // 바닥·가구 누르기 — 화면이 누른 곳을 사무실 칸으로 바꿔 준다
  function currentPick(cx: number, cy: number) {
    return rendererRef.current?.pick(cx, cy) ?? null;
  }
}
