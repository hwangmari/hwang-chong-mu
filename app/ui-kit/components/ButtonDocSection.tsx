"use client";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import styled from "styled-components";
import {
  BUTTON_COLORS,
  BUTTON_DISPLAYS,
  BUTTON_SIZES,
  BUTTON_VARIANTS,
  Button,
  Typography,
} from "@hwangchongmu/ui";
import { buttonExample, buttonInterfaceExample } from "../content";

interface ButtonDocSectionProps {
  copiedCode: string | null;
  onCopy: (label: string, value: string) => void;
}

export function ButtonDocSection({
  copiedCode,
  onCopy,
}: ButtonDocSectionProps) {
  return (
    <DocSection id="button">
      <SectionHeading>
        <Typography as="h2" variant="h2">
          Component / Button
        </Typography>
        <Typography color="gray500">
          `Button` 컴포넌트는 color, variant, display, size, loading을
          조합해서 다양한 액션 버튼을 만들 수 있습니다.
        </Typography>
      </SectionHeading>

      <SubSection id="button-usage">
        <SubHeading>
          <Typography as="h3" variant="h3">
            사용 예제
          </Typography>
          <Typography color="gray500">
            가장 기본적인 text + icon 조합입니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <Button
            color="primary"
            variant="fill"
            size="large"
            leftIcon={<FileDownloadOutlinedIcon />}
          >
            저장하기
          </Button>
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("button-example", buttonExample)}
            >
              {copiedCode === "button-example" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{buttonExample}</code>
          </CodeBlock>
        </CodeCard>
      </SubSection>

      <SubSection id="button-size">
        <SubHeading>
          <Typography as="h3" variant="h3">
            크기 조정하기
          </Typography>
          <Typography color="gray500">
            `size` 속성으로 버튼의 높이와 패딩을 변경합니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewGrid4>
            {BUTTON_SIZES.map((size, index) => (
              <PreviewItem key={size}>
                <StepBadge>{index + 1}</StepBadge>
                <Button color="primary" variant="fill" size={size}>
                  버튼명
                </Button>
              </PreviewItem>
            ))}
          </PreviewGrid4>
        </ExampleCanvas>
      </SubSection>

      <SubSection id="button-style">
        <SubHeading>
          <Typography as="h3" variant="h3">
            스타일
          </Typography>
          <Typography color="gray500">
            `color`와 `variant` 조합으로 버튼 톤을 조절합니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewGrid2>
            {BUTTON_COLORS.map((color, index) => (
              <PreviewItem key={color}>
                <StepBadge>{index + 1}</StepBadge>
                <Typography variant="label">{color}</Typography>
                <VariantStack>
                  {BUTTON_VARIANTS.map((variant) => (
                    <Button
                      key={`${color}-${variant}`}
                      color={color}
                      variant={variant}
                      size="medium"
                    >
                      버튼명
                    </Button>
                  ))}
                </VariantStack>
              </PreviewItem>
            ))}
          </PreviewGrid2>
        </ExampleCanvas>
      </SubSection>

      <SubSection id="button-display">
        <SubHeading>
          <Typography as="h3" variant="h3">
            형태
          </Typography>
          <Typography color="gray500">
            `display` 속성으로 버튼의 배치 방식을 제어합니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <DisplayStack>
            {BUTTON_DISPLAYS.map((display) => (
              <DisplayRow key={display}>
                <Typography variant="label">{display}</Typography>
                <Button
                  color="primary"
                  variant="fill"
                  display={display}
                  size="large"
                >
                  버튼명
                </Button>
              </DisplayRow>
            ))}
          </DisplayStack>
        </ExampleCanvas>
      </SubSection>

      <SubSection id="button-icon">
        <SubHeading>
          <Typography as="h3" variant="h3">
            아이콘
          </Typography>
          <Typography color="gray500">
            좌측 아이콘, 우측 아이콘, 아이콘 전용 버튼까지 지원합니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewGrid3>
            <PreviewItem>
              <Typography variant="label">left icon</Typography>
              <Button
                color="primary"
                variant="fill"
                size="large"
                leftIcon={<FileDownloadOutlinedIcon />}
              >
                다운로드
              </Button>
            </PreviewItem>
            <PreviewItem>
              <Typography variant="label">right icon</Typography>
              <Button
                color="dark"
                variant="weak"
                size="large"
                rightIcon={<ArrowForwardIcon />}
              >
                다음 단계
              </Button>
            </PreviewItem>
            <PreviewItem>
              <Typography variant="label">icon only</Typography>
              <Button
                color="light"
                variant="fill"
                size="large"
                leftIcon={<FavoriteBorderIcon />}
                aria-label="좋아요"
              />
            </PreviewItem>
          </PreviewGrid3>
        </ExampleCanvas>
      </SubSection>

      <SubSection id="button-loading">
        <SubHeading>
          <Typography as="h3" variant="h3">
            로딩과 비활성화
          </Typography>
          <Typography color="gray500">
            `loading`이면 스피너를 표시하고, 상호작용을 동시에 막습니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewGrid3>
            <PreviewItem>
              <Typography variant="label">loading</Typography>
              <Button color="primary" variant="fill" size="large" loading>
                저장하기
              </Button>
            </PreviewItem>
            <PreviewItem>
              <Typography variant="label">disabled</Typography>
              <Button color="primary" variant="fill" size="large" disabled>
                저장하기
              </Button>
            </PreviewItem>
            <PreviewItem>
              <Typography variant="label">anchor</Typography>
              <Button
                as="a"
                href="#button"
                color="dark"
                variant="weak"
                size="large"
              >
                문서로 이동
              </Button>
            </PreviewItem>
          </PreviewGrid3>
        </ExampleCanvas>
      </SubSection>

      <SubSection id="button-accessibility">
        <SubHeading>
          <Typography as="h3" variant="h3">
            접근성
          </Typography>
          <Typography color="gray500">
            아이콘만 있거나 설명이 부족한 버튼은 추가 속성이 필요합니다.
          </Typography>
        </SubHeading>
        <InfoCard>
          <BulletList>
            <li>아이콘 전용 버튼은 `aria-label`을 함께 제공합니다.</li>
            <li>
              <code>as=&quot;a&quot;</code>를 쓰면 링크 태그로 렌더링됩니다.
            </li>
            <li>`loading` 상태는 사용자가 중복 클릭하지 못하게 막아줍니다.</li>
          </BulletList>
        </InfoCard>
      </SubSection>

      <SubSection id="button-interface">
        <SubHeading>
          <Typography as="h3" variant="h3">
            인터페이스
          </Typography>
          <Typography color="gray500">
            문서에 적힌 규칙이 실제 버튼 타입과 동일합니다.
          </Typography>
        </SubHeading>
        <CodeCard>
          <CodeBlock>
            <code>{buttonInterfaceExample}</code>
          </CodeBlock>
        </CodeCard>
      </SubSection>
    </DocSection>
  );
}

