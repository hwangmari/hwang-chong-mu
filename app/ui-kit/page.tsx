"use client";

import { useState } from "react";
import styled from "styled-components";
import {
  Button,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  Input,
  Typography,
  TYPOGRAPHY_VARIANTS,
  uiTheme,
} from "@hwangchongmu/ui";

const importExample =
  'import { Button, Input, Typography } from "@hwangchongmu/ui"';
const providerExample = 'import { UiProvider } from "@hwangchongmu/ui"';
const componentCatalog = [
  {
    id: "button",
    name: "Button",
    importName: "Button",
    description: "액션 버튼. variant, size, fullWidth 조합을 제공합니다.",
    code: `import { Button } from "@hwangchongmu/ui";

export function Example() {
  return (
    <Button variant="solid" size="md">
      저장하기
    </Button>
  );
}`,
    props: [
      "variant: solid | subtle | ghost",
      "size: sm | md | lg",
      "fullWidth?: boolean",
      "disabled?: boolean",
    ],
  },
  {
    id: "input",
    name: "Input",
    importName: "Input",
    description: "라벨/오류 상태를 포함한 기본 입력 필드입니다.",
    code: `import { Input } from "@hwangchongmu/ui";

export function Example() {
  return (
    <Input
      label="워크스페이스 이름"
      placeholder="예: Team Dashboard"
    />
  );
}`,
    props: [
      "label?: ReactNode",
      "rightLabel?: ReactNode",
      "isError?: boolean",
      "...input props",
    ],
  },
  {
    id: "typography",
    name: "Typography",
    importName: "Typography",
    description: "타이포 스케일과 색상 토큰을 연결하는 텍스트 컴포넌트입니다.",
    code: `import { Typography } from "@hwangchongmu/ui";

export function Example() {
  return (
    <Typography as="h2" variant="h3" color="gray900">
      섹션 제목
    </Typography>
  );
}`,
    props: [
      "variant: h1 | h2 | h3 | h4 | body1 | body2 | caption | label",
      `color: ${Object.keys(uiTheme.colors).slice(0, 6).join(" | ")} ...`,
      "align?: left | center | right",
      "as?: React.ElementType",
    ],
  },
] as const;

const sectionMenu = componentCatalog.map(({ id, name, description }) => ({
  id,
  name,
  description,
}));

