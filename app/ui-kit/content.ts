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
    title: "컴포넌트",
    items: [
      { id: "button", label: "Button" },
      { id: "input", label: "Input" },
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
