import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "./blog/data";

const SITE_URL = "https://www.hwang-lab.kr";

const STATIC_ROUTES = [
  "",
  "/meeting",
  "/calc",
  "/overtime",
  "/place",
  "/account-book",
  "/habit",
  "/daily",
  "/diet",
  "/game",
  "/workout",
  "/schedule",
  "/blog",
  "/portfolio",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/blog" ? 0.9 : 0.8,
  }));

  const blogEntries: MetadataRoute.Sitemap = BLOG_POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.id}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: post.category === "사용 가이드" ? 0.85 : 0.7,
  }));

  return [...staticEntries, ...blogEntries];
}
