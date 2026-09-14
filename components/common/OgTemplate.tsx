import React from "react";
import { OG_FONT_FAMILY } from "@/lib/og-font";

// 카카오톡·슬랙 등에 링크를 붙였을 때 뜨는 미리보기 이미지를 그리는 틀.
//
// 규격은 1200×630 — 링크 미리보기의 표준 크기다. 이보다 작으면
// 카카오톡이 늘려서 흐려지고, 비율이 다르면 위아래가 잘린다.
//
// 구성은 어느 서비스나 똑같다.
//   왼쪽 6할 = 글 (브랜드 줄 → 서비스 이름 → 한 줄 설명 → 주소)
//   오른쪽 4할 = 타일 (서비스 색 판 위에 큰 이모지 + 그 도구를 알아볼 작은 조각)
//
// 이미지를 그리는 도구(satori)는 보통 브라우저가 아니라서 제약이 있다.
//   - 자식이 둘 이상인 상자는 display: "flex" 를 반드시 적어야 한다
//   - CSS grid, gap 은 쓰지 않는다 (여백은 margin 으로)
//   - 흐릿한 그림자 대신 단색 테두리·배경으로 표현한다

export type OgTone =
  | "lab"
  | "blue"
  | "indigo"
  | "violet"
  | "green"
  | "teal"
  | "cyan"
  | "lime"
  | "amber"
  | "orange"
  | "rose"
  | "plum"
  | "red"
  | "slate";

export interface TonePalette {
  /** 오른쪽 뒤에 크게 깔리는 은은한 색 */
  blob: string;
  /** 타일 그라데이션 시작 */
  tile: string;
  /** 타일 그라데이션 끝 */
  tileDeep: string;
  /** 한 줄 설명 색 */
  body: string;
  /** 서비스 이름 색 */
  head: string;
}

export const TONES: Record<OgTone, TonePalette> = {
  lab: {
    blob: "#E7E3D8",
    tile: "#57534E",
    tileDeep: "#292524",
    body: "#57534E",
    head: "#1C1917",
  },
  blue: {
    blob: "#D7E6FB",
    tile: "#3B82F6",
    tileDeep: "#1D4ED8",
    body: "#1D4ED8",
    head: "#172554",
  },
  indigo: {
    blob: "#DEDEFB",
    tile: "#6366F1",
    tileDeep: "#4338CA",
    body: "#4338CA",
    head: "#1E1B4B",
  },
  violet: {
    blob: "#E8DCFB",
    tile: "#8B5CF6",
    tileDeep: "#6D28D9",
    body: "#6D28D9",
    head: "#2E1065",
  },
  green: {
    blob: "#D3F0DD",
    tile: "#22C55E",
    tileDeep: "#15803D",
    body: "#15803D",
    head: "#052E16",
  },
  teal: {
    blob: "#CCEDE8",
    tile: "#14B8A6",
    tileDeep: "#0F766E",
    body: "#0F766E",
    head: "#042F2E",
  },
  cyan: {
    blob: "#CDEAF4",
    tile: "#06B6D4",
    tileDeep: "#0E7490",
    body: "#0E7490",
    head: "#083344",
  },
  lime: {
    blob: "#E1F2C4",
    tile: "#84CC16",
    tileDeep: "#4D7C0F",
    body: "#4D7C0F",
    head: "#1A2E05",
  },
  amber: {
    blob: "#F7E7BE",
    tile: "#F59E0B",
    tileDeep: "#B45309",
    body: "#B45309",
    head: "#451A03",
  },
  orange: {
    blob: "#FADFC8",
    tile: "#F97316",
    tileDeep: "#C2410C",
    body: "#C2410C",
    head: "#431407",
  },
  rose: {
    blob: "#FAD8DF",
    tile: "#F43F5E",
    tileDeep: "#BE123C",
    body: "#BE123C",
    head: "#4C0519",
  },
  plum: {
    blob: "#F6D8EC",
    tile: "#DB2777",
    tileDeep: "#9D174D",
    body: "#9D174D",
    head: "#500724",
  },
  red: {
    blob: "#F9D6D6",
    tile: "#EF4444",
    tileDeep: "#B91C1C",
    body: "#B91C1C",
    head: "#450A0A",
  },
  slate: {
    blob: "#DCE1E9",
    tile: "#64748B",
    tileDeep: "#334155",
    body: "#334155",
    head: "#020617",
  },
};

