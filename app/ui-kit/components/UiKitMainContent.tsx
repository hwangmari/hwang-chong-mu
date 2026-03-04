"use client";

import styled from "styled-components";
import {
  Input,
  Typography,
  TYPOGRAPHY_VARIANTS,
  uiTheme,
} from "@hwangchongmu/ui";
import { importExample, providerExample } from "../content";
import { ButtonDocSection } from "./ButtonDocSection";

interface UiKitMainContentProps {
  copiedCode: string | null;
  onCopy: (label: string, value: string) => void;
}

export function UiKitMainContent({
  copiedCode,
  onCopy,
}: UiKitMainContentProps) {
  const colorEntries = Object.entries(uiTheme.colors);

  return (
    <MainColumn>
      <DocSection id="overview">
        <SectionHeading>
          <Typography as="h2" variant="h2">
            소개
          </Typography>
          <Typography color="gray500">
            황총무 내부 공통 컴포넌트를 분리해서 다른 프로젝트에서도 재사용할 수
            있도록 만든 UI 패키지입니다.
          </Typography>
        </SectionHeading>
        <IntroGrid>
          <InfoCard>
            <Typography as="h3" variant="h4">
              포함 범위
            </Typography>
            <BulletList>
              <li>디자인 토큰과 테마</li>
              <li>공용 Provider와 글로벌 스타일</li>
              <li>재사용 가능한 기본 컴포넌트</li>
            </BulletList>
          </InfoCard>
          <InfoCard>
            <Typography as="h3" variant="h4">
              문서 구조
            </Typography>
            <BulletList>
              <li>좌측: 소개, 파운데이션, 컴포넌트 이동</li>
              <li>가운데: 실제 예제와 코드</li>
              <li>우측: Button 세부 목차 바로가기</li>
            </BulletList>
          </InfoCard>
        </IntroGrid>
      </DocSection>

      <DocSection id="getting-started">
        <SectionHeading>
          <Typography as="h2" variant="h2">
            사용방법
          </Typography>
          <Typography color="gray500">
            패키지를 import 하고, 앱 루트에 Provider를 연결한 뒤 컴포넌트를
            사용합니다.
          </Typography>
        </SectionHeading>
        <CodeCard>
          <CodeHeader>
            <Typography as="h3" variant="label" color="gray500">
              Import
            </Typography>
            <CopyButton type="button" onClick={() => onCopy("import", importExample)}>
              {copiedCode === "import" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{importExample}</code>
          </CodeBlock>
        </CodeCard>
        <CodeCard>
          <CodeHeader>
            <Typography as="h3" variant="label" color="gray500">
              Provider
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("provider", providerExample)}
            >
              {copiedCode === "provider" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{providerExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>

      <DocSection id="foundation-colors">
        <SectionHeading>
          <Typography as="h2" variant="h2">
            Foundation / Colors
          </Typography>
          <Typography color="gray500">
            `uiTheme.colors` 기준의 색상 토큰입니다.
          </Typography>
        </SectionHeading>
        <SwatchGrid>
          {colorEntries.map(([name, value]) => (
            <SwatchCard key={name}>
              <Swatch style={{ background: value }} />
              <Typography variant="label">{name}</Typography>
              <TokenValue>{value}</TokenValue>
            </SwatchCard>
          ))}
        </SwatchGrid>
      </DocSection>

      <DocSection id="foundation-typography">
        <SectionHeading>
          <Typography as="h2" variant="h2">
            Foundation / Typography
          </Typography>
          <Typography color="gray500">
            기본 텍스트 스케일입니다.
          </Typography>
        </SectionHeading>
        <PreviewCard>
          <PreviewStack>
            {TYPOGRAPHY_VARIANTS.map((variant) => (
              <Typography
                key={variant}
                variant={variant}
                color={variant.startsWith("h") ? "gray900" : "gray600"}
              >
                {variant} preview text
              </Typography>
            ))}
          </PreviewStack>
        </PreviewCard>
      </DocSection>

      <ButtonDocSection copiedCode={copiedCode} onCopy={onCopy} />

      <DocSection id="input">
        <SectionHeading>
          <Typography as="h2" variant="h2">
            Component / Input
          </Typography>
          <Typography color="gray500">
            라벨, 우측 보조 문구, 오류 상태를 가진 기본 입력 필드입니다.
          </Typography>
        </SectionHeading>
        <PreviewCard>
          <PreviewStack>
            <Input label="워크스페이스 이름" placeholder="예: Team Dashboard" />
            <Input
              label="배포 채널"
              rightLabel="필수"
              placeholder="production"
              isError
            />
          </PreviewStack>
        </PreviewCard>
      </DocSection>

      <DocSection id="typography">
        <SectionHeading>
          <Typography as="h2" variant="h2">
            Component / Typography
          </Typography>
          <Typography color="gray500">
            타이포 스케일과 색상 토큰을 연결하는 기본 텍스트 컴포넌트입니다.
          </Typography>
        </SectionHeading>
        <PreviewCard>
          <PreviewStack>
            {TYPOGRAPHY_VARIANTS.map((variant) => (
              <Typography
                key={variant}
                variant={variant}
                color={variant.startsWith("h") ? "gray900" : "gray600"}
              >
                {variant} preview text
              </Typography>
            ))}
          </PreviewStack>
        </PreviewCard>
      </DocSection>
    </MainColumn>
  );
}

const MainColumn = styled.div`
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  gap: 2rem;
`;

const DocSection = styled.section`
  scroll-margin-top: calc(3.5rem + 1.25rem);
  display: grid;
  gap: 1rem;
`;

const SectionHeading = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const IntroGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
`;

const PreviewCard = styled(InfoCard)``;

const PreviewStack = styled.div`
  display: grid;
  gap: 1rem;
`;

const CodeCard = styled.div`
  display: grid;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.gray950};
  color: ${({ theme }) => theme.colors.gray100};
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
`;

const CopyButton = styled.button`
  padding: 0.55rem 0.85rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const CodeBlock = styled.pre`
  margin: 0;
  overflow-x: auto;

  code {
    white-space: pre;
    font-size: 0.84rem;
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.gray100};
  }
`;

const SwatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SwatchCard = styled.div`
  display: grid;
  gap: 0.45rem;
  padding: 0.85rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
`;

const Swatch = styled.div`
  height: 4rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
`;

const TokenValue = styled.code`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray500};
  word-break: break-all;
`;

const BulletList = styled.ul`
  display: grid;
  gap: 0.5rem;
  margin: 0;
  padding-left: 1.1rem;

  li {
    color: ${({ theme }) => theme.colors.gray700};
    line-height: 1.65;
  }
`;
