"use client";

import styled from "styled-components";
import {
  StContainer,
  StWrapper,
  StSection,
} from "@/components/styled/layout.styled";
import type { BlogPost } from "../data";

interface BlogArticleViewProps {
  post: BlogPost;
}

export default function BlogArticleView({ post }: BlogArticleViewProps) {
  return (
    <StContainer>
      <StWideWrapper>
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
              if (block.type === "image") {
                return (
                  <StImageBlock key={i}>
                    {block.src ? (
                      <StImage src={block.src} alt={block.alt ?? ""} />
                    ) : (
                      <StImagePlaceholder>
                        🖼️ {block.alt ?? "이미지 자리"}
                      </StImagePlaceholder>
                    )}
                    {block.caption && <StCaption>{block.caption}</StCaption>}
                  </StImageBlock>
                );
              }
              if (block.type === "skillCards" && block.cards) {
                return (
                  <StSkillGrid key={i}>
                    {block.cards.map((card) => (
                      <StSkillCard key={card.name} $dark={block.tone === "dark"}>
                        <code>{card.name}</code>
                        <strong>{card.title}</strong>
                        <p>{card.desc}</p>
                        <StSkillExample $dark={block.tone === "dark"}>
                          &ldquo;{card.example}&rdquo;
                        </StSkillExample>
                      </StSkillCard>
                    ))}
                  </StSkillGrid>
                );
              }
              if (block.type === "link" && block.href) {
                return (
                  <StLinkButton
                    key={i}
                    href={block.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {block.label ?? block.href}
                  </StLinkButton>
                );
              }
              return null;
            })}
          </StContent>
        </StSection>
      </StWideWrapper>
    </StContainer>
  );
}

const StWideWrapper = styled(StWrapper)`
  max-width: ${({ theme }) => theme.layout.maxWidth};
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
  white-space: pre-line;
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

const StImageBlock = styled.figure`
  margin: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StImage = styled.img`
  width: 100%;
  height: auto;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StImagePlaceholder = styled.div`
  width: 100%;
  min-height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px dashed ${({ theme }) => theme.colors.gray200};
  border-radius: 0.75rem;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.9rem;
  text-align: center;
  padding: 1rem;
`;

const StCaption = styled.figcaption`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray400};
  text-align: center;
  line-height: 1.5;
`;

const StLinkButton = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.9rem 1.25rem;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.blue600};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
  transition: all 0.2s;
  align-self: stretch;
  text-align: center;

  &:hover {
    background: ${({ theme }) => theme.colors.blue500};
    transform: translateY(-1px);
    box-shadow: 0 8px 15px -3px rgba(0, 0, 0, 0.12);
  }

  &:active {
    transform: translateY(0);
  }
`;

/* 스킬 카드 격자: 1024px 이상 3열, 640px 이상 2열, 폰 1열 */
const StSkillGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
  gap: 1rem;
  margin: 0.5rem 0 1.5rem;
`;

const StSkillCard = styled.div<{ $dark: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 1.25rem 1.25rem 1.1rem;
  border-radius: 1rem;
  background: ${({ $dark, theme }) => ($dark ? theme.colors.gray900 : theme.colors.white)};
  border: 1px solid ${({ $dark, theme }) => ($dark ? theme.colors.gray900 : theme.semantic.border)};
  color: ${({ $dark, theme }) => ($dark ? theme.colors.white : theme.semantic.text)};

  code {
    font-family: ui-monospace, "SF Mono", Menlo, monospace;
    font-size: 0.82rem;
    font-weight: 700;
    color: ${({ $dark, theme }) => ($dark ? theme.colors.green500 : theme.colors.orange600)};
  }

  strong {
    font-size: 1.05rem;
    font-weight: 800;
    line-height: 1.35;
    word-break: keep-all;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.65;
    color: ${({ $dark, theme }) => ($dark ? theme.colors.gray300 : theme.colors.gray600)};
    word-break: keep-all;
  }
`;

/* 그대로 붙여 쓰는 예시 문장 — 어두운 상자에 초록 코드체 */
const StSkillExample = styled.div<{ $dark: boolean }>`
  margin-top: auto;
  padding: 0.75rem 0.9rem;
  border-radius: 0.6rem;
  background: ${({ $dark, theme }) => ($dark ? theme.colors.gray800 : theme.colors.gray900)};
  border: 1px solid ${({ $dark, theme }) => ($dark ? theme.colors.gray700 : theme.colors.gray900)};
  color: ${({ theme }) => theme.colors.green500};
  font-family: ui-monospace, "SF Mono", Menlo, monospace;
  font-size: 0.82rem;
  line-height: 1.5;
  word-break: keep-all;
`;
