"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MUSCLES, PART_LABEL } from "../data";
import type { MusclePart } from "../types";
import {
  StBodyBox,
  StBodyCaption,
  StBodyFigure,
  StBodyHead,
  StBodyReset,
  StBodySpacer,
  StBodySwitch,
  StBodySwitchButton,
} from "../page.styles";
import { ART_PATHS } from "./artPaths";
import { ART_SETS, type BodySex, type PhotoSpot, type PhotoView } from "./photoMap";

// 몸 그림 — 앞·옆·뒤는 주인이 준 3면도(남·여), 발바닥·발등은 주인이 준 발 그림을 SVG 선화로 깔고
// 그 위에 누를 자리(근육 칸)를 얹는다. 부위를 고르면 그 자리를 확대한다. (2026-09-21, 발 2026-09-22)

type View = "front" | "side" | "back" | "sole" | "dorsum";

const VIEW_LABEL: Record<View, string> = {
  front: "앞모습",
  side: "옆모습",
  back: "뒷모습",
  sole: "발바닥",
  dorsum: "발등",
};

/** 전체 보기에서 그림 양옆에 비워 두는 이름표 자리 (그림 폭의 비율) */
const LABEL_MARGIN_RATIO = 0.62;

/** 이름표끼리 최소로 띄우는 간격 (그림 높이의 비율) */
const LABEL_GAP_RATIO = 0.045;

/** 흔히 쓰는 이름(대흉근·햄스트링) — 카드 제목과 같은 이름을 그림에도 쓴다 */
function nameOf(id: string): string {
  const muscle = MUSCLES.find((item) => item.id === id);
  return muscle?.alias ?? muscle?.name ?? id;
}

function partOf(id: string): MusclePart | undefined {
  return MUSCLES.find((muscle) => muscle.id === id)?.part;
}

/** 이름표 한 개의 자리 */
type Placed = {
  id: string;
  side: "left" | "right";
  labelY: number;
  textX: number;
  lineX: number;
  anchor: { x: number; y: number };
};

type BodyMapProps = {
  part: MusclePart | "all";
  activeId: string | null;
  onPickMuscle: (id: string) => void;
  onReset: () => void;
};