export default function UiKitPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const colorEntries = Object.entries(uiTheme.colors);
  const semanticEntries = Object.entries(uiTheme.semantic);
  const layoutEntries = Object.entries(uiTheme.layout);
  const mediaEntries = Object.entries(uiTheme.media);

  async function handleCopy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCode(label);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === label ? null : current));
      }, 1500);
    } catch {
      setCopiedCode(null);
    }
  }

  return (
    <PageShell>
      <IntroCard>
        <HeroTop>
          <Eyebrow>Shared UI Catalog</Eyebrow>
          <Typography as="h1" variant="h1">
            packages/ui 모음집
          </Typography>
          <Typography color="gray600" variant="body1">
            컴포넌트, 디자인 토큰, 스타일 타입을 한 화면에서 확인하는
            카탈로그입니다. 지금 페이지는 `@hwangchongmu/ui` export를 기준으로
            렌더링됩니다.
          </Typography>
        </HeroTop>
        <HeroMeta>
          <MetaPill>components: 3</MetaPill>
          <MetaPill>
            tokens: {colorEntries.length + semanticEntries.length}
          </MetaPill>
          <MetaPill>provider: UiProvider</MetaPill>
        </HeroMeta>
        <SnippetBlock>
          <SnippetRow>
            <code>{importExample}</code>
            <CopyButton
              type="button"
              onClick={() => handleCopy("imports", importExample)}
            >
              {copiedCode === "imports" ? "Copied" : "Copy"}
            </CopyButton>
          </SnippetRow>
          <SnippetRow>
            <code>{providerExample}</code>
            <CopyButton
              type="button"
              onClick={() => handleCopy("provider", providerExample)}
            >
              {copiedCode === "provider" ? "Copied" : "Copy"}
            </CopyButton>
          </SnippetRow>
        </SnippetBlock>
      </IntroCard>

      <DocsLayout>
        <SideNav>
          <SideNavInner>
            <Typography as="h2" variant="h4">
              Components
            </Typography>
            <MenuList>
              {sectionMenu.map((item) => (
                <MenuItem key={item.id}>
                  <MenuLink href={`#${item.id}`}>
                    <span>{item.name}</span>
                    <small>{item.description}</small>
                  </MenuLink>
                </MenuItem>
              ))}
            </MenuList>
          </SideNavInner>
        </SideNav>

        <ContentColumn>
          <Section>
            <SectionHeading>
              <Typography as="h2" variant="h3">
                Components
              </Typography>
              <Typography color="gray500">
                좌측 메뉴에서 선택하면 각 컴포넌트 섹션으로 바로 이동합니다.
              </Typography>
            </SectionHeading>

            <ComponentSection id="button">
              <PanelHeader>
                <div>
                  <Typography as="h3" variant="h4">
                    Button
                  </Typography>
                  <SubtleText>variants and sizes</SubtleText>
                </div>
                <AnchorHint>#button</AnchorHint>
              </PanelHeader>
              <ComponentGrid>
                <Panel>
                  <FieldStack>
                    {BUTTON_VARIANTS.map((variant) => (
                      <Row key={variant}>
                        {BUTTON_SIZES.map((size) => (
                          <Button
                            key={`${variant}-${size}`}
                            variant={variant}
                            size={size}
                          >
                            {variant}/{size}
                          </Button>
                        ))}
                      </Row>
                    ))}
                  </FieldStack>
                </Panel>
                <OptionPanel>
                  <OptionHeader>
                    <Typography as="h4" variant="label">
                      React Code
                    </Typography>
                    <CopyButton
                      type="button"
                      onClick={() =>
                        handleCopy("button", componentCatalog[0].code)
                      }
                    >
                      {copiedCode === "button" ? "Copied" : "Copy"}
                    </CopyButton>
                  </OptionHeader>
                  <CodeBlock>
                    <code>{componentCatalog[0].code}</code>
                  </CodeBlock>
                  <PropList>
                    {componentCatalog[0].props.map((prop) => (
                      <PropItem key={prop}>
                        <code>{prop}</code>
                      </PropItem>
                    ))}
                  </PropList>
                </OptionPanel>
              </ComponentGrid>
            </ComponentSection>

            <ComponentSection id="input">
              <PanelHeader>
                <div>
                  <Typography as="h3" variant="h4">
                    Input
                  </Typography>
                  <SubtleText>form field states</SubtleText>
                </div>
                <AnchorHint>#input</AnchorHint>
              </PanelHeader>
              <ComponentGrid>
                <Panel>
                  <FieldStack>
                    <Input
                      label="워크스페이스 이름"
                      placeholder="예: Team Dashboard"
                    />
                    <Input
                      label="배포 채널"
                      rightLabel="필수"
                      placeholder="production"
                      isError
                    />
                    <Input
                      label="배포일"
                      type="date"
                      defaultValue="2026-03-03"
                    />
                  </FieldStack>
                </Panel>
                <OptionPanel>
                  <OptionHeader>
                    <Typography as="h4" variant="label">
                      React Code
                    </Typography>
                    <CopyButton
                      type="button"
                      onClick={() =>
                        handleCopy("input", componentCatalog[1].code)
                      }
                    >
                      {copiedCode === "input" ? "Copied" : "Copy"}
                    </CopyButton>
                  </OptionHeader>
                  <CodeBlock>
                    <code>{componentCatalog[1].code}</code>
                  </CodeBlock>
                  <PropList>
                    {componentCatalog[1].props.map((prop) => (
                      <PropItem key={prop}>
                        <code>{prop}</code>
                      </PropItem>
                    ))}
                  </PropList>
                </OptionPanel>
              </ComponentGrid>
            </ComponentSection>

            <ComponentSection id="typography">
              <PanelHeader>
                <div>
                  <Typography as="h3" variant="h4">
                    Typography
                  </Typography>
                  <SubtleText>scale preview</SubtleText>
                </div>
                <AnchorHint>#typography</AnchorHint>
              </PanelHeader>
              <ComponentGrid>
                <Panel>
                  <FieldStack>
                    {TYPOGRAPHY_VARIANTS.map((variant) => (
                      <Typography
                        key={variant}
                        variant={variant}
                        color={variant.startsWith("h") ? "gray900" : "gray600"}
                      >
                        {variant} preview text
                      </Typography>
                    ))}
                  </FieldStack>
                </Panel>
                <OptionPanel>
                  <OptionHeader>
                    <Typography as="h4" variant="label">
                      React Code
                    </Typography>
                    <CopyButton
                      type="button"
                      onClick={() =>
                        handleCopy("typography", componentCatalog[2].code)
                      }
                    >
                      {copiedCode === "typography" ? "Copied" : "Copy"}
                    </CopyButton>
                  </OptionHeader>
                  <CodeBlock>
                    <code>{componentCatalog[2].code}</code>
                  </CodeBlock>
                  <PropList>
                    {componentCatalog[2].props.map((prop) => (
                      <PropItem key={prop}>
                        <code>{prop}</code>
                      </PropItem>
                    ))}
                  </PropList>
                </OptionPanel>
              </ComponentGrid>
            </ComponentSection>
          </Section>

          <Section>
            <SectionHeading>
              <Typography as="h2" variant="h3">
                API Snapshot
              </Typography>
              <Typography color="gray500">
                컴포넌트별 핵심 prop 타입을 요약했습니다.
              </Typography>
            </SectionHeading>
            <ApiGrid>
              {componentCatalog.map((component) => (
                <ApiCard key={component.name}>
                  <Typography as="h3" variant="h4">
                    {component.name}
                  </Typography>
                  <Typography color="gray500">
                    {component.description}
                  </Typography>
                  <CodePill>{component.importName}</CodePill>
                  <PropList>
                    {component.props.map((prop) => (
                      <PropItem key={prop}>
                        <code>{prop}</code>
                      </PropItem>
                    ))}
                  </PropList>
                </ApiCard>
              ))}
            </ApiGrid>
          </Section>

          <Section>
            <SectionHeading>
              <Typography as="h2" variant="h3">
                Theme Tokens
              </Typography>
              <Typography color="gray500">
                `uiTheme` 기준 색상, 시맨틱, 레이아웃, 미디어 값을 한 번에
                확인합니다.
              </Typography>
            </SectionHeading>
            <TokenLayout>
              <TokenPanel>
                <PanelHeader>
                  <Typography as="h3" variant="h4">
                    Colors
                  </Typography>
                  <SubtleText>{colorEntries.length} tokens</SubtleText>
                </PanelHeader>
                <SwatchGrid>
                  {colorEntries.map(([name, value]) => (
                    <SwatchCard key={name}>
                      <Swatch style={{ background: value }} />
                      <Typography variant="label">{name}</Typography>
                      <TokenValue>{value}</TokenValue>
                    </SwatchCard>
                  ))}
                </SwatchGrid>
              </TokenPanel>

              <TokenPanel>
                <PanelHeader>
                  <Typography as="h3" variant="h4">
                    Semantic
                  </Typography>
                  <SubtleText>{semanticEntries.length} tokens</SubtleText>
                </PanelHeader>
                <KeyValueList>
                  {semanticEntries.map(([name, value]) => (
                    <KeyValueItem key={name}>
                      <span>{name}</span>
                      <code>{value}</code>
                    </KeyValueItem>
                  ))}
                </KeyValueList>
              </TokenPanel>

              <TokenPanel>
                <PanelHeader>
                  <Typography as="h3" variant="h4">
                    Layout / Media
                  </Typography>
                  <SubtleText>style types</SubtleText>
                </PanelHeader>
                <KeyValueList>
                  {layoutEntries.map(([name, value]) => (
                    <KeyValueItem key={name}>
                      <span>layout.{name}</span>
                      <code>{value}</code>
                    </KeyValueItem>
                  ))}
                  {mediaEntries.map(([name, value]) => (
                    <KeyValueItem key={name}>
                      <span>media.{name}</span>
                      <code>{value}</code>
                    </KeyValueItem>
                  ))}
                </KeyValueList>
              </TokenPanel>
            </TokenLayout>
          </Section>
        </ContentColumn>
      </DocsLayout>
    </PageShell>
  );
}

