"use client";

import { useState } from "react";
import styled from "styled-components";
import { Typography } from "@hwangchongmu/ui";
import PageIntro, { StHighlight } from "@/components/common/PageIntro";
import CreateButton from "@/components/common/CreateButton";
import Switch from "@/components/common/Switch";
import TagInput from "@/components/common/TagInput";
import ColorPickerPanel from "@/components/common/ColorPickerPanel";
import ShareButton from "@/components/common/ShareButton";
import FooterGuide from "@/components/common/FooterGuide";
import { useModal } from "@/components/common/ModalProvider";
import {
  pageIntroExample,
  createButtonExample,
  useModalExample,
  switchExample,
  tagInputExample,
  colorPickerExample,
  shareButtonExample,
  footerGuideExample,
} from "../content";

interface AppCommonDocSectionProps {
  copiedCode: string | null;
  onCopy: (label: string, value: string) => void;
}

const PRESET_COLORS = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
  "#EC4899",
];

export function AppCommonDocSection({
  copiedCode,
  onCopy,
}: AppCommonDocSectionProps) {
  const [switchOn, setSwitchOn] = useState(true);
  const [tags, setTags] = useState<string[]>(["승현", "지유"]);
  const [pickerColor, setPickerColor] = useState(PRESET_COLORS[0]);
  const { openAlert, openConfirm } = useModal();

  return (
    <SectionGroup>
      <DocSection>
        <SectionHeading>
          <Typography as="h2" variant="h2">
            프로젝트 공통 컴포넌트
          </Typography>
          <Typography color="gray500">
            황총무 앱 곳곳에서 재사용되는 `components/common/` 컴포넌트들입니다.
            UI 패키지(@hwangchongmu/ui)와 달리 프로젝트 의존성이 있어 패키지로
            분리하지 않은 컴포넌트입니다.
          </Typography>
        </SectionHeading>
      </DocSection>

      <DocSection id="common-page-intro">
        <SubHeading>
          <Typography as="h3" variant="h3">
            PageIntro
          </Typography>
          <Typography color="gray500">
            아이콘 + 타이틀 + 설명으로 구성된 페이지 상단 헤더. `StHighlight`로
            본문 강조도 가능합니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PageIntro
            icon="🐰"
            title="황총무의 약속잡기"
            description={
              <>
                모임 일정을 <StHighlight $color="blue">빠르게</StHighlight>{" "}
                모아주는 도구
              </>
            }
          />
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("page-intro", pageIntroExample)}
            >
              {copiedCode === "page-intro" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{pageIntroExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>

      <DocSection id="common-create-button">
        <SubHeading>
          <Typography as="h3" variant="h3">
            CreateButton
          </Typography>
          <Typography color="gray500">
            폼 하단의 메인 액션용 100% 너비 버튼. `bgColor` 지정 시 컬러 톤 +
            그림자, 미지정 시 기본 다크 톤. `isLoading` 처리 내장.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewStack>
            <CreateButton onClick={() => undefined}>약속 만들기</CreateButton>
            <CreateButton bgColor="#3B82F6" onClick={() => undefined}>
              저장하기
            </CreateButton>
            <CreateButton bgColor="#10B981" isLoading loadingText="저장 중...">
              저장하기
            </CreateButton>
            <CreateButton bgColor="#EF4444" disabled>
              비활성화 상태
            </CreateButton>
          </PreviewStack>
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("create-button", createButtonExample)}
            >
              {copiedCode === "create-button" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{createButtonExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>

      <DocSection id="common-modal">
        <SubHeading>
          <Typography as="h3" variant="h3">
            useModal (ModalProvider)
          </Typography>
          <Typography color="gray500">
            앱 루트 `ModalProvider`로 감싸두고, `useModal()`이 돌려주는
            `openAlert` / `openConfirm`을 Promise처럼 await 해서 사용합니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewRow>
            <DemoButton
              type="button"
              onClick={() => openAlert("저장이 완료되었어요 ✅")}
            >
              openAlert 호출
            </DemoButton>
            <DemoButton
              type="button"
              onClick={async () => {
                const ok = await openConfirm("정말 삭제할까요?");
                if (ok) await openAlert("삭제 완료!");
              }}
            >
              openConfirm 호출
            </DemoButton>
          </PreviewRow>
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("use-modal", useModalExample)}
            >
              {copiedCode === "use-modal" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{useModalExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>

      <DocSection id="common-switch">
        <SubHeading>
          <Typography as="h3" variant="h3">
            Switch
          </Typography>
          <Typography color="gray500">
            controlled 토글. `aria-checked` / `role=&quot;switch&quot;`가 들어가
            있어 접근성 OK.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewRow>
            <Switch
              checked={switchOn}
              onChange={setSwitchOn}
              label="알림 켜기"
            />
            <Typography color="gray600">
              현재 상태: {switchOn ? "켜짐" : "꺼짐"}
            </Typography>
          </PreviewRow>
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("switch", switchExample)}
            >
              {copiedCode === "switch" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{switchExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>

      <DocSection id="common-tag-input">
        <SubHeading>
          <Typography as="h3" variant="h3">
            TagInput
          </Typography>
          <Typography color="gray500">
            Enter로 추가, Backspace로 마지막 태그 삭제, IME 조합 중 입력 무시.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <TagInput
            label="참석자"
            placeholder="이름 입력 후 Enter"
            tags={tags}
            onChange={setTags}
          />
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("tag-input", tagInputExample)}
            >
              {copiedCode === "tag-input" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{tagInputExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>

      <DocSection id="common-color-picker">
        <SubHeading>
          <Typography as="h3" variant="h3">
            ColorPickerPanel
          </Typography>
          <Typography color="gray500">
            프리셋 칩 + native color picker. 색상 카테고리(라벨, 카드 등) 지정
            UI에 사용.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewStack>
            <ColorPickerPanel
              colors={PRESET_COLORS}
              selectedColor={pickerColor}
              onSelect={setPickerColor}
            />
            <Typography color="gray600">
              선택된 색상:{" "}
              <ColorPreviewDot style={{ background: pickerColor }} />
              {pickerColor}
            </Typography>
          </PreviewStack>
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("color-picker", colorPickerExample)}
            >
              {copiedCode === "color-picker" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{colorPickerExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>

      <DocSection id="common-share-button">
        <SubHeading>
          <Typography as="h3" variant="h3">
            ShareButton
          </Typography>
          <Typography color="gray500">
            현재 페이지 URL을 클립보드에 복사하고 2초 툴팁을 띄우는 동그란 아이콘
            버튼.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <PreviewRow>
            <ShareButton iconSize={20} />
            <ShareButton iconSize={28} />
          </PreviewRow>
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("share-button", shareButtonExample)}
            >
              {copiedCode === "share-button" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{shareButtonExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>

      <DocSection id="common-footer-guide">
        <SubHeading>
          <Typography as="h3" variant="h3">
            FooterGuide
          </Typography>
          <Typography color="gray500">
            서비스 페이지 하단에 들어가는 스토리 + 꿀팁 카드 묶음. `story` 생략
            가능, `blogGuideId`를 주면 블로그 가이드 링크가 추가됩니다.
          </Typography>
        </SubHeading>
        <ExampleCanvas>
          <FooterGuide
            title="약속 잡기 꿀팁"
            story={{
              title: "🤔 왜 황총무가 만들어졌을까요?",
              content: (
                <>
                  &quot;다들 언제 시간 돼?&quot; 단톡방에서 같은 질문이 반복되는
                  걸 끝내고 싶었어요.
                </>
              ),
              solution: {
                title: "그래서 만들었습니다",
                content: <>안되는 날만 한 번 누르면, 가능한 날이 자동으로 모입니다.</>,
              },
            }}
            tips={[
              {
                icon: "🗓️",
                title: "한 번에 정리",
                description: "안되는 날만 클릭하면 자동으로 가능한 날이 정리돼요.",
              },
              {
                icon: "🔔",
                title: "공유는 링크로",
                description: "친구한테는 URL만 보내면 끝. 회원가입도 필요 없어요.",
              },
            ]}
          />
        </ExampleCanvas>
        <CodeCard>
          <CodeHeader>
            <Typography as="h4" variant="label" color="gray500">
              React Code
            </Typography>
            <CopyButton
              type="button"
              onClick={() => onCopy("footer-guide", footerGuideExample)}
            >
              {copiedCode === "footer-guide" ? "Copied" : "Copy"}
            </CopyButton>
          </CodeHeader>
          <CodeBlock>
            <code>{footerGuideExample}</code>
          </CodeBlock>
        </CodeCard>
      </DocSection>
    </SectionGroup>
  );
}

const SectionGroup = styled.div`
  display: grid;
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

const SubHeading = styled.div`
  display: grid;
  gap: 0.25rem;
`;

const ExampleCanvas = styled.div`
  display: grid;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.gray50};
`;

const PreviewStack = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.85rem;
  flex-wrap: wrap;
`;

const DemoButton = styled.button`
  padding: 0.65rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray900};
  font-weight: 700;
  font-size: 0.9rem;
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
  }
`;

const ColorPreviewDot = styled.span`
  display: inline-block;
  width: 0.9rem;
  height: 0.9rem;
  border-radius: 999px;
  margin: 0 0.35rem -0.1rem 0.25rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
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
