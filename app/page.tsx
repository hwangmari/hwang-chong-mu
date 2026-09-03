"use client"; // styled-components를 쓰는 화면

import Link from "next/link";
import styled from "styled-components";
import ThemeToggleButton from "@/components/common/ThemeToggleButton";
import HeroSituations from "@/components/home/HeroSituations";
import LoginInvite from "@/components/home/LoginInvite";
import { MENU_CATEGORIES } from "@/lib/menuCategories";
import { BLOG_POSTS } from "@/app/blog/data";
import { displayFont } from "@/lib/fonts";

// 첫 화면 오른쪽 "자주 쓰는 도구" 3개 — 링크로 가장 많이 공유되는 것들
const FREQUENT = [
  { href: "/meeting", icon: "📅", title: "약속 잡기", desc: "안 되는 날만 찍으면 끝" },
  { href: "/calc", icon: "💸", title: "여행 경비 계산기", desc: "송금 횟수까지 줄여서" },
  { href: "/overtime", icon: "🌙", title: "야근 계산기", desc: "보상휴가 일수까지 자동" },
];

const TOOL_COUNT = MENU_CATEGORIES.reduce((n, c) => n + c.items.length, 0);
const RECENT_POSTS = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 3);

export default function Home() {
  return (
    <StMain className={displayFont.variable}>
      {/* 1. 첫 화면: 상황 → 도구 */}
      <StHeroBand>
        <StInner>
          <StHeroTop>
            <ThemeToggleButton />
          </StHeroTop>
          <HeroSituations />
          <StFrequent aria-label="자주 쓰는 도구">
            <StFrequentLabel>자주 쓰는 도구</StFrequentLabel>
            <StFrequentRow>
              {FREQUENT.map((t) => (
                <StFrequentCard key={t.href} href={t.href}>
                  <StFrequentIcon aria-hidden="true">{t.icon}</StFrequentIcon>
                  <div>
                    <strong>{t.title}</strong>
                    <span>{t.desc}</span>
                  </div>
                  <StArrow aria-hidden="true">→</StArrow>
                </StFrequentCard>
              ))}
            </StFrequentRow>
          </StFrequent>
          <StFacts>
            <span>
              도구 <b>{TOOL_COUNT}개</b>
            </span>
            <span>
              안내 글 <b>{BLOG_POSTS.length}편</b>
            </span>
            <span>로그인 없이 링크만으로 함께 써요</span>
          </StFacts>
        </StInner>
      </StHeroBand>

      {/* 2. 계정 안내: 로그인 없이도 되지만, 로그인하면 이어서 */}
      <StInner as="section" aria-label="계정 안내">
        <LoginInvite />
      </StInner>

      {/* 3. 모든 도구 (분류 유지) */}
      <StInner as="section" aria-labelledby="all-tools">
        <StSectionHead>
          <StSectionTitle id="all-tools" className="display">
            모든 도구
          </StSectionTitle>
          <StSectionHint>상황별로 골라 쓰세요. 대부분 로그인 없이 바로 열려요.</StSectionHint>
        </StSectionHead>
        <StCategoryGrid>
          {MENU_CATEGORIES.map((category) => (
            <StCategory key={category.title}>
              <StCategoryTitle>
                <span aria-hidden="true">{category.emoji}</span> {category.title}
              </StCategoryTitle>
              <StToolList>
                {category.items.map((item) => (
                  <StTool key={item.href} href={item.href}>
                    <StToolIcon aria-hidden="true">{item.icon}</StToolIcon>
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.desc}</span>
                    </div>
                  </StTool>
                ))}
              </StToolList>
            </StCategory>
          ))}
        </StCategoryGrid>
      </StInner>

      {/* 4. 최근 글 */}
      <StInner as="section" aria-labelledby="recent-posts">
        <StSectionHead>
          <StSectionTitle id="recent-posts" className="display">
            최근 글
          </StSectionTitle>
          <StMoreLink href="/blog">블로그 전체 보기 →</StMoreLink>
        </StSectionHead>
        <StPostGrid>
          {RECENT_POSTS.map((post) => (
            <StPost key={post.id} href={`/blog/${post.id}`}>
              <StPostMeta>
                <span aria-hidden="true">{post.emoji}</span> {post.category} · {post.date.replaceAll("-", ".")}
              </StPostMeta>
              <strong>{post.title}</strong>
              <p>{post.summary}</p>
            </StPost>
          ))}
        </StPostGrid>
      </StInner>

      {/* 5. 소개 + 문의 (짧게) */}
      <StInner as="section" aria-labelledby="about">
        <StAbout>
          <div>
            <StSectionTitle id="about" className="display">
              황총무의 실험실이란?
            </StSectionTitle>
            <p>
              약속 날짜를 정하고, 모임 뒤 정산하고, 야근 시간을 세는 순간마다 &ldquo;이거 자동으로 해주는 게 있으면
              좋겠다&rdquo;에서 시작한 개인 프로젝트예요. 쓸수록 편해지는 도구를 목표로 꾸준히 실험하고 있어요.
            </p>
          </div>
          <StAboutLinks>
            <Link href="/my">✨ 내 서비스 요약 (한 계정으로 모아 보기)</Link>
            <Link href="/portfolio">👩‍💻 만든 사람</Link>
            <a href="mailto:hwangmari@naver.com">✉️ 문의 · 건의 보내기</a>
          </StAboutLinks>
        </StAbout>
      </StInner>
    </StMain>
  );
}

