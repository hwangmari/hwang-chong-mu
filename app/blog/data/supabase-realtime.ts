import type { BlogPost } from "./types";

export const supabaseRealtime: BlogPost = {
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
};
