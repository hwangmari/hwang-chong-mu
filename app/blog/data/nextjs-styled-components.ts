import type { BlogPost } from "./types";

export const nextjsStyledComponents: BlogPost = {
  id: "nextjs-styled-components",
  emoji: "🎨",
  title: "Next.js App Router + styled-components SSR 삽질기",
  summary:
    "Next.js 14 App Router 환경에서 styled-components를 SSR로 적용하면서 겪은 시행착오와 해결 과정을 정리했습니다. StyledComponentsRegistry 패턴과 compiler 설정까지.",
  date: "2025-07-05",
  category: "기술 이야기",
  content: [
    {
      type: "heading",
      text: "문제: FOUC(Flash of Unstyled Content)",
    },
    {
      type: "paragraph",
      text: "Next.js App Router에서 styled-components를 그냥 사용하면 페이지가 처음 로드될 때 스타일이 적용되지 않은 날것의 HTML이 잠깐 보이는 현상(FOUC)이 발생합니다. 이는 styled-components가 클라이언트에서 스타일을 생성하기 때문입니다.",
    },
    {
      type: "heading",
      text: "해결: StyledComponentsRegistry",
    },
    {
      type: "paragraph",
      text: "Next.js 공식 문서에서 권장하는 방식은 ServerStyleSheet를 활용한 Registry 패턴입니다. SSR 시점에 스타일을 수집해서 HTML의 <head>에 주입하는 방식이죠.",
    },
    {
      type: "code",
      text: "// lib/registry.tsx\n'use client';\nimport { useServerInsertedHTML } from 'next/navigation';\nimport { ServerStyleSheet, StyleSheetManager } from 'styled-components';\n\nexport default function StyledComponentsRegistry({ children }) {\n  const [sheet] = useState(() => new ServerStyleSheet());\n  \n  useServerInsertedHTML(() => {\n    const styles = sheet.getStyleElement();\n    sheet.instance.clearTag();\n    return <>{styles}</>;\n  });\n  \n  return (\n    <StyleSheetManager sheet={sheet.instance}>\n      {children}\n    </StyleSheetManager>\n  );\n}",
    },
    {
      type: "heading",
      text: "추가 최적화: compiler 옵션",
    },
    {
      type: "paragraph",
      text: "next.config.ts에서 styled-components compiler를 활성화하면 빌드 타임에 스타일을 처리해 성능이 개선됩니다. displayName도 자동으로 추가되어 디버깅이 편해집니다.",
    },
    {
      type: "code",
      text: "// next.config.ts\nconst nextConfig = {\n  compiler: {\n    styledComponents: true,\n  },\n};",
    },
    {
      type: "heading",
      text: "교훈",
    },
    {
      type: "paragraph",
      text: "App Router와 styled-components의 조합은 설정이 까다롭지만, 한 번 잡아놓으면 이후에는 매우 편리합니다. 테마 시스템과 결합하면 일관된 디자인 토큰 관리가 가능하고, TypeScript와의 궁합도 좋습니다.",
    },
  ],
};