/* ===== 스타일 ===== */

const StMain = styled.main`
  background: ${({ theme }) => theme.semantic.bg};
  display: flex;
  flex-direction: column;
  gap: 3rem;
  padding-bottom: 2rem;

  /* 제목 글꼴은 이 화면의 제목에만 */
  .display {
    font-family: var(--font-display), ui-sans-serif, system-ui, sans-serif;
  }
`;

const StInner = styled.div`
  width: 100%;
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 1rem;
`;

const StHeroBand = styled.header`
  background: ${({ theme }) => theme.colors.white};
  border-bottom: 1px solid ${({ theme }) => theme.semantic.border};
  padding: 1.5rem 0 1.75rem;
`;

const StHeroTop = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const StFrequent = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 2rem;
`;

const StFrequentRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.6rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const StFrequentLabel = styled.p`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.subText};
  letter-spacing: 0.04em;
`;

const StFrequentCard = styled(Link)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.semantic.bg};
  text-decoration: none;
  color: ${({ theme }) => theme.semantic.text};
  transition: border-color 0.15s ease, transform 0.15s ease;

  strong {
    display: block;
    font-size: 0.95rem;
  }
  /* 설명 글자에만 (아이콘 상자도 span이라 'div > span'으로 좁힌다) */
  div > span {
    display: block;
    font-size: 0.78rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
  &:hover {
    border-color: ${({ theme }) => theme.semantic.primary};
    transform: translateX(2px);
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StFrequentIcon = styled.span`
  flex: none;
  width: 2.4rem;
  height: 2.4rem;
  border-radius: 0.7rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 1.2rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
`;

const StArrow = styled.span`
  color: ${({ theme }) => theme.semantic.subText};
  font-weight: 700;
`;

const StFacts = styled.p`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.4rem;
  margin-top: 1.5rem;
  font-size: 0.82rem;
  color: ${({ theme }) => theme.semantic.subText};
  b {
    color: ${({ theme }) => theme.semantic.text};
    font-weight: 800;
  }
`;

const StSectionHead = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1rem;
`;

const StSectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 400;
  color: ${({ theme }) => theme.semantic.text};
`;

const StSectionHint = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.semantic.subText};
`;

const StMoreLink = styled(Link)`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.primary};
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
`;

const StCategoryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const StCategory = styled.div`
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  padding: 1rem;
`;

const StCategoryTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  margin-bottom: 0.6rem;
`;

const StToolList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const StTool = styled(Link)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.7rem;
  padding: 0.55rem 0.5rem;
  border-radius: 0.7rem;
  text-decoration: none;
  color: ${({ theme }) => theme.semantic.text};

  strong {
    display: block;
    font-size: 0.92rem;
  }
  div > span {
    display: block;
    font-size: 0.76rem;
    color: ${({ theme }) => theme.semantic.subText};
  }
  &:hover {
    background: ${({ theme }) => theme.semantic.primaryLight};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: -3px;
  }
`;

const StToolIcon = styled.span`
  flex: none;
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 0.6rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-size: 1.05rem;
  background: ${({ theme }) => theme.semantic.bg};
`;

const StPostGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const StPost = styled(Link)`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding: 1rem 1.1rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;
  text-decoration: none;
  color: ${({ theme }) => theme.semantic.text};

  strong {
    font-size: 1rem;
    line-height: 1.4;
    word-break: keep-all;
  }
  p {
    font-size: 0.82rem;
    line-height: 1.5;
    color: ${({ theme }) => theme.semantic.subText};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  &:hover {
    border-color: ${({ theme }) => theme.semantic.primary};
  }
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StPostMeta = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.semantic.primary};
`;

const StAbout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 2rem;
  padding: 1.5rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 1rem;

  h2 {
    margin-bottom: 0.6rem;
  }
  p {
    font-size: 0.92rem;
    line-height: 1.7;
    color: ${({ theme }) => theme.semantic.subText};
    word-break: keep-all;
  }

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`;

const StAboutLinks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  justify-content: center;

  a {
    display: block;
    padding: 0.7rem 0.9rem;
    border-radius: 0.7rem;
    background: ${({ theme }) => theme.semantic.bg};
    color: ${({ theme }) => theme.semantic.text};
    font-size: 0.88rem;
    font-weight: 700;
    text-decoration: none;
  }
  a:hover {
    background: ${({ theme }) => theme.semantic.primaryLight};
  }
`;
