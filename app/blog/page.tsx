"use client";

import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import PageIntro from "@/components/common/PageIntro";
import { StContainer, StWrapper } from "@/components/styled/layout.styled";
import { BLOG_POSTS } from "./data";

// 상단 분류 칩: 보여줄 순서를 정해 두고, 글에만 있고 여기 없는 분류는 뒤에 자동으로 붙인다 (새 분류가 누락되지 않게)
const CATEGORY_ORDER = [
  "사용 가이드",
  "생활 팁",
  "서비스 소개",
  "개발 일지",
  "기술 이야기",
];
const CATEGORIES = [
  "전체",
  ...CATEGORY_ORDER.filter((cat) =>
    BLOG_POSTS.some((post) => post.category === cat),
  ),
  ...[...new Set(BLOG_POSTS.map((post) => post.category))].filter(
    (cat) => !CATEGORY_ORDER.includes(cat),
  ),
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("전체");

  const filteredPosts =
    activeCategory === "전체"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === activeCategory);

  return (
    <StContainer>
      <StWideWrapper>
        <PageIntro
          icon="📝"
          title="블로그"
          description={
            "황총무의 실험실에서 겪은 개발 이야기와\n서비스 제작 과정을 기록합니다."
          }
        />

        <StCategoryList>
          {CATEGORIES.map((cat) => (
            <StCategoryTag
              key={cat}
              $active={cat === activeCategory}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </StCategoryTag>
          ))}
        </StCategoryList>

        <StPostList>
          {filteredPosts.map((post) => (
            <Link key={post.id} href={`/blog/${post.id}`}>
              <StPostCard>
                <StPostEmoji>{post.emoji}</StPostEmoji>
                <StPostContent>
                  <StPostMeta>
                    <StCategoryBadge>{post.category}</StCategoryBadge>
                    <StPostDate>{post.date}</StPostDate>
                  </StPostMeta>
                  <StPostTitle>{post.title}</StPostTitle>
                  <StPostSummary>{post.summary}</StPostSummary>
                </StPostContent>
              </StPostCard>
            </Link>
          ))}
        </StPostList>
      </StWideWrapper>
    </StContainer>
  );
}

const StWideWrapper = styled(StWrapper)`
  max-width: ${({ theme }) => theme.layout.maxWidth};
`;

const StCategoryList = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
`;

const StCategoryTag = styled.button<{ $active: boolean }>`
  padding: 0.45rem 0.85rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  font-weight: ${({ $active }) => ($active ? 800 : 600)};
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.semantic.primary : theme.semantic.border};
  background-color: ${({ $active, theme }) =>
    $active ? theme.semantic.primary : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.white : theme.semantic.subText};
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;

  &:hover {
    color: ${({ $active, theme }) =>
      $active ? theme.colors.white : theme.semantic.text};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const StPostList = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0.75rem;

  /* 넓은 화면에서는 카드 두 줄로 — 1024px 폭을 그대로 쓴다 */
  @media ${({ theme }) => theme.media.desktop} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  a {
    display: block;
    height: 100%;
  }
`;

const StPostCard = styled.article`
  height: 100%;
  background: ${({ theme }) => theme.colors.white};
  padding: 1.25rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.semantic.border};
  display: flex;
  gap: 0.85rem;
  align-items: flex-start;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.semantic.bg};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const StPostEmoji = styled.div`
  font-size: 1.25rem;
  line-height: 1;
  flex-shrink: 0;
  width: 2.4rem;
  height: 2.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.semantic.bg};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  border-radius: 0.8rem;
`;

const StPostContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const StPostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const StCategoryBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  padding: 0.15rem 0.5rem;
  border-radius: 0.4rem;
`;

const StPostDate = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StPostTitle = styled.h3`
  font-size: 1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.semantic.text};
  margin-bottom: 0.4rem;
  line-height: 1.4;
`;

const StPostSummary = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.semantic.subText};
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