const DocSection = styled.section`
  scroll-margin-top: calc(3.5rem + 1.25rem);
  display: grid;
  gap: 1rem;
`;

const SectionHeading = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const SubSection = styled.section`
  scroll-margin-top: calc(3.5rem + 1.25rem);
  display: grid;
  gap: 0.8rem;
`;

const SubHeading = styled.div`
  display: grid;
  gap: 0.25rem;
`;

const InfoCard = styled.div`
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
`;

const ExampleCanvas = styled.div`
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.gray50};
`;

const PreviewGrid4 = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const PreviewGrid3 = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const PreviewGrid2 = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;

  @media ${({ theme }) => theme.media.mobile} {
    grid-template-columns: 1fr;
  }
`;

const PreviewItem = styled.div`
  display: grid;
  align-content: start;
  justify-items: start;
  gap: 0.75rem;
  padding: 1rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
`;

const VariantStack = styled.div`
  display: grid;
  gap: 0.75rem;
  width: 100%;
`;

const DisplayStack = styled.div`
  display: grid;
  gap: 0.9rem;
`;

const DisplayRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.45rem;
  width: 100%;
`;

const StepBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.gray800};
  color: ${({ theme }) => theme.colors.white};
  font-size: 0.9rem;
  font-weight: 700;
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
