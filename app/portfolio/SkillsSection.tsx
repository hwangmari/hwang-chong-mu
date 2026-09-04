"use client";

// 일하는 방식(강점 4가지)과 기술(3그룹)을 한 섹션에 나란히 둔다.
// 강점 문구는 기존 포트폴리오에 있던 것을 그대로 옮겨 왔다.
import styled from "styled-components";
import { displayFont } from "@/lib/fonts";
import { Reveal, SectionTitle } from "./motion";

interface Strength {
  icon: string;
  title: string;
  desc: string;
  tone: "blue" | "indigo" | "rose" | "teal";
}

const STRENGTHS: Strength[] = [
  {
    icon: "🧱",
    title: "견고한 마크업",
    desc: "IE6부터 최신 브라우저까지, 테이블 레이아웃에서 Flexbox·Grid까지 직접 경험하며 쌓은 크로스브라우징 노하우. 어떤 디바이스, 어떤 해상도에서도 흔들리지 않는 UI를 만듭니다.",
    tone: "blue",
  },
  {
    icon: "⚛️",
    title: "프론트엔드 전문성",
    desc: "React, Next.js, TypeScript를 주력으로 설계부터 배포·운영까지 실서비스 전 과정을 경험해왔습니다. Svelte, Angular 등 다양한 프레임워크를 넘나든 경험 덕분에 트렌드에 휘둘리지 않고, 프로젝트에 맞는 최적의 구조를 판단할 수 있습니다.",
    tone: "indigo",
  },
  {
    icon: "🎨",
    title: "디자인을 넘어, 디테일이 만드는 경험",
    desc: "서양화를 전공하며 훈련한 시각적 감각으로 디자이너의 의도를 정확하게 구현합니다. 여백, 정렬, 타이포그래피는 물론 인터랙션과 사용자 흐름까지 — 보이는 것 너머의 경험을 설계하며, 픽셀 단위의 디테일에서 완성도가 결정된다고 믿습니다.",
    tone: "rose",
  },
  {
    icon: "🤝",
    title: "팀 시너지",
    desc: "'왜 이걸 해야 하는지'에서 출발해 '우리가 무엇을 할 수 있는지'까지 함께 고민합니다. 주어진 일을 넘어 방향을 제안하고, PM의 시야로 전체 흐름을 챙기며 — 같이 일할수록 속도와 방향이 맞아가는 시너지를 만들어내는 동료입니다.",
    tone: "teal",
  },
];

const SKILL_GROUPS: { title: string; items: string[]; variant: "solid" | "soft" | "primary" }[] = [
  {
    title: "프론트엔드",
    items: ["TypeScript", "Next.js", "React", "Svelte", "Angular"],
    variant: "solid",
  },
  {
    title: "스타일·UI",
    items: [
      "SCSS (CSS Modules)",
      "Styled Components",
      "Tailwind CSS",
      "Ant Design",
      "Adorable CSS",
      "Responsive Web",
      "Cross Browsing",
    ],
    variant: "soft",
  },
  {
    title: "협업·도구",
    items: ["Monorepo (Turbo)", "Git", "Slack", "Jira", "Wiki", "Agile", "Figma", "Zeplin"],
    variant: "primary",
  },
];

export default function SkillsSection() {
  return (
    <StSection id="skills" className={displayFont.variable}>
      <StInner>
        <SectionTitle title="일하는 방식과 기술" />

        <StColumns>
          <StStrengths>
            {STRENGTHS.map((s) => (
              <Reveal key={s.title}>
                <StStrengthCard $tone={s.tone}>
                  <span className="icon" aria-hidden="true">
                    {s.icon}
                  </span>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                </StStrengthCard>
              </Reveal>
            ))}
          </StStrengths>

          <StSkills>
            {SKILL_GROUPS.map((group) => (
              <Reveal key={group.title}>
                <StSkillGroup>
                  <h3>{group.title}</h3>
                  <StTagList>
                    {group.items.map((item) => (
                      <StTag key={item} $variant={group.variant}>
                        {item}
                      </StTag>
                    ))}
                  </StTagList>
                </StSkillGroup>
              </Reveal>
            ))}
          </StSkills>
        </StColumns>
      </StInner>
    </StSection>
  );
}

const StSection = styled.section`
  background: ${({ theme }) => theme.colors.gray50};
  padding: 1.9rem 0;
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
  scroll-margin-top: 4.5rem;
`;

const StInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 1.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    padding: 0 1.15rem;
  }
`;

const StColumns = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const StStrengths = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.7rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const StStrengthCard = styled.div<{ $tone: Strength["tone"] }>`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  height: 100%;
  padding: 0.95rem 1rem 1rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-top: 3px solid
    ${({ theme, $tone }) =>
      $tone === "blue"
        ? theme.colors.blue500
        : $tone === "indigo"
          ? theme.colors.indigo500
          : $tone === "rose"
            ? theme.colors.rose500
            : theme.colors.teal500};
  background: ${({ theme }) => theme.colors.white};
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease;

  .icon {
    font-size: 1.3rem;
    line-height: 1;
  }

  &:hover {
    transform: translateY(-2px);
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }

  strong {
    font-size: 0.92rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
    word-break: keep-all;
  }

  p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.gray600};
    word-break: keep-all;
  }
`;

const StSkills = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem 1.4rem;
  padding: 1rem 1.15rem 1.1rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.white};

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 0.9rem;
  }
`;

const StSkillGroup = styled.div`
  h3 {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
`;

const StTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`;

const StTag = styled.span<{ $variant: "solid" | "soft" | "primary" }>`
  padding: 0.22rem 0.6rem;
  border-radius: 0.5rem;
  border: 1px solid
    ${({ theme, $variant }) => ($variant === "soft" ? theme.semantic.border : "transparent")};
  font-size: 0.74rem;
  font-weight: 600;

  background: ${({ theme, $variant }) =>
    $variant === "solid"
      ? theme.colors.gray900
      : $variant === "soft"
        ? theme.colors.gray100
        : theme.colors.blue50};
  color: ${({ theme, $variant }) =>
    $variant === "solid"
      ? theme.colors.white
      : $variant === "soft"
        ? theme.colors.gray700
        : theme.colors.blue700};
`;
