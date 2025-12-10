// components/OgTemplate.tsx
import React from "react";

type Props = {
  title: string;
  subtitle: string;
  emoji: string;
  theme: "blue" | "orange" | "lab"; // ✅ 'lab' 추가
};

export const OgTemplate = ({ title, subtitle, emoji, theme }: Props) => {
  const colors = {
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
    // 🐰 메인 화면용 'Lab' 테마 (추가됨)
    lab: {
      bg: "#F9FAFB", // 스크린샷과 똑같은 연한 회색 배경
      textMain: "#111827", // 아주 진한 차콜색 (거의 검정)
      textSub: "#6B7280", // 차분한 회색
      badgeBg: "#FFFFFF", // 흰색 뱃지
      badgeText: "#374151", // 진한 회색 텍스트
    },
  };

  const style = colors[theme];

  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: style.bg,
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
            color: style.textMain,
            textAlign: "center",
            marginBottom: 10,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
          }}
        >
          {title}
        </div>

        {/* 서브 타이틀 */}
        <div
          style={{
            fontSize: 32, // 조금 더 작고 차분하게
            color: style.textSub,
            fontWeight: 500,
            marginTop: 10,
          }}
        >
          {subtitle}
        </div>

        {/* 하단 브랜드 뱃지 */}
        <div
          style={{
            marginTop: 60,
            padding: "12px 30px",
            background: style.badgeBg,
            borderRadius: 50,
            color: style.badgeText,
            fontSize: 22,
            fontWeight: 700,
            // lab 테마일 때만 그림자 살짝 추가
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
