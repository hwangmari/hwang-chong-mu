export interface ContentBlock {
  type:
    | "heading"
    | "paragraph"
    | "list"
    | "quote"
    | "code"
    | "image"
    | "link";
  text?: string;
  items?: string[];
  src?: string;
  alt?: string;
  caption?: string;
  href?: string;
  label?: string;
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