export default function BodyMap({ part, activeId, onPickMuscle, onReset }: BodyMapProps) {
  const [picked, setPicked] = useState<{ key: string; view: View } | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  /** 남·여 그림 */
  const [sex, setSex] = useState<BodySex>("male");
  const art = ART_SETS[sex];
  const svgRef = useRef<SVGSVGElement>(null);
  const [scale, setScale] = useState(1);

  const zoomed = part !== "all";
  const viewKey = `${part}:${activeId ?? ""}`;

  /** 고른 부위가 가장 잘 보이는 면 */
  const autoView = useMemo<View>(() => {
    if (part === "all" && !activeId) return "front";
    const hit = (ids: string[]) =>
      ids.filter((id) => (activeId ? id === activeId : partOf(id) === part)).length;
    const counts = (["front", "back", "side", "sole", "dorsum"] as View[]).map(
      (option): [View, number] => [option, hit(art[option].spots.map((spot) => spot.id))],
    );
    return counts.reduce((best, item) => (item[1] > best[1] ? item : best))[0];
  }, [part, activeId, art]);

  const view = picked?.key === viewKey ? picked.view : autoView;
  /** 이 보기의 주인 그림과 그 위 손잡이 자리 */
  const photo: PhotoView = art[view];
  /** 주인 그림에서 근육 선을 따라 뽑은 근육 칸 — 발은 남녀 같이 쓴다 */
  const artView = ART_PATHS[view === "sole" || view === "dorsum" ? "foot" : sex]?.[view] ?? null;
  /** 그림에서 이 보기가 차지하는 칸 */
  const vbBox = photo.box.split(" ").map(Number);

  /** 이 보기에서 다루는 근육 id 들 */
  const ids = photo.spots.map((spot) => spot.id);

  /** 전체 보기 칸 — 그림 양옆에 이름표 자리를 비워 둔다. 이름표가 팔 위에 겹치지 않게 (주인 요청 2026-09-21)
   *  옆모습처럼 폭이 좁은 그림도 이름표 자리는 최소한 확보한다 (높이의 20%) */
  const wholeBox = useMemo(() => {
    const [boxX, boxY, boxW, boxH] = photo.box.split(" ").map(Number);
    const margin = Math.round(Math.max(boxW * LABEL_MARGIN_RATIO, boxH * 0.2));
    return `${boxX - margin} ${boxY} ${boxW + margin * 2} ${boxH}`;
  }, [photo]);

  /** 확대 칸 — 주인 그림에서는 그 부위 손잡이를 감싸도록 직접 잰다 */
  const viewBox = useMemo(() => {
    const [boxX, boxY, boxW, boxH] = photo.box.split(" ").map(Number);
    const whole = wholeBox;
    if (!zoomed) return whole;
    const mine = photo.spots.filter((spot) => partOf(spot.id) === part);
    if (mine.length === 0) return whole;
    const left = Math.min(...mine.map((spot) => spot.cx - spot.rx));
    const right = Math.max(...mine.map((spot) => spot.cx + spot.rx));
    const top = Math.min(...mine.map((spot) => spot.cy - spot.ry));
    const bottom = Math.max(...mine.map((spot) => spot.cy + spot.ry));
    // 이름표가 설 자리까지 생각해 옆으로 넉넉히, 위아래로도 조금 넓힌다
    const padX = Math.max((right - left) * 0.9, 150);
    const padY = Math.max((bottom - top) * 0.25, 60);
    const x = Math.max(boxX, left - padX);
    const y = Math.max(boxY, top - padY);
    const w = Math.min(boxX + boxW - x, right - left + padX * 2);
    const h = Math.min(boxY + boxH - y, bottom - top + padY * 2);
    // 확대해도 그림의 절반 넘게 보이면(발 그림에서 발 부위 등) 확대하지 않고 전체 배치(이름표는 양옆 여백)를 쓴다
    if (w * h > boxW * boxH * 0.5) return whole;
    return `${Math.round(x)} ${Math.round(y)} ${Math.round(w)} ${Math.round(h)}`;
  }, [photo, part, zoomed, wholeBox]);
  /** 실제로 그림을 잘라 확대했는지 — 이름표 점선 시작 자리가 달라진다 */
  // 세로로만 잘린 확대도 확대로 친다 — 전체 배치(양옆 여백)와 다르면 점선은 그림 안쪽에서 시작
  const cropped = viewBox !== wholeBox;

  const [vbX, vbY, vbW, vbH] = viewBox.split(" ").map(Number);

  /** 이름표를 붙일 근육 — 확대 중이면 그 부위만 */
  const shown = zoomed ? ids.filter((id) => partOf(id) === part) : ids;

  const anchorOf = (id: string): { x: number; y: number } => {
    const spot = photo.spots.find((item) => item.id === id);
    return spot ? { x: spot.cx, y: spot.cy } : { x: vbX + vbW / 2, y: vbY + vbH / 2 };
  };

  const sideOf = (id: string): "left" | "right" => photo.spots.find((spot) => spot.id === id)?.side ?? "left";

  /**
   * 이름표 자리 — 근육 높이 순서를 지키면서, 몰린 곳은 아래로만 밀지 않고 그 무리의 가운데를
   * 기준으로 위아래로 고르게 벌린다. 그래야 이름표가 자기 근육 높이에서 멀어지지 않는다 (2026-09-21)
   */
  const placed: Placed[] = (["left", "right"] as const).flatMap((side) => {
    const mine = shown
      .filter((id) => sideOf(id) === side)
      .map((id) => ({ id, anchor: anchorOf(id) }))
      .sort((a, b) => a.anchor.y - b.anchor.y);
    const gap = vbH * LABEL_GAP_RATIO;
    const top = vbY + gap / 2;
    const bottom = vbY + vbH - gap / 2;
    const ys = mine.map((item) => Math.min(bottom, Math.max(top, item.anchor.y)));
    // 겹치는 이웃을 서로 반씩 밀어내기를 여러 번 — 무리가 가운데를 중심으로 퍼진다
    for (let round = 0; round < 80; round += 1) {
      let moved = false;
      for (let i = 1; i < ys.length; i += 1) {
        const overlap = gap - (ys[i] - ys[i - 1]);
        if (overlap > 0.01) {
          ys[i - 1] -= overlap / 2;
          ys[i] += overlap / 2;
          moved = true;
        }
      }
      for (let i = 0; i < ys.length; i += 1) ys[i] = Math.min(bottom, Math.max(top, ys[i]));
      if (!moved) break;
    }
    // 끝에 닿아 눌린 경우를 위해 한 번 더 아래로만 정리 — 순서와 간격을 보장한다
    for (let i = 1; i < ys.length; i += 1) ys[i] = Math.max(ys[i], ys[i - 1] + gap);
    return mine.map(({ id, anchor }, index) => ({
      id,
      side,
      anchor,
      labelY: ys[index],
      textX: side === "left" ? vbX + vbW * 0.015 : vbX + vbW * 0.985,
      // 전체 보기에서는 점선이 그림 바로 바깥에서 시작한다 — 글자는 여백에, 선은 그림 안으로
      lineX:
        !cropped
          ? side === "left"
            ? vbBox[0] - 4
            : vbBox[0] + vbBox[2] + 4
          : side === "left"
            ? vbX + vbW * 0.18
            : vbX + vbW * 0.82,
    }));
  });

  useEffect(() => {
    const node = svgRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const box = node.getBoundingClientRect();
      const next = Math.min(box.width / vbW, box.height / vbH);
      if (Number.isFinite(next) && next > 0) setScale(next);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [vbW, vbH]);

  const hovered = hover ? MUSCLES.find((muscle) => muscle.id === hover) : undefined;
  const caption = hovered
    ? `${hovered.alias} · ${hovered.name}`
    : zoomed
      ? `${PART_LABEL[part]} — 이름을 누르면 그 근육만, 흐린 근육을 누르면 그 부위로 가요`
      : "그림에서 눌러 고르기";

  /** 손잡이·이름표를 눌렀을 때 하는 일 */
  const handlers = (id: string, dim: boolean) => ({
    role: "button" as const,
    tabIndex: dim ? -1 : 0,
    "aria-label": `${nameOf(id)} 자세히 보기`,
    "aria-pressed": activeId === id,
    "data-muscle": id,
    // 흐린(다른 부위) 근육도 누를 수 있다 — 누르면 그 근육의 부위로 옮겨 간다 (주인 요청 2026-09-21)
    onClick: () => onPickMuscle(id),
    onMouseEnter: () => setHover(id),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover(id),
    onBlur: () => setHover(null),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onPickMuscle(id);
      }
    },
  });

  const className = (id: string, base: string, dim: boolean) =>
    `${base}${activeId === id ? " on" : ""}${hover === id ? " hover" : ""}${dim ? " dim" : ""}`;

  /** 주인 그림 위의 손잡이 하나 */
  const spotHandle = (spot: PhotoSpot) => {
    const dim = zoomed && partOf(spot.id) !== part;
    return (
      <g key={spot.id} className={className(spot.id, "spot", dim)} {...handlers(spot.id, dim)}>
        <title>{nameOf(spot.id)}</title>
        {artView?.regions[spot.id] ? (
          <>
            <path d={artView.regions[spot.id]} />
            {/* 갈래 사이 경계 — 그림 속 선 그대로, 고르거나 손을 올리면 진해져 갈래가 나뉘어 보인다 */}
            {artView.seams?.[spot.id] ? <path className="seam" d={artView.seams[spot.id]} /> : null}
          </>
        ) : (
          <ellipse
            cx={spot.cx}
            cy={spot.cy}
            rx={spot.rx}
            ry={spot.ry}
            transform={spot.rot ? `rotate(${spot.rot} ${spot.cx} ${spot.cy})` : undefined}
          />
        )}
      </g>
    );
  };

  const label = (item: Placed) => (
    <g
      key={`label-${item.id}`}
      className={className(item.id, "label", false)}
      onClick={() => onPickMuscle(item.id)}
      onMouseEnter={() => setHover(item.id)}
      onMouseLeave={() => setHover(null)}
    >
      <polyline
        className="leader"
        points={`${item.lineX},${item.labelY} ${item.anchor.x},${item.labelY} ${item.anchor.x},${item.anchor.y}`}
      />
      <circle className="dot" cx={item.anchor.x} cy={item.anchor.y} r={Math.max(vbW, vbH) * 0.005} />
      <text
        x={item.textX}
        y={item.labelY + 4 / scale}
        textAnchor={item.side === "left" ? "start" : "end"}
      >
        {nameOf(item.id)}
      </text>
    </g>
  );

  return (
    <StBodyBox>
      <StBodyHead>
        <StBodySwitch role="group" aria-label="남녀 그림">
          {(["male", "female"] as BodySex[]).map((option) => (
            <StBodySwitchButton
              key={option}
              type="button"
              $active={sex === option}
              aria-pressed={sex === option}
              data-testid={`body-sex-${option}`}
              onClick={() => setSex(option)}
            >
              {option === "male" ? "남성" : "여성"}
            </StBodySwitchButton>
          ))}
        </StBodySwitch>
        {(
          [
            { label: "몸", options: ["front", "side", "back"] as View[] },
            { label: "발", options: ["sole", "dorsum"] as View[] },
          ]
        ).map((group) => (
          <StBodySwitch key={group.label} role="group" aria-label={`${group.label} 보기`}>
            {group.options.map((option) => (
              <StBodySwitchButton
                key={option}
                type="button"
                $active={view === option}
                aria-pressed={view === option}
                data-testid={`body-view-${option}`}
                onClick={() => setPicked({ key: viewKey, view: option })}
              >
                {VIEW_LABEL[option]}
              </StBodySwitchButton>
            ))}
          </StBodySwitch>
        ))}
        <StBodySpacer />
        {zoomed && (
          <StBodyReset type="button" data-testid="body-reset" onClick={onReset}>
            전체 보기
          </StBodyReset>
        )}
      </StBodyHead>

      <StBodyFigure
        ref={svgRef}
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={`${VIEW_LABEL[view]} 근육 그림`}
        data-testid="body-map"
        data-zoom={part}
        data-view={view}
        style={{ fontSize: `${(13 / scale).toFixed(2)}px` }}
      >
        {/* 주인 그림을 옮긴 SVG 선화를 제자리에 깔고, 그 위에 근육 칸을 얹는다 */}
        <image
          className="art"
          href={photo.src}
          x={vbBox[0]}
          y={vbBox[1]}
          width={vbBox[2]}
          height={vbBox[3]}
          preserveAspectRatio="none"
        />
        {/* 선을 따라 뽑은 칸을 먼저(큰 것부터) 깔고, 칸이 없는 속근육 타원을 맨 위에 — 작은 것도 눌리게 */}
        {[...photo.spots]
          .sort((a, b) => {
            const layer = (spot: PhotoSpot) => (artView?.regions[spot.id] ? 0 : 1);
            return layer(a) - layer(b) || b.rx * b.ry - a.rx * a.ry;
          })
          .map(spotHandle)}
        {placed.map(label)}
      </StBodyFigure>

      <StBodyCaption data-testid="body-caption">{caption}</StBodyCaption>
    </StBodyBox>
  );
}