const PageShell = styled.main`
  margin: 0 auto;
  padding: 3rem 1.5rem 6rem;
  display: grid;
  gap: 2rem;
`;

const Section = styled.section`
  display: grid;
  gap: 1rem;
`;

const DocsLayout = styled.div`
  display: flex;
  gap: 1.25rem;
  align-items: start;

  @media ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
  }
`;

const IntroCard = styled.section`
  display: grid;
  gap: 1.25rem;
  padding: 2rem;
  border-radius: 2rem;
  background:
    radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.14),
      transparent 28%
    ),
    linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.white},
      ${({ theme }) => theme.colors.blue50}
    );
  border: 1px solid ${({ theme }) => theme.colors.blue100};
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.08);
`;

const Panel = styled.article`
  min-height: 240px;
  display: grid;
  align-content: start;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 1.25rem;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
`;

const TokenPanel = styled(Panel)`
  min-height: auto;
`;

const SideNav = styled.aside`
  position: sticky;
  top: calc(3.5rem + 1rem);
  flex: 0 0 260px;
  max-height: calc(100vh - 5.5rem);
  align-self: flex-start;

  @media ${({ theme }) => theme.media.mobile} {
    position: static;
    max-height: none;
    width: 100%;
  }
`;

const SideNavInner = styled.div`
  display: grid;
  gap: 1rem;
  padding: 1rem;
  max-height: inherit;
  overflow-y: auto;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray300};
    border-radius: 999px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  @media ${({ theme }) => theme.media.mobile} {
    max-height: none;
    overflow: visible;
  }
`;

