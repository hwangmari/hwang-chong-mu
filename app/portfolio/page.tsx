"use client";

import { useRef, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Typography } from "@hwangchongmu/ui";
import PortfolioInfo from "./PortfolioInfo";
import ResumeSection from "./ResumeSection";
import ProjectSection from "./project/ProjectSection";
import CareerGraph from "./CareerGraph";

const HIGHLIGHTS = [
  {
    icon: "🧱",
    title: "견고한 마크업",
    desc: "IE6부터 최신 브라우저까지, 테이블 레이아웃에서 Flexbox·Grid까지 직접 경험하며 쌓은 크로스브라우징 노하우. 어떤 디바이스, 어떤 해상도에서도 흔들리지 않는 UI를 만듭니다.",
    accent: "#3b82f6",
    bg: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
  },
  {
    icon: "⚛️",
    title: "프론트엔드 전문성",
    desc: "React, Next.js, TypeScript를 주력으로 설계부터 배포·운영까지 실서비스 전 과정을 경험해왔습니다. Svelte, Angular 등 다양한 프레임워크를 넘나든 경험 덕분에 트렌드에 휘둘리지 않고, 프로젝트에 맞는 최적의 구조를 판단할 수 있습니다.",
    accent: "#8b5cf6",
    bg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
  },
  {
    icon: "🎨",
    title: "디자인을 넘어, 디테일이 만드는 경험",
    desc: "서양화를 전공하며 훈련한 시각적 감각으로 디자이너의 의도를 정확하게 구현합니다. 여백, 정렬, 타이포그래피는 물론 인터랙션과 사용자 흐름까지 — 보이는 것 너머의 경험을 설계하며, 픽셀 단위의 디테일에서 완성도가 결정된다고 믿습니다.",
    accent: "#ec4899",
    bg: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
  },
  {
    icon: "🤝",
    title: "팀 시너지",
    desc: "'왜 이걸 해야 하는지'에서 출발해 '우리가 무엇을 할 수 있는지'까지 함께 고민합니다. 주어진 일을 넘어 방향을 제안하고, PM의 시야로 전체 흐름을 챙기며 — 같이 일할수록 속도와 방향이 맞아가는 시너지를 만들어내는 동료입니다.",
    accent: "#10b981",
    bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const iconVariants = {
  rest: { rotate: 0, scale: 1 },
  hover: {
    rotate: [0, -10, 10, -5, 5, 0],
    scale: [1, 1.2, 1.2, 1.1, 1.1, 1.15],
    transition: { duration: 0.6 },
  },
};

function HighlightCard({
  item,
  index,
}: {
  item: (typeof HIGHLIGHTS)[number];
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <StHighlightCard
      as={motion.div}
      ref={cardRef}
      custom={index}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={cardVariants}
      whileHover={{ y: -6, boxShadow: `0 12px 32px ${item.accent}20` }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      $accent={item.accent}
      $bg={item.bg}
    >
      {isHovered && (
        <StGlow
          $color={item.accent}
          style={{
            left: mousePos.x,
            top: mousePos.y,
          }}
        />
      )}
      <StHighlightIcon
        as={motion.div}
        variants={iconVariants}
        initial="rest"
        whileHover="hover"
      >
        {item.icon}
      </StHighlightIcon>
      <StAccentBar $color={item.accent} />
      <StHighlightTitle>{item.title}</StHighlightTitle>
      <StHighlightDesc>{item.desc}</StHighlightDesc>
    </StHighlightCard>
  );
}

export default function PortfolioPage() {
  return (
    <StContainer>
      {/* 1. 헤더 (프로필) */}
      <PortfolioInfo />

      <StDivider />

      {/* 1.5 커리어 그래프 */}
      <CareerGraph />

      <StDivider />

      {/* 1.7 핵심 역량 요약 */}
      <StHighlightSection>
        <StHighlightGrid>
          {HIGHLIGHTS.map((item, i) => (
            <HighlightCard key={item.title} item={item} index={i} />
          ))}
        </StHighlightGrid>
      </StHighlightSection>

      <StDivider />

      {/* 2. 이력서 섹션 */}
      <ResumeSection />

      {/* 3. 프로젝트 섹션 */}
      <ProjectSection />

      {/* 4. 푸터 */}
      <StFooter>
        <Typography variant="caption" color="gray400" align="center">
          © 2025 Hwang Hye kyeong. All rights reserved.
        </Typography>
      </StFooter>
    </StContainer>
  );
}

const StContainer = styled.div`
  min-height: 100vh;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    sans-serif;

  &::selection {
    background-color: ${({ theme }) => theme.colors.yellow400};
  }
`;

const StDivider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const StHighlightSection = styled.section`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 3rem 1.5rem;
`;

const StHighlightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;

  @media (max-width: 767px) {
    grid-template-columns: 1fr;
  }
`;

const StHighlightCard = styled.div<{ $accent: string; $bg: string }>`
  padding: 1.75rem;
  border-radius: 1.25rem;
  background: ${({ $bg }) => $bg};
  border: 1px solid transparent;
  transition: border-color 0.3s;
  cursor: default;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    right: 0;
    width: 120px;
    height: 120px;
    background: ${({ $accent }) => $accent}08;
    border-radius: 50%;
    transform: translate(40px, -40px);
    transition: all 0.4s;
  }

  &:hover {
    border-color: ${({ $accent }) => $accent}40;
    &::after {
      width: 180px;
      height: 180px;
      background: ${({ $accent }) => $accent}12;
    }
  }
`;

const StGlow = styled.div<{ $color: string }>`
  position: absolute;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    ${({ $color }) => $color}30 0%,
    ${({ $color }) => $color}15 35%,
    ${({ $color }) => $color}05 60%,
    transparent 80%
  );
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 0;
  filter: blur(4px);
`;

const StHighlightIcon = styled.div`
  font-size: 2.25rem;
  margin-bottom: 0.5rem;
  display: inline-block;
  cursor: default;
`;

const StAccentBar = styled.div<{ $color: string }>`
  width: 28px;
  height: 3px;
  border-radius: 2px;
  background: ${({ $color }) => $color};
  margin-bottom: 0.75rem;
  opacity: 0.7;
`;

const StHighlightTitle = styled.h4`
  font-size: 1.05rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
`;

const StHighlightDesc = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.7;
  position: relative;
  z-index: 1;
`;

const StFooter = styled.footer`
  padding: 2.5rem 0;
`;
