"use client";

import Link from "next/link";
import styled from "styled-components";

interface BlogGuideLinkProps {
  guideId: string;
  title?: string;
  subtitle?: string;
}

export default function BlogGuideLink({
  guideId,
  title = "자세한 사용 가이드 보러 가기",
  subtitle = "단계별 사용법과 꿀팁을 블로그에서 확인해보세요",
}: BlogGuideLinkProps) {
  return (
    <StLink href={`/blog/${guideId}`}>
      <span className="emoji">📖</span>
      <span className="text">
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </span>
      <span className="arrow">→</span>
    </StLink>
  );
}

const StLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: ${({ theme }) => theme.colors.blue50};
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  border-radius: 1rem;
  text-decoration: none;
  transition: all 0.2s;

  .emoji {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
    min-width: 0;

    strong {
      font-size: 0.9rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.blue600};
    }

    small {
      font-size: 0.75rem;
      color: ${({ theme }) => theme.colors.gray500};
      line-height: 1.4;
    }
  }

  .arrow {
    font-size: 1.1rem;
    font-weight: 800;
    color: ${({ theme }) => theme.colors.blue600};
    transition: transform 0.2s;
    flex-shrink: 0;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.blue100};
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.1);

    .arrow {
      transform: translateX(3px);
    }
  }
`;
