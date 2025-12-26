"use client";

import Link from "next/link";
import styled, { css, keyframes } from "styled-components";
import { experiences } from "@/data/experiences";
import Typography from "@/components/common/Typography";

export default function ResumeSection() {
  return (
    <StSectionContainer>
      <StGridWrapper>
        {/* [왼쪽] Skills & Education */}
        <StLeftColumn>
          {/* 🛠 Skills */}
          <div>
            <StSectionTitle>
              <Typography variant="h2" as="h3">
                🛠 Skills
              </Typography>
            </StSectionTitle>

            <StSkillGroupWrapper>
              {/* 1. Framework & Lib */}
              <StSkillItem>
                <StSkillTitle>Framework & Lib</StSkillTitle>
                <StTagList>
                  {["React", "Svelte", "Angular", "Next.js", "TypeScript"].map(
                    (skill) => (
                      <StSkillTag key={skill} $variant="black">
                        {skill}
                      </StSkillTag>
                    )
                  )}
                </StTagList>
              </StSkillItem>

              {/* 2. Styling & UI */}
              <StSkillItem>
                <StSkillTitle>Styling & UI</StSkillTitle>
                <StTagList>
                  {[
                    "SCSS (CSS Modules)",
                    "styled-components",
                    "AdorableCSS",
                    "Tailwind CSS",
                    "Cross Browsing",
                    "Responsive Web",
                  ].map((skill) => (
                    <StSkillTag key={skill} $variant="gray">
                      {skill}
                    </StSkillTag>
                  ))}
                </StTagList>
              </StSkillItem>

              {/* 3. Collaboration */}
              <StSkillItem>
                <StSkillTitle>Collaboration</StSkillTitle>
                <StTagList>
                  {["Git", "Jira", "Wiki", "Agile", "Figma"].map((skill) => (
                    <StSkillTag key={skill} $variant="blue">
                      {skill}
                    </StSkillTag>
                  ))}
                </StTagList>
              </StSkillItem>
            </StSkillGroupWrapper>
          </div>

          {/* 🎓 Education */}
          <div>
            <StSectionTitle>
              <Typography variant="h2" as="h3">
                🎓 Education
              </Typography>
            </StSectionTitle>
            <div>
              <Typography variant="body2" color="gray900" className="fw-700">
                강원대학교 (춘천)
              </Typography>
              <Typography variant="caption" color="gray500">
                미술학과 서양화 전공
              </Typography>
              <Typography variant="caption" color="gray400" className="mt-1">
                2006 - 2010
              </Typography>
            </div>
          </div>
        </StLeftColumn>

        {/* [오른쪽] Work Experience */}
        <StRightColumn>
          <StSectionTitle>
            <Typography variant="h2" as="h3">
              💼 Experience
            </Typography>
          </StSectionTitle>

          <StTimelineList>
            {experiences.map((exp) => (
              <StTimelineItem key={exp.id}>
                {/* 🔥 데이터의 bg-xxx 클래스를 받아서 색상 매핑 */}
                <StTimelineDot $colorClass={exp.color} />

                <StExperienceLink href={`/portfolio/experience/${exp.id}`}>
                  <StCompanyHeader>
                    {exp.company}
                    <StDetailBadge>상세보기 ↗</StDetailBadge>
                  </StCompanyHeader>
                  <Typography
                    variant="body2"
                    color="gray700"
                    className="mb-1 fw-700"
                  >
                    {exp.role}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="gray400"
                    className="mb-1"
                  >
                    {exp.period}
                  </Typography>
                </StExperienceLink>

                <StSummaryList>
                  {exp.summary.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </StSummaryList>
              </StTimelineItem>
            ))}
          </StTimelineList>
        </StRightColumn>
      </StGridWrapper>
    </StSectionContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스 적용)

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StSectionContainer = styled.section`
  max-width: 56rem;
  margin: 0 auto;
  padding: 4rem 1.5rem;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  animation-delay: 0.1s;
  opacity: 0;
`;

const StGridWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;

  @media ${({ theme }) => theme.media.desktop} {
    grid-template-columns: 1fr 2fr;
  }
`;

const StLeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

const StRightColumn = styled.div``;

const StSectionTitle = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// === Skills Styles ===
const StSkillGroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const StSkillItem = styled.div``;

const StSkillTitle = styled.h4`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const StTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StSkillTag = styled.span<{ $variant: "black" | "gray" | "blue" }>`
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case "black":
        return css`
          background-color: ${theme.colors.gray900};
          color: ${theme.colors.white};
        `;
      case "gray":
        return css`
          background-color: ${theme.colors.gray100};
          color: ${theme.colors.gray700};
          font-weight: 500;
        `;
      case "blue":
        return css`
          background-color: ${theme.colors.blue50};
          color: ${theme.colors.blue700};
          font-weight: 500;
        `;
    }
  }}
`;

// === Timeline Styles ===
const StTimelineList = styled.div`
  border-left: 2px solid ${({ theme }) => theme.colors.gray100};
  margin-left: 0.75rem;
  padding-left: 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

const StTimelineItem = styled.div`
  position: relative;

  /* Hover 시 상세보기 버튼 효과 */
  &:hover {
    .detail-badge {
      background-color: ${({ theme }) => theme.colors.gray100};
    }
    a {
      opacity: 0.8;
    }
  }
`;

const StTimelineDot = styled.span<{ $colorClass: string }>`
  position: absolute;
  left: -2.5rem;
  top: 0.5rem;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 9999px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

  background-color: ${({ theme, $colorClass }) => {
    if ($colorClass.includes("orange-500")) return theme.colors.orange500;
    if ($colorClass.includes("yellow-400")) return theme.colors.yellow400;
    if ($colorClass.includes("blue-600")) return theme.colors.blue600;
    if ($colorClass.includes("gray-400")) return theme.colors.gray400;
    if ($colorClass.includes("black")) return theme.colors.black;
    return theme.colors.gray200;
  }};
`;

const StExperienceLink = styled(Link)`
  display: block;
  transition: opacity 0.2s;
`;

const StCompanyHeader = styled.h4`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const StDetailBadge = styled.span.attrs({ className: "detail-badge" })`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 400;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  transition: background-color 0.2s;
`;

const StSummaryList = styled.ul`
  list-style-type: disc;
  list-style-position: outside;
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.875rem;
  line-height: 1.625;
  margin-top: 1rem;
  margin-left: 1rem;

  li + li {
    margin-top: 0.5rem;
  }
`;
