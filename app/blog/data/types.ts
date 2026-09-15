// 스킬 카드 하나: 이름(코드체) · 한 줄 제목 · 설명 · 그대로 붙여 쓸 예시 문장
export interface SkillCard {
  name: string;
  title: string;
  desc: string;
  example: string;
}

export interface ContentBlock {
  type:
    | "heading"
    | "paragraph"
    | "list"
    | "quote"
    | "code"
    | "image"
    | "link"
    | "skillCards";
  text?: string;
  items?: string[];
  src?: string;
  alt?: string;
  caption?: string;
  width?: number; // 이미지 블록: 작은 그림(도트 등)은 본문 폭까지 늘리지 않고 이 픽셀 폭으로 가운데에 (2026-09-16)
  href?: string;
  label?: string;
  /** skillCards 전용. tone "dark" = 검은 카드(강조), "light" = 흰 카드 */
  cards?: SkillCard[];
  tone?: "dark" | "light";
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
