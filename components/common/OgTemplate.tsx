import React from "react";

type ThemeType = "blue" | "orange" | "lab";

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
  /** 🎨 테마별 색상 정의 */
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
    /** 🐰 메인 화면용 'Lab' 테마 */
    lab: {
      bg: "#F9FAFB",
      textMain: "#111827",
      textSub: "#6B7280",
      badgeBg: "#FFFFFF",
      badgeText: "#374151",
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
          padding: "40px",
        }}
      >
        {/* 이모지 (토끼) */}
        <div style={{ fontSize: 100, marginBottom: 30 }}>{emoji}</div>

        {/* 메인 타이틀 */}
        <div
          style={{
            fontSize: 70,
            fontWeight: 900,
            color: colors.textMain,
            textAlign: "center",
            marginBottom: 10,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            whiteSpace: "pre-wrap", // 줄바꿈 지원
          }}
        >
          {title}
        </div>

        {/* 서브 타이틀 */}
        <div
          style={{
            fontSize: 32,
            color: colors.textSub,
            fontWeight: 500,
            marginTop: 10,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>

        {/* 하단 브랜드 뱃지 */}
        <div
          style={{
            marginTop: 60,
            padding: "12px 30px",
            background: colors.badgeBg,
            borderRadius: 50,
            color: colors.badgeText,
            fontSize: 22,
            fontWeight: 700,
            display: "flex", // 뱃지 내부 정렬
            alignItems: "center",
            justifyContent: "center",
            /** lab 테마일 때만 그림자 효과 */
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
