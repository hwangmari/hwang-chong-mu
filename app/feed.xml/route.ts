// 블로그 RSS 피드 (/feed.xml). 네이버 서치어드바이저·구글 서치콘솔에 등록해 새 글을 빨리 알리는 용도.
import { BLOG_POSTS } from "@/app/blog/data";

const SITE_URL = "https://www.hwang-lab.kr";

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export const dynamic = "force-static";

export function GET() {
  const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  const items = posts
    .map(
      (post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${SITE_URL}/blog/${post.id}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${post.id}</guid>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${new Date(`${post.date}T09:00:00+09:00`).toUTCString()}</pubDate>
    </item>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>황총무의 실험실 블로그</title>
    <link>${SITE_URL}/blog</link>
    <description>총무 일과 생활을 편하게 하는 도구와 사용법, 생활 팁을 나눠요.</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
