import { notFound } from "next/navigation";
import type { Metadata } from "next";
import DocsShell from "../components/DocsShell";
import MarkdownRenderer from "../components/MarkdownRenderer";
import { getDocBySlug, getDocEntries, getSectionLabel } from "@/lib/docs";

type Props = {
  params: Promise<{ slug: string[] }>;
};

export async function generateStaticParams() {
  const entries = await getDocEntries();
  return entries
    .filter((entry) => entry.slug.length > 0)
    .map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doc = await getDocBySlug(slug);

  if (!doc) {
    return {
      title: "문서를 찾을 수 없음",
    };
  }

  return {
    title: `${doc.title} | 황총무 문서`,
    description: doc.summary,
  };
}

export default async function DocsDetailPage({ params }: Props) {
  const { slug } = await params;
  const [entries, doc] = await Promise.all([getDocEntries(), getDocBySlug(slug)]);

  if (!doc) {
    notFound();
  }

  const groupedEntries = entries.reduce<Record<string, typeof entries>>((acc, entry) => {
    const key = entry.section;
    acc[key] = [...(acc[key] || []), entry];
    return acc;
  }, {});
  const sections = Object.entries(groupedEntries).map(([section, sectionEntries]) => ({
    key: section,
    label: getSectionLabel(section),
    entries: sectionEntries,
  }));

  return (
    <DocsShell
      currentHref={doc.href}
      title={doc.title}
      description={doc.summary}
      sections={sections}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "0.8rem",
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: "1rem",
          padding: "0.72rem 0.82rem",
          borderRadius: "18px",
          background: "#f6f9fd",
          border: "1px solid #dfe7f1",
        }}
      >
        <span>{doc.relativePath}</span>
        <strong>{doc.section === "root" ? "대표 문서" : "세부 문서"}</strong>
      </div>
      <MarkdownRenderer
        content={doc.content}
        currentSlug={doc.slug}
        isIndex={doc.isIndex}
      />
    </DocsShell>
  );
}
