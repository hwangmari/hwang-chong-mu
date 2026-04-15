import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BLOG_POSTS } from "../data";
import BlogArticleView from "./BlogArticleView";

interface BlogDetailPageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ id: post.id }));
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = BLOG_POSTS.find((p) => p.id === id);

  if (!post) {
    return {
      title: "존재하지 않는 글 | 황총무의 실험실",
    };
  }

  const title = `${post.title} | 황총무의 실험실`;
  const description = post.summary;
  const url = `/blog/${post.id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.date,
      siteName: "황총무의 실험실",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { id } = await params;
  const post = BLOG_POSTS.find((p) => p.id === id);

  if (!post) {
    notFound();
  }

  const siteUrl = "https://www.hwang-lab.kr";
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: "황총무",
    },
    publisher: {
      "@type": "Organization",
      name: "황총무의 실험실",
      url: siteUrl,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.id}`,
    },
    articleSection: post.category,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <BlogArticleView post={post} />
    </>
  );
}
