"use client";

import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StWrapper,
} from "@/components/styled/layout.styled";
import { BLOG_POSTS } from "./data";

const CATEGORIES = ["전체", "서비스 소개", "개발 일지", "기술 이야기"];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState("전체");

  const filteredPosts =
    activeCategory === "전체"
      ? BLOG_POSTS
      : BLOG_POSTS.filter((post) => post.category === activeCategory);

  return (
    <StContainer>
      <StWrapper>
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
      </StWrapper>
    </StContainer>
  );
}

const StCategoryList = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const StCategoryTag = styled.button<{ $active: boolean }>`
  padding: 0.4rem 1rem;
  border-radius: 9999px;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.blue600 : theme.colors.gray200};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.white};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.white : theme.colors.gray600};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue500};
    color: ${({ $active, theme }) =>
      $active ? theme.colors.white : theme.colors.blue600};
  }
`;

const StPostList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StPostCard = styled.article`
  background: ${({ theme }) => theme.colors.white};
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  border: 1px solid ${({ theme }) => theme.semantic.border};
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.blue200};
  }

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const StPostEmoji = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.75rem;
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
  border-radius: 4px;
`;

const StPostDate = styled.span`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StPostTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.4rem;
  line-height: 1.4;
`;

const StPostSummary = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;
