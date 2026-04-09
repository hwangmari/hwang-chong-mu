"use client";

import { useParams } from "next/navigation";
import styled from "styled-components";
import {
  StContainer,
  StWrapper,
  StSection,
} from "@/components/styled/layout.styled";
import { BLOG_POSTS } from "../data";

export default function BlogDetailPage() {
  const { id } = useParams<{ id: string }>();
  const post = BLOG_POSTS.find((p) => p.id === id);

  if (!post) {
    return (
      <StContainer>
        <StWrapper>
          <StEmpty>존재하지 않는 글입니다.</StEmpty>
        </StWrapper>
      </StContainer>
    );
  }

  return (
    <StContainer>
      <StWrapper>
        <StArticleHeader>
          <StEmoji>{post.emoji}</StEmoji>
          <StCategoryBadge>{post.category}</StCategoryBadge>
          <StTitle>{post.title}</StTitle>
          <StMeta>{post.date}</StMeta>
        </StArticleHeader>

        <StSection>
          <StContent>
            {post.content.map((block, i) => {
              if (block.type === "heading") {
                return <StHeading key={i}>{block.text}</StHeading>;
              }
              if (block.type === "paragraph") {
                return <StParagraph key={i}>{block.text}</StParagraph>;
              }
              if (block.type === "list") {
                return (
                  <StList key={i}>
                    {block.items!.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </StList>
                );
              }
              if (block.type === "quote") {
                return <StQuote key={i}>{block.text}</StQuote>;
              }
              if (block.type === "code") {
                return <StCode key={i}>{block.text}</StCode>;
              }
              return null;
            })}
          </StContent>
        </StSection>
      </StWrapper>
    </StContainer>
  );
}

const StEmpty = styled.div`
  text-align: center;
  padding: 4rem 0;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 1.1rem;
`;

const StArticleHeader = styled.div`
  text-align: center;
  margin-bottom: 2rem;
`;

const StEmoji = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const StCategoryBadge = styled.span`
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  margin-bottom: 1rem;
`;

const StTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  line-height: 1.4;
  margin-bottom: 0.75rem;
`;

const StMeta = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StHeading = styled.h2`
  font-size: 1.15rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-top: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StParagraph = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.8;
`;

const StList = styled.ul`
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  li {
    font-size: 0.95rem;
    color: ${({ theme }) => theme.colors.gray600};
    line-height: 1.7;
  }
`;

const StQuote = styled.blockquote`
  border-left: 3px solid ${({ theme }) => theme.colors.blue500};
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.colors.blue50};
  border-radius: 0 0.5rem 0.5rem 0;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.gray700};
  line-height: 1.7;
  font-style: italic;
`;

const StCode = styled.pre`
  background: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.gray100};
  padding: 1.25rem;
  border-radius: 0.75rem;
  font-size: 0.85rem;
  line-height: 1.6;
  overflow-x: auto;
  font-family: "Fira Code", "Consolas", monospace;
`;
