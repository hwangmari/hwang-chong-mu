export const importExample =
  'import { Button, Input, Typography } from "@hwangchongmu/ui"';
export const providerExample = 'import { UiProvider } from "@hwangchongmu/ui"';
export const buttonExample = `import { Button } from "@hwangchongmu/ui";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";

export function Example() {
  return (
    <Button
      color="primary"
      variant="fill"
      size="large"
      leftIcon={<FileDownloadOutlinedIcon />}
    >
      저장하기
    </Button>
  );
}`;

export const buttonInterfaceExample = `type ButtonAs = "button" | "a";
type ButtonColor = "primary" | "danger" | "light" | "dark";
type ButtonVariant = "fill" | "weak";
type ButtonDisplay = "inline" | "block" | "full";
type ButtonSize = "small" | "medium" | "large" | "xlarge";

interface ButtonProps {
  as?: ButtonAs;
  color?: ButtonColor;
  variant?: ButtonVariant;
  display?: ButtonDisplay;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  htmlStyle?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}`;

export const pageIntroExample = `import PageIntro, { StHighlight } from "@/components/common/PageIntro";

export function Example() {
  return (
    <PageIntro
      icon="🐰"
      title="황총무의 약속잡기"
      description={
        <>
          모임 일정을 <StHighlight $color="blue">빠르게</StHighlight> 모아주는 도구
        </>
      }
    />
  );
}`;

export const createButtonExample = `import CreateButton from "@/components/common/CreateButton";

export function Example() {
  return (
    <>
      <CreateButton onClick={handleCreate}>약속 만들기</CreateButton>
      <CreateButton bgColor="#3B82F6" isLoading loadingText="저장 중...">
        저장하기
      </CreateButton>
    </>
  );
}`;

export const useModalExample = `import { useModal } from "@/components/common/ModalProvider";

export function Example() {
  const { openAlert, openConfirm } = useModal();

  async function handleDelete() {
    const ok = await openConfirm("정말 삭제할까요?");
    if (!ok) return;
    await deleteItem();
    await openAlert("삭제되었습니다.");
  }

  return <button onClick={handleDelete}>삭제</button>;
}`;

export const switchExample = `import Switch from "@/components/common/Switch";

export function Example() {
  const [on, setOn] = useState(false);
  return <Switch checked={on} onChange={setOn} label="알림 켜기" />;
}`;

export const tagInputExample = `import TagInput from "@/components/common/TagInput";

export function Example() {
  const [tags, setTags] = useState<string[]>([]);
  return (
    <TagInput
      label="참석자"
      placeholder="이름 입력 후 Enter"
      tags={tags}
      onChange={setTags}
    />
  );
}`;

export const colorPickerExample = `import ColorPickerPanel from "@/components/common/ColorPickerPanel";

const PRESETS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#6366F1"];

export function Example() {
  const [color, setColor] = useState(PRESETS[0]);
  return (
    <ColorPickerPanel
      colors={PRESETS}
      selectedColor={color}
      onSelect={setColor}
    />
  );
}`;

export const shareButtonExample = `import ShareButton from "@/components/common/ShareButton";

export function Example() {
  return <ShareButton iconSize={20} />;
}`;

export const footerGuideExample = `import FooterGuide from "@/components/common/FooterGuide";

export function Example() {
  return (
    <FooterGuide
      title="약속 잡기 꿀팁"
      story={{
        title: "왜 황총무가 만들어졌을까요?",
        content: <>친구들끼리 일정 맞추기 너무 힘드셨죠?</>,
      }}
      tips={[
        { icon: "🗓️", title: "한 번에 정리", description: "안되는 날만 클릭" },
        { icon: "🔔", title: "공유는 링크로", description: "URL만 보내면 끝" },
      ]}
    />
  );
}`;

export const leftNav = [
  {
    title: "소개",
    items: [
      { id: "overview", label: "소개" },
      { id: "getting-started", label: "사용방법" },
    ],
  },
  {
    title: "파운데이션",
    items: [
      { id: "foundation-colors", label: "Colors" },
      { id: "foundation-typography", label: "Typography" },
    ],
  },
  {
    title: "UI 패키지 컴포넌트",
    items: [
      { id: "button", label: "Button" },
      { id: "input", label: "Input" },
      { id: "typography", label: "Typography" },
    ],
  },
  {
    title: "프로젝트 공통 컴포넌트",
    items: [
      { id: "common-page-intro", label: "PageIntro" },
      { id: "common-create-button", label: "CreateButton" },
      { id: "common-modal", label: "useModal" },
      { id: "common-switch", label: "Switch" },
      { id: "common-tag-input", label: "TagInput" },
      { id: "common-color-picker", label: "ColorPickerPanel" },
      { id: "common-share-button", label: "ShareButton" },
      { id: "common-footer-guide", label: "FooterGuide" },
    ],
  },
] as const;

export const buttonToc = [
  { id: "button-usage", label: "사용 예제" },
  { id: "button-size", label: "크기 조정하기" },
  { id: "button-style", label: "스타일" },
  { id: "button-display", label: "형태" },
  { id: "button-icon", label: "아이콘" },
  { id: "button-loading", label: "로딩과 비활성화" },
  { id: "button-accessibility", label: "접근성" },
  { id: "button-interface", label: "인터페이스" },
] as const;

export const commonToc = [
  { id: "common-page-intro", label: "PageIntro" },
  { id: "common-create-button", label: "CreateButton" },
  { id: "common-modal", label: "useModal" },
  { id: "common-switch", label: "Switch" },
  { id: "common-tag-input", label: "TagInput" },
  { id: "common-color-picker", label: "ColorPickerPanel" },
  { id: "common-share-button", label: "ShareButton" },
  { id: "common-footer-guide", label: "FooterGuide" },
] as const;
