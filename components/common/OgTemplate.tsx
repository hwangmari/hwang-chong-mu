import React from "react";

type ThemeType =
  | "blue"
  | "orange"
  | "lab"
  | "purple"
  | "green"
  | "indigo"
  | "rose"
  | "teal"
  | "amber"
  | "slate";

interface OgTemplateProps {
  title: string;
  subtitle: string;
  emoji: string;
  theme: ThemeType;
}

interface ColorPalette {
  bg: string;
  textMain: string;
  textSub: string;
  badgeBg: string;
  badgeText: string;
}

export const OgTemplate = ({
  title,
  subtitle,
  emoji,
  theme,
}: OgTemplateProps) => {
  const themeColors: Record<ThemeType, ColorPalette> = {
    blue: {
      bg: "#EFF6FF",
      textMain: "#1E3A8A",
      textSub: "#3B82F6",
      badgeBg: "#DBEAFE",
      badgeText: "#2563EB",
    },
    orange: {
      bg: "#FFF7ED",
      textMain: "#7C2D12",
      textSub: "#EA580C",
      badgeBg: "#FFEDD5",
      badgeText: "#C2410C",
    },
    lab: {
      bg: "#F9FAFB",
      textMain: "#111827",
      textSub: "#6B7280",
      badgeBg: "#FFFFFF",
      badgeText: "#374151",
    },
    purple: {
      bg: "#FAF5FF",
      textMain: "#581C87",
      textSub: "#9333EA",
      badgeBg: "#F3E8FF",
      badgeText: "#7C3AED",
    },
    green: {
      bg: "#F0FDF4",
      textMain: "#14532D",
      textSub: "#16A34A",
      badgeBg: "#DCFCE7",
      badgeText: "#15803D",
    },
    indigo: {
      bg: "#EEF2FF",
      textMain: "#312E81",
      textSub: "#6366F1",
      badgeBg: "#E0E7FF",
      badgeText: "#4F46E5",
    },
    rose: {
      bg: "#FFF1F2",
      textMain: "#881337",
      textSub: "#E11D48",
      badgeBg: "#FFE4E6",
      badgeText: "#BE123C",
    },
    teal: {
      bg: "#F0FDFA",
      textMain: "#134E4A",
      textSub: "#0D9488",
      badgeBg: "#CCFBF1",
      badgeText: "#0F766E",
    },
    amber: {
      bg: "#FFFBEB",
      textMain: "#78350F",
      textSub: "#D97706",
      badgeBg: "#FEF3C7",
      badgeText: "#B45309",
    },
    slate: {
      bg: "#F8FAFC",
      textMain: "#0F172A",
      textSub: "#475569",
      badgeBg: "#E2E8F0",
      badgeText: "#334155",
    },
  };

  const colors = themeColors[theme];

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: colors.bg,
        fontFamily: '"Noto Sans KR", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "28px",
        }}
      >
        {/* 이모지 */}
        <div style={{ fontSize: 64, marginBottom: 18 }}>{emoji}</div>

        {/* 메인 타이틀 */}
        <div
          style={{
            fontSize: 46,
            fontWeight: 900,
            color: colors.textMain,
            textAlign: "center",
            marginBottom: 6,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            whiteSpace: "pre-wrap",
          }}
        >
          {title}
        </div>

        {/* 서브 타이틀 */}
        <div
          style={{
            fontSize: 22,
            color: colors.textSub,
            fontWeight: 500,
            marginTop: 6,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>

        {/* 하단 브랜드 뱃지 */}
        <div
          style={{
            marginTop: 36,
            padding: "8px 22px",
            background: colors.badgeBg,
            borderRadius: 50,
            color: colors.badgeText,
            fontSize: 16,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              theme === "lab" ? "0 4px 6px -1px rgba(0, 0, 0, 0.05)" : "none",
          }}
        >
          Hwang Lab
        </div>
      </div>
    </div>
  );
};
