"use client";

import { experiences } from "@/data/experiences";
import Typography from "@/components/common/Typography";
import {
  StSectionContainer,
  StGridWrapper,
  StLeftColumn,
  StSectionTitle,
  StSkillGroupWrapper,
  StSkillItem,
  StSkillTitle,
  StTagList,
  StSkillTag,
  StRightColumn,
  StTimelineList,
  StTimelineItem,
  StTimelineDot,
  StExperienceLink,
  StCompanyHeader,
  StDetailBadge,
  StSummaryList,
} from "./ResumeSection.styled";

export default function ResumeSection() {
  return (
    <StSectionContainer>
      <StGridWrapper>
        <StLeftColumn>
          {/* 🛠 Skills */}
          <div>
            <StSectionTitle>
              <Typography variant="h2" as="h3">
                🛠 Skills
              </Typography>
            </StSectionTitle>

            <StSkillGroupWrapper>
              {/* 1. Languages & Frameworks */}
              <StSkillItem>
                <StSkillTitle>Languages & Frameworks</StSkillTitle>
                <StTagList>
                  {["TypeScript", "Next.js", "React", "Svelte", "Angular"].map(
                    (skill) => (
                      <StSkillTag key={skill} $variant="black">
                        {skill}
                      </StSkillTag>
                    ),
                  )}
                </StTagList>
              </StSkillItem>

              {/* 2. Styling & UI */}
              <StSkillItem>
                <StSkillTitle>Styling & UI</StSkillTitle>
                <StTagList>
                  {[
                    "SCSS (CSS Modules)",
                    "Styled Components",
                    "Tailwind CSS",
                    "Ant Design",
                    "Adorable CSS",
                    "Responsive Web",
                    "Cross Browsing",
                  ].map((skill) => (
                    <StSkillTag key={skill} $variant="gray">
                      {skill}
                    </StSkillTag>
                  ))}
                </StTagList>
              </StSkillItem>

              {/* 3. Build & Tools */}
              <StSkillItem>
                <StSkillTitle>Infra & Tools</StSkillTitle>
                <StTagList>
                  {[
                    "Monorepo (Turbo)",
                    "Git",
                    "Slack",
                    "Jira",
                    "Wiki",
                    "Agile",
                    "Figma",
                    "Zeplin",
                  ].map((skill) => (
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

        <StRightColumn>
          <StSectionTitle>
            <Typography variant="h2" as="h2">
              💼 Experience
            </Typography>
          </StSectionTitle>

          <StTimelineList>
            {experiences.map((exp) => (
              <StTimelineItem key={exp.id}>
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
