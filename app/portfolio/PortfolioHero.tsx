"use client";

// 첫 화면. 누구인지 / 무엇을 하는 사람인지 / 숫자 / 어디로 갈지를 한 화면에 담는다.
import Image from "next/image";
import Link from "next/link";
import styled from "styled-components";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { displayFont } from "@/lib/fonts";
import { careerYears, heroFacts } from "./careerFacts";
import AnimatedTitle from "./AnimatedTitle";
import CareerRibbon from "./CareerRibbon";

export default function PortfolioHero() {
  return (
    <StHero className={displayFont.variable}>
      <StInner>
        <StTop>
          <StLeft>
            <StEyebrow>
              <span className="badge">Frontend Developer</span>
              <span className="name">황혜경</span>
            </StEyebrow>

            <AnimatedTitle />

            {/* 아래 한 줄은 data/experiences.tsx의 회사·역할·요약에서 뽑아 만든 문장입니다 */}
            <StTagline>
              웹 표준 마크업에서 시작해 프론트엔드로, 포털·커머스·협업·보험 서비스를{" "}
              <b>{careerYears}년째</b> 만들고 있습니다.
            </StTagline>

            <StCtaRow>
              <StPrimaryCta href="#career">경력 보기</StPrimaryCta>
              <StSecondaryCta href="#toy-projects">토이 프로젝트</StSecondaryCta>
            </StCtaRow>

            <StLinkRow>
              <StExternal href="https://github.com/hwangmari/" target="_blank">
                GitHub <OpenInNewIcon fontSize="inherit" />
              </StExternal>
              <StExternal href="https://blog.naver.com/hwangmari" target="_blank">
                Blog <OpenInNewIcon fontSize="inherit" />
              </StExternal>
              <StExternal href="mailto:hwangmari@naver.com">Email</StExternal>
            </StLinkRow>
          </StLeft>

          <StPhoto>
            <Image src="/images/hwang.png" alt="황혜경 프로필 사진" fill sizes="180px" priority />
          </StPhoto>
        </StTop>

        <StFacts aria-label="경력 요약 숫자">
          {heroFacts.map((fact) => (
            <StFact key={fact.label}>
              <span className="label">{fact.label}</span>
              <strong>
                {fact.value}
                <em>{fact.unit}</em>
              </strong>
            </StFact>
          ))}
        </StFacts>

        <StRibbonSlot>
          <CareerRibbon />
        </StRibbonSlot>

      </StInner>
    </StHero>
  );
}

const StHero = styled.header`
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
`;

const StInner = styled.div`
  position: relative;
  z-index: 1;
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 2.25rem 1.5rem 1.85rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    padding: 1.85rem 1.15rem 1.6rem;
    gap: 1.35rem;
  }
`;

const StTop = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 2rem;
`;

const StLeft = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
`;

const StEyebrow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;

  .badge {
    padding: 0.3rem 0.7rem;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.gray900};
    color: ${({ theme }) => theme.colors.white};
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.02em;
  }

  .name {
    font-size: 0.95rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
  }
`;

const StTagline = styled.p`
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.65;
  color: ${({ theme }) => theme.colors.gray600};
  max-width: 40rem;
  word-break: keep-all;
  text-wrap: pretty;

  b {
    color: ${({ theme }) => theme.semantic.text};
    font-weight: 800;
  }

  @media ${({ theme }) => theme.media.mobile} {
    font-size: 0.94rem;
  }
`;

const StCtaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 0.15rem;
`;

const ctaBase = `
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.75rem 1.2rem;
  border-radius: 0.85rem;
  font-size: 0.95rem;
  font-weight: 800;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
`;

const StPrimaryCta = styled(Link)`
  ${ctaBase}
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 20px -10px ${({ theme }) => theme.semantic.primary};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

const StSecondaryCta = styled(Link)`
  ${ctaBase}
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.text};
  border: 1px solid ${({ theme }) => theme.semantic.border};

  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StLinkRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  font-size: 0.9rem;
  font-weight: 700;
`;

const StExternal = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.28rem;
  color: ${({ theme }) => theme.colors.gray600};
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.semantic.primary};
    text-decoration: underline;
    text-underline-offset: 4px;
  }
  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 3px;
    border-radius: 4px;
  }
`;

const StPhoto = styled.div`
  position: relative;
  width: 168px;
  height: 168px;
  flex-shrink: 0;
  border-radius: 1.4rem;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.gray100};

  img {
    object-fit: cover;
  }

  @media ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

const StFacts = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.6rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const StFact = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.8rem 0.9rem;
  border-radius: 0.85rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  background: ${({ theme }) => theme.colors.gray50};

  .label {
    font-size: 0.74rem;
    font-weight: 700;
    color: ${({ theme }) => theme.semantic.subText};
  }

  strong {
    font-size: 1.55rem;
    font-weight: 800;
    color: ${({ theme }) => theme.semantic.text};
    font-variant-numeric: tabular-nums;
    line-height: 1.1;
  }

  em {
    font-style: normal;
    font-size: 0.9rem;
    margin-left: 0.1rem;
    color: ${({ theme }) => theme.colors.gray500};
  }
`;

const StRibbonSlot = styled.div`
  margin-top: 0.15rem;
`;
