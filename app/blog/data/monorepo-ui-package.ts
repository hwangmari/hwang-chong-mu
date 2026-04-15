import type { BlogPost } from "./types";

export const monorepoUiPackage: BlogPost = {
  id: "monorepo-ui-package",
  emoji: "📦",
  title: "npm workspace로 공통 UI 패키지 만들기",
  summary:
    "@hwangchongmu/ui 패키지를 만들어 Button, Input, Typography 등 공통 컴포넌트를 관리하는 모노레포 구조를 소개합니다.",
  date: "2025-10-18",
  category: "기술 이야기",
  content: [
    {
      type: "heading",
      text: "왜 모노레포인가?",
    },
    {
      type: "paragraph",
      text: "프로젝트가 커지면서 Button, Input, Typography 같은 기본 컴포넌트가 여러 서비스에서 반복 사용되었습니다. 복사해서 쓰면 수정할 때마다 여러 곳을 고쳐야 하고, 스타일 불일치가 생기기 쉽습니다.",
    },
    {
      type: "heading",
      text: "@hwangchongmu/ui 패키지",
    },
    {
      type: "paragraph",
      text: "npm workspace를 활용해 packages/ui/ 디렉토리에 공통 UI 패키지를 분리했습니다. 이 패키지는 독립적으로 관리되면서도 메인 앱에서 바로 import할 수 있습니다.",
    },
    {
      type: "code",
      text: '// package.json (root)\n{\n  "workspaces": ["packages/*"]\n}\n\n// 사용 예시\nimport { Button, Input, Typography } from \'@hwangchongmu/ui\';\nimport { colors, uiTheme } from \'@hwangchongmu/ui/theme\';',
    },
    {
      type: "heading",
      text: "패키지 구성",
    },
    {
      type: "list",
      items: [
        "Button — 다양한 variant(primary, secondary, outline)와 size를 지원합니다.",
        "Input — 레이블, 에러 메시지, 아이콘 등을 포함한 폼 입력 컴포넌트입니다.",
        "Typography — h1~h4, body, caption 등 일관된 텍스트 스타일을 제공합니다.",
        "Theme — 컬러 팔레트, 시맨틱 토큰, 레이아웃 토큰, 미디어 쿼리 브레이크포인트를 정의합니다.",
        "GlobalStyle — reset CSS와 기본 스타일을 설정합니다.",
        "UiProvider — ThemeProvider를 감싸 앱 전체에 테마를 주입합니다.",
      ],
    },
    {
      type: "heading",
      text: "Next.js에서의 설정",
    },
    {
      type: "paragraph",
      text: "Next.js에서 workspace 패키지를 사용하려면 transpilePackages 설정이 필요합니다. 이 설정이 없으면 node_modules에서 가져온 패키지가 트랜스파일되지 않아 빌드 에러가 발생합니다.",
    },
    {
      type: "code",
      text: "// next.config.ts\nconst nextConfig = {\n  transpilePackages: ['@hwangchongmu/ui'],\n};",
    },
    {
      type: "paragraph",
      text: "모노레포 구조 덕분에 UI 변경사항이 한 곳에서 관리되고, 모든 서비스에 즉시 반영됩니다. 규모가 작은 프로젝트에서도 이 패턴은 충분히 가치가 있습니다.",
    },
  ],
};
