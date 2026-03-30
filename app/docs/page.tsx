import Link from "next/link";
import DocsShell from "./components/DocsShell";
import { getDocEntries, getSectionLabel } from "@/lib/docs";

export default async function DocsHomePage() {
  const entries = await getDocEntries();
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
      currentHref="/docs"
      title="황총무 프로젝트 문서"
      description="프로젝트 전반 아키텍처 문서와 메뉴별 상세 분석 문서를 웹에서 바로 읽을 수 있도록 정리한 문서 허브입니다."
      sections={sections}
    >
      <div style={{ display: "grid", gap: "1rem" }}>
        {Object.entries(groupedEntries).map(([section, sectionEntries]) => (
          <section
            key={section}
            style={{
              border: "1px solid #e1e8f1",
              borderRadius: "24px",
              padding: "1rem",
              background: "linear-gradient(180deg, #fcfdff, #f7faff)",
            }}
          >
            <h2
              style={{
                fontSize: "1.05rem",
                fontWeight: 900,
                color: "#1d2d44",
                marginBottom: "0.8rem",
              }}
            >
              {getSectionLabel(section)}
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "0.8rem",
              }}
            >
              {sectionEntries.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  style={{
                    display: "block",
                    borderRadius: "22px",
                    border: "1px solid #dbe4ef",
                    background:
                      "radial-gradient(circle at top right, rgba(137, 167, 255, 0.14), transparent 26%), #fff",
                    padding: "1rem",
                    textDecoration: "none",
                    boxShadow: "0 14px 28px rgba(87, 107, 141, 0.05)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 800,
                      color: "#7b8da7",
                    }}
                  >
                    {entry.relativePath}
                  </p>
                  <h3
                    style={{
                      marginTop: "0.35rem",
                      fontSize: "1.06rem",
                      fontWeight: 900,
                      color: "#1a2a40",
                    }}
                  >
                    {entry.title}
                  </h3>
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.86rem",
                      lineHeight: 1.6,
                      color: "#607187",
                    }}
                  >
                    {entry.summary}
                  </p>
                  <span
                    style={{
                      display: "inline-flex",
                      marginTop: "0.75rem",
                      fontSize: "0.78rem",
                      fontWeight: 900,
                      color: "#3560bf",
                    }}
                  >
                    문서 열기
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DocsShell>
  );
}
