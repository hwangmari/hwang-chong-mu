import type { BlogPost } from "./types";

// PokeTokenBar 소개. 내용은 저장소 README(github.com/chattymin/PokeTokenBar)에서 확인한 것만 적었다.
export const pokeTokenBar: BlogPost = {
  id: "poke-token-bar",
  emoji: "🥚",
  title: "클로드 쓴 만큼 포켓몬이 자라요 — PokeTokenBar",
  summary:
    "AI 코딩 도구에 쓴 토큰을 포켓몬 키우기로 바꿔 맥 메뉴 막대에 보여 주는 작은 앱입니다. 어떻게 크는지, 무엇을 읽는지, 설치는 어떻게 하는지 정리했습니다.",
  date: "2026-09-16",
  category: "만드는 이야기",
  content: [
    {
      type: "quote",
      text: "Your AI coding tokens, hatched into Pokémon — right in your menu bar.",
    },
    {
      type: "paragraph",
      text: "클로드와 하루 종일 붙어 일하다 보면 토큰을 얼마나 쓰는지 무뎌집니다. 숫자로 보면 실감이 안 나는데, 알이 하나 놓여 있고 그 알이 조금씩 금이 가는 걸 보면 이야기가 달라집니다. PokeTokenBar는 바로 그걸 해 주는 맥 메뉴 막대 앱입니다. 위 문장은 저장소의 한 줄 소개를 그대로 옮긴 것입니다.",
    },

    { type: "heading", text: "어떻게 크나" },
    {
      type: "list",
      items: [
        "토큰을 쓰면 알이 부화합니다. 1~5세대 포켓몬 중에서 희귀도에 따라 확률이 다르게 나옵니다.",
        "계속 쓰면 실제 진화 계보를 따라 진화합니다. 마지막 형태까지 크면 도감(컬렉션)에 들어가고, 새 알이 다시 놓입니다.",
        "속도는 열심히 쓸 때 흔한 종이 사흘쯤, 전설급이 24일쯤이라고 적혀 있습니다. 사용 한도에 닿으면 이상한 사탕을 받아 성장을 앞당길 수 있습니다.",
        "드물게(약 129분의 1) 색이 다른 개체가 부화하고, 진화해도 그 색을 유지합니다.",
      ],
    },

    { type: "heading", text: "무엇을 읽나" },
    {
      type: "paragraph",
      text: "클로드 코드를 비롯해 Codex, Gemini CLI, Cursor, Copilot CLI 등 여러 코딩 도구가 컴퓨터에 남기는 사용 기록을 자동으로 읽습니다. 계정을 연결하거나 키를 넣을 것이 없고, 기록이 표준 위치에 없는 도구는 폴더를 직접 지정할 수 있습니다.",
    },

    { type: "heading", text: "설치와 설정" },
    {
      type: "list",
      items: [
        "macOS 14 이상. Homebrew가 있으면 터미널에 아래 한 줄이면 됩니다.",
      ],
    },
    { type: "code", text: "brew install --cask chattymin/tap/poke-token-bar" },
    {
      type: "list",
      items: [
        "Homebrew가 없으면 저장소의 배포(Releases) 페이지에서 받아 응용 프로그램 폴더에 넣으면 됩니다.",
        "설정에서 메뉴 막대에 보일 항목(토큰·비용·한도 비율), 새로고침 간격, 로그인 시 자동 실행, 한도 알림을 고를 수 있습니다.",
        "한국어를 포함해 7개 언어를 지원하고, 성장 난이도를 10~200%로 조절할 수 있습니다.",
      ],
    },

    { type: "heading", text: "알아둘 것" },
    {
      type: "list",
      items: [
        "공식 제품이 아닙니다. 팬이 만든 비영리 프로젝트(MIT 라이선스)이고, 닌텐도·게임프리크·포켓몬 컴퍼니와 관계가 없습니다.",
        "앱 안에 포켓몬 이미지가 들어 있지 않습니다. 실행할 때 공개 API(PokéAPI)에서 가져옵니다.",
      ],
    },

    { type: "heading", text: "써 보니" },
    {
      type: "paragraph",
      text: "실용적인 기능은 아닙니다. 그래도 오늘 토큰을 얼마나 썼는지 메뉴 막대의 알 하나로 감이 잡히는 건 꽤 쓸모가 있고, 클로드에게 큰 일을 맡겨 두고 기다리는 동안 보는 재미도 있습니다. 토큰을 아끼게 되는지, 더 쓰게 되는지는 아직 모르겠습니다.",
    },
    {
      type: "link",
      href: "https://github.com/chattymin/PokeTokenBar",
      label: "PokeTokenBar 저장소 보기 →",
    },
    {
      type: "link",
      href: "/blog/omc-skills-guide",
      label: "함께 읽기: OMC 스킬 정리 →",
    },
  ],
};
