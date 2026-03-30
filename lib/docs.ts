import { promises as fs } from "fs";
import path from "path";

export type DocEntry = {
  slug: string[];
  href: string;
  title: string;
  summary: string;
  filePath: string;
  relativePath: string;
  section: string;
  isIndex: boolean;
};

export type DocDetail = DocEntry & {
  content: string;
};

const DOCS_ROOT = path.join(process.cwd(), "docs");

const SECTION_LABELS: Record<string, string> = {
  root: "대표 문서",
  "menu-details": "메뉴별 상세 문서",
};

const ROOT_ORDER = ["hwang-chong-mu-menu-analysis"];
const MENU_ORDER = [
  "meeting",
  "calc",
  "account-book",
  "habit",
  "daily",
  "diet",
  "game",
  "schedule",
  "portfolio",
];

function buildHref(slug: string[]) {
  if (slug.length === 0) return "/docs";
  return `/docs/${slug.join("/")}`;
}

function extractTitle(content: string, fallback: string) {
  const lines = content.split(/\r?\n/);
  const headingLine = lines.find((line) => line.startsWith("# "));
  return headingLine ? headingLine.replace(/^#\s+/, "").trim() : fallback;
}

function extractSummary(content: string) {
  const lines = content.split(/\r?\n/);
  let foundTitle = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (!foundTitle && trimmed.startsWith("# ")) {
      foundTitle = true;
      continue;
    }
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("|") ||
      trimmed.startsWith("```")
    ) {
      continue;
    }
    return trimmed;
  }

  return "문서 요약이 아직 없습니다.";
}

async function walkMarkdownFiles(dir: string, nestedParts: string[] = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    if (entry.isDirectory()) {
      files.push(
        ...(await walkMarkdownFiles(path.join(dir, entry.name), [
          ...nestedParts,
          entry.name,
        ])),
      );
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(path.join(dir, entry.name));
    }
  }

  return files;
}

function compareDocEntry(a: DocEntry, b: DocEntry) {
  const aSection = a.section;
  const bSection = b.section;

  if (aSection !== bSection) {
    if (aSection === "root") return -1;
    if (bSection === "root") return 1;
    return aSection.localeCompare(bSection);
  }

  if (a.section === "root") {
    const aIndex = ROOT_ORDER.indexOf(a.slug[0] || "");
    const bIndex = ROOT_ORDER.indexOf(b.slug[0] || "");
    if (aIndex !== bIndex) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
  }

  if (a.section === "menu-details") {
    const aKey = a.slug[a.slug.length - 1] || "";
    const bKey = b.slug[b.slug.length - 1] || "";
    const aIndex = MENU_ORDER.indexOf(aKey);
    const bIndex = MENU_ORDER.indexOf(bKey);
    if (aIndex !== bIndex) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
  }

  if (a.isIndex !== b.isIndex) {
    return a.isIndex ? -1 : 1;
  }

  return a.title.localeCompare(b.title, "ko");
}

export function getSectionLabel(section: string) {
  return SECTION_LABELS[section] || section;
}

export async function getDocEntries() {
  const markdownFiles = await walkMarkdownFiles(DOCS_ROOT);

  const docs = await Promise.all(
    markdownFiles.map(async (absolutePath) => {
      const relativePath = path.relative(DOCS_ROOT, absolutePath);
      const raw = await fs.readFile(absolutePath, "utf8");
      const parsed = path.parse(relativePath);
      const relativeParts = parsed.dir ? parsed.dir.split(path.sep) : [];
      const isIndex = parsed.name.toLowerCase() === "readme";
      const slug = isIndex ? relativeParts : [...relativeParts, parsed.name];
      const section = relativeParts[0] || "root";
      const fallbackTitle = parsed.name;

      return {
        slug,
        href: buildHref(slug),
        title: extractTitle(raw, fallbackTitle),
        summary: extractSummary(raw),
        filePath: absolutePath,
        relativePath: relativePath.replace(/\\/g, "/"),
        section,
        isIndex,
      } satisfies DocEntry;
    }),
  );

  return docs.sort(compareDocEntry);
}

export async function getDocBySlug(slug: string[]) {
  const normalizedSlug = slug.filter(Boolean);
  const directPath = path.join(DOCS_ROOT, ...normalizedSlug) + ".md";
  const readmePath = path.join(DOCS_ROOT, ...normalizedSlug, "README.md");

  const candidates = [directPath, readmePath];

  for (const candidate of candidates) {
    try {
      const stat = await fs.stat(candidate);
      if (!stat.isFile()) continue;

      const content = await fs.readFile(candidate, "utf8");
      const relativePath = path.relative(DOCS_ROOT, candidate).replace(/\\/g, "/");
      const parsed = path.parse(relativePath);
      const relativeParts = parsed.dir ? parsed.dir.split("/") : [];
      const isIndex = parsed.name.toLowerCase() === "readme";
      const actualSlug = isIndex ? relativeParts : [...relativeParts, parsed.name];
      const section = relativeParts[0] || "root";

      return {
        slug: actualSlug,
        href: buildHref(actualSlug),
        title: extractTitle(content, parsed.name),
        summary: extractSummary(content),
        filePath: candidate,
        relativePath,
        section,
        isIndex,
        content,
      } satisfies DocDetail;
    } catch {
      continue;
    }
  }

  return null;
}