/** 종이 같은 따뜻한 바탕색 */
export const OG_BG = "#FBFAF7";
const MUTED = "#8C8578";
const FAINT = "#A8A092";

export interface OgTemplateProps {
  /** 서비스 이름 (가장 크게) */
  title: string;
  /** 한 줄 설명 — 28자 안쪽이 보기 좋다 */
  subtitle: string;
  /** 타일 안 큰 그림 */
  emoji: string;
  /** 서비스 색 */
  tone: OgTone;
  /** 맨 위 작은 줄. 기본은 사이트 이름 */
  brand?: string;
  /** 왼쪽 아래 주소. 예: "hwang-lab.kr/calc" */
  url?: string;
  /** 타일 안 이모지 아래에 들어가는 작은 조각 (그 도구를 알아보게 하는 힌트) */
  fragment?: React.ReactNode;
  /** 타일을 안 쓰고 오른쪽 전체를 직접 그리고 싶을 때 */
  right?: React.ReactNode;
}

export const OgTemplate = ({
  title,
  subtitle,
  emoji,
  tone,
  brand,
  url,
  fragment,
  right,
}: OgTemplateProps) => {
  const c = TONES[tone];

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        background: OG_BG,
        fontFamily: `"${OG_FONT_FAMILY}", sans-serif`,
      }}
    >
      {/* 오른쪽 뒤에 크게 번지는 색 얼룩 */}
      <div
        style={{
          position: "absolute",
          top: -230,
          right: -210,
          width: 900,
          height: 900,
          borderRadius: 450,
          backgroundImage: `radial-gradient(circle at 50% 50%, ${c.blob} 0%, ${OG_BG} 70%)`,
        }}
      />
      {/* 왼쪽 아래 작은 얼룩 — 여백이 허전하지 않게 */}
      <div
        style={{
          position: "absolute",
          bottom: -260,
          left: -180,
          width: 520,
          height: 520,
          borderRadius: 260,
          backgroundImage: `radial-gradient(circle at 50% 50%, ${c.blob} 0%, ${OG_BG} 70%)`,
        }}
      />

      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          padding: "62px 68px",
        }}
      >
        {/* ── 왼쪽: 글 ── */}
        <div
          style={{
            width: 660,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* 브랜드 줄 */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 30, marginRight: 12 }}>🐾</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 400,
                color: MUTED,
                letterSpacing: "-0.01em",
              }}
            >
              {brand ?? "황총무의 실험실"}
            </div>
          </div>

          {/* 이름 + 한 줄 설명 */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontSize: 72,
                fontWeight: 800,
                color: c.head,
                lineHeight: 1.16,
                letterSpacing: "-0.04em",
                wordBreak: "keep-all",
                maxWidth: 600,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 24,
                fontSize: 34,
                fontWeight: 400,
                color: c.body,
                lineHeight: 1.42,
                letterSpacing: "-0.02em",
                wordBreak: "keep-all",
                maxWidth: 580,
              }}
            >
              {subtitle}
            </div>
          </div>

          {/* 주소 */}
          <div
            style={{
              fontSize: 26,
              fontWeight: 400,
              color: FAINT,
              letterSpacing: "0.01em",
            }}
          >
            {url ?? "hwang-lab.kr"}
          </div>
        </div>

        {/* ── 오른쪽: 타일 ── */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          {right ?? (
            <div
              style={{
                position: "relative",
                width: 372,
                height: 440,
                borderRadius: 56,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundImage: `linear-gradient(145deg, ${c.tile} 0%, ${c.tileDeep} 100%)`,
              }}
            >
              {/* 이모지 뒤 부드러운 빛 */}
              <div
                style={{
                  position: "absolute",
                  top: 22,
                  left: 26,
                  width: 320,
                  height: 320,
                  borderRadius: 160,
                  backgroundImage:
                    "radial-gradient(circle at 50% 45%, rgba(255,255,255,0.42) 0%, rgba(255,255,255,0) 68%)",
                }}
              />
              <div
                style={{
                  display: "flex",
                  marginTop: fragment ? 54 : 130,
                  fontSize: 156,
                  lineHeight: 1,
                }}
              >
                {emoji}
              </div>
              {fragment ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginTop: 30,
                    width: "100%",
                  }}
                >
                  {fragment}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