const MenuList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.55rem;
`;

const MenuItem = styled.li`
  display: block;
`;

const MenuLink = styled.a`
  display: grid;
  gap: 0.2rem;
  padding: 0.85rem 0.95rem;
  border-radius: 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.gray50};
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;

  span {
    font-size: 0.92rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray800};
  }

  small {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray500};
  }

  &:hover {
    transform: translateY(-1px);
    border-color: ${({ theme }) => theme.colors.blue200};
    background: ${({ theme }) => theme.colors.blue50};
  }
`;

const ContentColumn = styled.div`
  display: grid;
  flex: 1 1 auto;
  min-width: 0;
  gap: 2rem;
`;

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`;

const FieldStack = styled.div`
  display: grid;
  gap: 0.9rem;
`;

const HeroTop = styled.div`
  display: grid;
  gap: 0.65rem;
  max-width: 760px;
`;

const Eyebrow = styled.span`
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 0.4rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.blue700};
  background: ${({ theme }) => theme.colors.blue100};
`;

const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
`;

const MetaPill = styled.span`
  padding: 0.65rem 0.9rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray700};
`;

const SnippetBlock = styled.div`
  display: grid;
  gap: 0.65rem;
`;

const SectionHeading = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const SnippetRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: start;

  code {
    display: block;
    overflow-x: auto;
    padding: 0.85rem 1rem;
    border-radius: 1rem;
    background: ${({ theme }) => theme.colors.gray950};
    color: ${({ theme }) => theme.colors.gray100};
    font-size: 0.875rem;
  }
`;

const PanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
`;

const SubtleText = styled.span`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

const ComponentSection = styled.section`
  scroll-margin-top: calc(3.5rem + 1.5rem);
  display: grid;
  gap: 0.9rem;
`;

const ComponentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: 1rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const OptionPanel = styled.article`
  display: grid;
  gap: 0.85rem;
  align-content: start;
  padding: 1.25rem;
  border-radius: 1.25rem;
  background: ${({ theme }) => theme.colors.gray950};
  color: ${({ theme }) => theme.colors.gray100};
  border: 1px solid rgba(148, 163, 184, 0.16);
`;

const OptionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
`;

const CodeBlock = styled.pre`
  margin: 0;
  overflow-x: auto;

  code {
    white-space: pre;
    font-size: 0.82rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.gray100};
  }
`;

const CopyButton = styled.button`
  padding: 0.55rem 0.8rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-size: 0.78rem;
  font-weight: 700;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const AnchorHint = styled.code`
  font-size: 0.78rem;
  color: ${({ theme }) => theme.colors.gray500};
`;

const ApiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const ApiCard = styled.article`
  display: grid;
  gap: 0.85rem;
  padding: 1.4rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
`;

const CodePill = styled.code`
  width: fit-content;
  padding: 0.4rem 0.65rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray100};
  color: ${({ theme }) => theme.colors.gray700};
  font-size: 0.8rem;
  font-weight: 700;
`;

const PropList = styled.ul`
  list-style: none;
  display: grid;
  gap: 0.55rem;
  padding: 0;
  margin: 0;
`;

const PropItem = styled.li`
  padding: 0.75rem 0.85rem;
  border-radius: 0.9rem;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray200};

  code {
    font-size: 0.82rem;
    color: ${({ theme }) => theme.colors.gray700};
  }
`;

const TokenLayout = styled.div`
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 1rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const SwatchGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SwatchCard = styled.div`
  display: grid;
  gap: 0.45rem;
  padding: 0.75rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
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

const KeyValueList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.6rem;
`;

const KeyValueItem = styled.li`
  display: grid;
  gap: 0.25rem;
  padding: 0.85rem 0.95rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.gray50};
  border: 1px solid ${({ theme }) => theme.colors.gray200};

  span {
    font-size: 0.82rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.gray700};
  }

  code {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.gray500};
    word-break: break-all;
  }
`;
