export interface ContentBlock {
  type: "heading" | "paragraph" | "list" | "quote" | "code";
  text?: string;
  items?: string[];
}

export interface BlogPost {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  date: string;
  category: string;
  content: ContentBlock[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "hwang-chongmu-intro",
    emoji: "🐰",
    title: "황총무의 실험실을 소개합니다",
    summary:
      "일상의 작은 불편함을 해결하기 위해 만든 서비스들 — 약속 잡기, N빵 계산기, 야근 계산기 등 다양한 미니 서비스를 왜 만들었고 어떻게 발전시켜 왔는지 이야기합니다.",
    date: "2025-03-01",
    category: "서비스 소개",
    content: [
      {
        type: "quote",
        text: "복잡한 건 제가 할게요, 총총총... 🐾",
      },
      {
        type: "heading",
        text: "왜 만들었을까?",
      },
      {
        type: "paragraph",
        text: "친구들과 약속을 잡을 때마다 카톡에서 \"언제 돼?\"를 반복하고, 모임이 끝나면 누가 얼마를 내야 하는지 계산기를 꺼내 들었습니다. 야근 후에는 보상휴가 시간이 맞는지 일일이 확인해야 했고요.",
      },
      {
        type: "paragraph",
        text: "이런 일상의 작은 불편함들이 쌓이면서, 직접 해결해 보자는 마음으로 프로젝트를 시작했습니다. 처음에는 나만 쓸 생각이었는데, 주변에서 \"나도 쓰고 싶다\"는 반응이 와서 조금씩 서비스를 다듬어 나갔습니다.",
      },
      {
        type: "heading",
        text: "어떤 서비스가 있나요?",
      },
      {
        type: "list",
        items: [
          "📅 약속 잡기 — 소거법으로 불가능한 날짜를 투표하면 자동으로 최적의 날짜를 찾아줍니다.",
          "💸 N빵 계산기 — 누가 얼마를 더 냈는지, 누구에게 얼마를 보내야 하는지 자동 계산합니다.",
          "🌙 야근 계산기 — 야근 시간을 입력하면 보상휴가 일수를 자동으로 계산합니다.",
          "📍 장소잡기 — 네이버 검색으로 장소 후보를 고르고 투표합니다.",
          "🧾 가계부 — 수입과 지출을 카테고리별로 관리합니다.",
          "🥕 습관 관리 — 매일 체크하며 습관을 만들어 갑니다.",
          "📓 일일 기록 — 한 줄 일기와 체크리스트로 하루를 돌아봅니다.",
          "⚖️ 체중 관리 — 체중과 식단을 기록하고 변화를 추적합니다.",
          "🎮 게임방 — 사다리 타기, 돌림판, 광클 대전 등 간단한 게임을 즐깁니다.",
        ],
      },
      {
        type: "heading",
        text: "앞으로의 계획",
      },
      {
        type: "paragraph",
        text: "황총무의 실험실은 계속 성장하고 있습니다. 사용자들의 피드백을 반영하며, 일상에서 진짜 쓸모 있는 도구를 하나씩 추가해 나갈 예정입니다. 작지만 다정한 서비스가 되길 바랍니다.",
      },
    ],
  },
  {
    id: "meeting-scheduler",
    emoji: "📅",
    title: "약속 잡기 기능은 어떻게 만들어졌을까?",
    summary:
      "친구들과 약속을 잡을 때마다 카톡으로 날짜를 주고받던 번거로움. 소거법 기반 투표 시스템으로 해결한 과정과 기술적 고민을 공유합니다.",
    date: "2025-04-10",
    category: "개발 일지",
    content: [
      {
        type: "heading",
        text: "문제 인식",
      },
      {
        type: "paragraph",
        text: "5명이 넘는 모임에서 약속을 잡으려면, 카카오톡에서 각자 안 되는 날짜를 텍스트로 보내고 누군가가 정리해야 합니다. 이 과정에서 날짜가 꼬이거나 빠지는 사람이 생기면 처음부터 다시 시작해야 했습니다.",
      },
      {
        type: "quote",
        text: "\"다들 언제 돼?\" → (30분의 카톡 폭탄) → \"그래서 언제야?\" → (또 30분)...",
      },
      {
        type: "heading",
        text: "해결 방법: 캘린더 기반 투표",
      },
      {
        type: "paragraph",
        text: "방장이 약속방을 만들고 링크를 공유하면, 멤버들이 캘린더에서 불가능한 날짜를 터치해 소거하는 방식으로 설계했습니다. 소거되지 않은 날짜 중 전원 가능한 최적의 날짜가 자동으로 하이라이트됩니다.",
      },
      {
        type: "heading",
        text: "기술적 고민",
      },
      {
        type: "list",
        items: [
          "캘린더 UI를 직접 구현할지, 라이브러리를 쓸지 — 결국 date-fns와 커스텀 캘린더 그리드로 직접 구현했습니다.",
          "투표 데이터의 실시간 동기화 — Supabase Realtime을 활용해 다른 사람의 투표가 즉시 반영되도록 했습니다.",
          "모바일 UX 최적화 — 날짜 셀을 드래그해서 여러 날을 한번에 선택할 수 있는 인터랙션을 추가했습니다.",
        ],
      },
      {
        type: "heading",
        text: "결과",
      },
      {
        type: "paragraph",
        text: "주변 친구들이 실제로 사용하기 시작하면서 피드백이 쌓였고, '확정 투표' 기능이나 '시간대별 세부 투표' 같은 기능이 추가되었습니다. 직접 쓰는 서비스를 만드는 게 가장 좋은 동기부여라는 걸 느꼈습니다.",
      },
    ],
  },
  {
    id: "calc-split-bill",
    emoji: "💸",
    title: "N빵 계산기 — 복잡한 정산을 간단하게",
    summary:
      "모임 후 정산할 때 누가 얼마를 내야 하는지 계산하는 건 늘 골치 아픈 일이었습니다. 다양한 정산 케이스를 고려한 N빵 계산기를 만들게 된 이유와 구현 방식을 소개합니다.",
    date: "2025-05-15",
    category: "개발 일지",
    content: [
      {
        type: "heading",
        text: "정산의 고통",
      },
      {
        type: "paragraph",
        text: "회식이 끝나면 시작되는 정산 타임. \"내가 이만큼 냈으니까 너는 이만큼 보내줘\"라는 계산이 사람이 많아질수록 복잡해집니다. 특히 1차, 2차에 참여한 인원이 다르면 머리가 아파지기 시작합니다.",
      },
      {
        type: "heading",
        text: "핵심 기능",
      },
      {
        type: "list",
        items: [
          "다중 결제 지원 — 여러 사람이 각각 다른 금액을 결제한 경우를 처리합니다.",
          "차등 분배 — 특정 인원이 더 많이 또는 적게 내야 하는 경우를 설정할 수 있습니다.",
          "송금 최적화 — 최소 횟수로 정산이 완료되도록 송금 경로를 계산합니다.",
          "공유 링크 — 정산 결과를 링크로 공유해 모임원 모두가 확인할 수 있습니다.",
        ],
      },
      {
        type: "heading",
        text: "구현 과정",
      },
      {
        type: "paragraph",
        text: "정산 로직의 핵심은 '최소 송금 횟수 알고리즘'입니다. 각자의 잔액(낸 금액 - 내야 할 금액)을 계산한 뒤, 양수(받을 사람)와 음수(보낼 사람)를 매칭해 최소 거래로 정리합니다.",
      },
      {
        type: "paragraph",
        text: "UI는 카카오톡 송금 화면처럼 친숙한 형태로 디자인해, 누구에게 얼마를 보내야 하는지 직관적으로 보여줍니다.",
      },
    ],
  },
  {
    id: "overtime-calculator",
    emoji: "🌙",
    title: "야근 계산기 — 복잡한 보상휴가 규정을 자동으로",
    summary:
      "야근 시간을 입력하면 보상휴가 일수를 자동 계산해주는 도구를 만들었습니다. 10시 전/후 배율 차이, 누적 기준 등 복잡한 규정을 코드로 풀어낸 과정을 공유합니다.",
    date: "2025-06-20",
    category: "개발 일지",
    content: [
      {
        type: "heading",
        text: "야근과 보상휴가",
      },
      {
        type: "paragraph",
        text: "야근을 하면 보상휴가를 받을 수 있지만, 계산이 생각보다 복잡합니다. 밤 10시 이전과 이후의 보상 배율이 다르고, 누적 기준 시간을 넘겨야 보상이 시작되는 규정도 있습니다. 매번 엑셀을 열어 계산하는 건 번거로운 일이었습니다.",
      },
      {
        type: "heading",
        text: "두 가지 계산 규칙",
      },
      {
        type: "list",
        items: [
          "누적 기준 규칙 — 야근 시간이 15시간을 넘어야 보상이 시작됩니다. 10시 이전은 1.5배, 10시 이후는 2배로 환산합니다.",
          "시간대 기준 규칙 — 오후 6시 30분부터 모든 시간을 1.5배로 환산하며, 10분 단위로 반올림합니다.",
        ],
      },
      {
        type: "heading",
        text: "핵심 기능",
      },
      {
        type: "list",
        items: [
          "10시 전/후 시간을 따로 입력하면 배율에 따라 보상휴가 일수를 자동 계산합니다.",
          "0.25일(2시간) 단위로 보상휴가가 산정되며, 다음 단계까지 남은 시간도 보여줍니다.",
          "월별 기록을 캘린더 형태로 관리할 수 있습니다.",
          "개인 기록(IndexedDB)과 공유 방(서버) 두 가지 모드를 지원합니다.",
        ],
      },
      {
        type: "heading",
        text: "구현 포인트",
      },
      {
        type: "paragraph",
        text: "보상휴가 규정은 회사마다 다를 수 있어서, 계산 규칙을 상수로 분리해 쉽게 변경할 수 있도록 설계했습니다. 복잡한 시간 환산 로직을 유틸 함수로 추출하고, 입력값이 바뀔 때마다 실시간으로 결과가 갱신되도록 구현했습니다.",
      },
      {
        type: "paragraph",
        text: "가장 신경 쓴 부분은 '다음 보상휴가까지 남은 시간' 표시입니다. 단순히 현재 보상 일수만 보여주면 동기부여가 약하지만, \"2시간 30분만 더 하면 0.25일 추가!\" 같은 정보가 있으면 사용자 경험이 확 달라집니다.",
      },
    ],
  },
  {
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
  },
  {
    id: "supabase-realtime",
    emoji: "🗄️",
    title: "Supabase로 실시간 투표 시스템 만들기",
    summary:
      "장소잡기와 약속잡기에 실시간 투표 기능을 구현하면서 Supabase의 Realtime 기능을 활용한 경험을 공유합니다.",
    date: "2025-08-12",
    category: "기술 이야기",
    content: [
      {
        type: "heading",
        text: "왜 실시간이 필요했을까?",
      },
      {
        type: "paragraph",
        text: "약속잡기와 장소잡기 서비스에서 여러 사람이 동시에 투표할 때, 새로고침 없이 다른 사람의 투표가 바로 반영되어야 합니다. 새로고침 버튼을 눌러야 최신 상태가 보인다면 사용 경험이 크게 떨어지기 때문입니다.",
      },
      {
        type: "heading",
        text: "Supabase Realtime 활용",
      },
      {
        type: "paragraph",
        text: "Supabase는 PostgreSQL 기반이면서도 Realtime 기능을 제공합니다. 테이블에 변경이 생기면 WebSocket을 통해 클라이언트에 즉시 알려주는 방식입니다.",
      },
      {
        type: "code",
        text: "// 실시간 구독 예시\nconst channel = supabase\n  .channel('votes')\n  .on('postgres_changes', {\n    event: '*',\n    schema: 'public',\n    table: 'dinner_votes',\n    filter: `room_id=eq.${roomId}`,\n  }, (payload) => {\n    // 투표 데이터 갱신\n    refreshVotes();\n  })\n  .subscribe();",
      },
      {
        type: "heading",
        text: "주의할 점",
      },
      {
        type: "list",
        items: [
          "채널 구독은 컴포넌트 마운트 시 시작하고, 언마운트 시 반드시 해제해야 합니다.",
          "RLS(Row Level Security) 설정과 Realtime 필터가 맞지 않으면 이벤트가 수신되지 않을 수 있습니다.",
          "짧은 시간에 많은 변경이 발생하면 디바운싱 처리가 필요합니다.",
        ],
      },
      {
        type: "paragraph",
        text: "Supabase Realtime 덕분에 별도의 WebSocket 서버를 구축하지 않고도 실시간 기능을 구현할 수 있었습니다. 개인 프로젝트에서 Firebase의 대안으로 매우 만족스러운 선택이었습니다.",
      },
    ],
  },
  {
    id: "habit-tracker",
    emoji: "🥕",
    title: "습관 관리 — 매일 체크하는 즐거움",
    summary:
      "습관을 만들고 유지하는 것은 어렵지만, 매일 체크하며 쌓이는 기록은 큰 동기부여가 됩니다. 습관 관리 서비스의 기획 의도와 디자인 과정을 이야기합니다.",
    date: "2025-09-01",
    category: "서비스 소개",
    content: [
      {
        type: "quote",
        text: "\"작은 습관이 큰 변화를 만든다\" — 제임스 클리어, 아주 작은 습관의 힘",
      },
      {
        type: "heading",
        text: "기획 의도",
      },
      {
        type: "paragraph",
        text: "운동, 독서, 물 마시기 같은 간단한 습관도 매일 하기는 쉽지 않습니다. 기존 습관 앱들은 기능이 너무 많거나 설정이 복잡해서, 정작 매일 체크하는 단순한 행위에 집중하기 어려웠습니다.",
      },
      {
        type: "paragraph",
        text: "황총무의 습관 관리는 '매일 체크'에 집중합니다. 열어서 누르고 닫는 것. 그게 전부입니다.",
      },
      {
        type: "heading",
        text: "디자인 포인트",
      },
      {
        type: "list",
        items: [
          "잔디 그래프(GitHub 스타일) — 연속 기록이 시각적으로 쌓이는 성취감을 줍니다.",
          "원터치 체크 — 앱을 열고 한 번의 탭으로 오늘 습관을 기록합니다.",
          "컬러 커스터마이징 — 각 습관마다 다른 색상을 지정해 개성을 표현합니다.",
          "간단한 통계 — 연속 기록, 달성률 등 핵심 수치만 보여줍니다.",
        ],
      },
      {
        type: "heading",
        text: "사용자 반응",
      },
      {
        type: "paragraph",
        text: "\"심플해서 좋다\", \"잔디 채워지는 게 중독된다\"는 피드백이 가장 많았습니다. 기능을 빼는 것이 더하는 것보다 어렵다는 걸 이 프로젝트를 통해 배웠습니다.",
      },
    ],
  },
  {
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
        text: "// package.json (root)\n{\n  \"workspaces\": [\"packages/*\"]\n}\n\n// 사용 예시\nimport { Button, Input, Typography } from '@hwangchongmu/ui';\nimport { colors, uiTheme } from '@hwangchongmu/ui/theme';",
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
  },
];
