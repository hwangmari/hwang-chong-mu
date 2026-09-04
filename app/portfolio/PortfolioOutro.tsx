"use client";

// 마지막 단: 학력과 연락처.
import Link from "next/link";
import styled from "styled-components";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { displayFont } from "@/lib/fonts";
import { Reveal } from "./motion";

export default function PortfolioOutro() {
  return (
    <StSection className={displayFont.variable}>
      <StInner>
        <Reveal>
          <StGrid>
            <StBlock>
              <h2>학력</h2>
              <strong>강원대학교 (춘천)</strong>
              <span>미술학과 서양화 전공</span>
              <span className="muted">2006 - 2010</span>
            </StBlock>

            <StBlock>
              <h2>연락처</h2>
              <StLinks>
                <Link href="mailto:hwangmari@naver.com">hwangmari@naver.com</Link>
                <Link href="https://github.com/hwangmari/" target="_blank">
                  GitHub <OpenInNewIcon fontSize="inherit" />
                </Link>
                <Link href="https://blog.naver.com/hwangmari" target="_blank">
                  Blog <OpenInNewIcon fontSize="inherit" />
                </Link>
              </StLinks>
            </StBlock>
          </StGrid>
        </Reveal>

        <StCopyright>© 2026 Hwang Hye kyeong. All rights reserved.</StCopyright>
      </StInner>
    </StSection>
  );
}

const StSection = styled.footer`
  background: ${({ theme }) => theme.colors.white};
  border-top: 1px solid ${({ theme }) => theme.semantic.border};
  padding: 2.2rem 0 2rem;
`;

const StInner = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 1.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    padding: 0 1.15rem;
  }
`;

const StGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const StBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;

  h2 {
    font-family: var(--font-display), ui-sans-serif, system-ui, sans-serif;
    font-weight: 400;
    font-size: 1.25rem;
    color: ${({ theme }) => theme.semantic.text};
    margin: 0 0 0.4rem;
  }

  strong {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.semantic.text};
  }

  span {
    font-size: 0.85rem;
    color: ${({ theme }) => theme.colors.gray600};
  }

  .muted {
    font-size: 0.78rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
`;

const StLinks = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.88rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray600};

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
  }
`;

const StCopyright = styled.p`
  margin: 1.5rem 0 0;
  text-align: center;
  font-size: 0.78rem;
  color: ${({ theme }) => theme.semantic.subText};
`;
