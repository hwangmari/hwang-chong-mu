import styled, { css, keyframes } from "styled-components";
import Link from "next/link";

// === Animations ===
export const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// === Layout Styles ===
export const StSectionContainer = styled.section`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 4rem 1.5rem;
  animation: ${fadeInUp} 0.8s ease-out forwards;
  animation-delay: 0.1s;
  opacity: 0;
`;

export const StGridWrapper = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;

  @media ${({ theme }) => theme.media.desktop} {
    grid-template-columns: 1fr 2fr;
  }
`;

export const StLeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
`;

export const StRightColumn = styled.div``;

export const StSectionTitle = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

// === Skills Styles ===
export const StSkillGroupWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

export const StSkillItem = styled.div``;

export const StSkillTitle = styled.h4`
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

export const StTagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

export const StSkillTag = styled.span<{ $variant: "black" | "gray" | "blue" }>`
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
export const StTimelineList = styled.div`
  border-left: 2px solid ${({ theme }) => theme.colors.gray100};
  margin-left: 0.75rem;
  padding-left: 2rem;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 3rem;
`;

export const StTimelineItem = styled.div`
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

export const StTimelineDot = styled.span<{ $colorClass: string }>`
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

export const StExperienceLink = styled(Link)`
  display: block;
  transition: opacity 0.2s;
`;

export const StCompanyHeader = styled.h4`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

export const StDetailBadge = styled.span.attrs({ className: "detail-badge" })`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-weight: 400;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  transition: background-color 0.2s;
`;

export const StSummaryList = styled.ul`
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
