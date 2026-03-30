"use client";

import Link from "next/link";
import React, { ReactNode } from "react";
import styled from "styled-components";

type Props = {
  content: string;
  currentSlug: string[];
  isIndex?: boolean;
};

type Block =
  | { type: "heading"; level: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "code"; code: string; language: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "hr" };

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function isTableSeparator(line: string) {
  return /^\|(?:\s*:?-{3,}:?\s*\|)+$/.test(line.trim());
}

function parseTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function normalizePathSegments(segments: string[]) {
  const stack: string[] = [];

  segments.forEach((segment) => {
    if (!segment || segment === ".") return;
    if (segment === "..") {
      stack.pop();
      return;
    }
    stack.push(segment);
  });

  return stack;
}

function tokenizeMarkdown(content: string): Block[] {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let index = 0;

  while (index < lines.length) {
    const rawLine = lines[index];
    const line = rawLine.trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.replace(/^```/, "").trim();
      index += 1;
      const codeLines: string[] = [];

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) index += 1;
      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        language,
      });
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        level: headingMatch[1].length,
        text: headingMatch[2].trim(),
      });
      index += 1;
      continue;
    }

    if (/^---+$/.test(line)) {
      blocks.push({ type: "hr" });
      index += 1;
      continue;
    }

    if (
      line.startsWith("|") &&
      index + 1 < lines.length &&
      isTableSeparator(lines[index + 1].trim())
    ) {
      const headers = parseTableRow(lines[index]);
      index += 2;
      const rows: string[][] = [];

      while (index < lines.length && lines[index].trim().startsWith("|")) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (/^\s*-\s+/.test(rawLine) || /^\s*\d+\.\s+/.test(rawLine)) {
      const ordered = /^\s*\d+\.\s+/.test(rawLine);
      const items: string[] = [];

      while (index < lines.length) {
        const candidate = lines[index];
        const matches = ordered
          ? /^\s*\d+\.\s+/.test(candidate)
          : /^\s*-\s+/.test(candidate);

        if (matches) {
          items.push(candidate.replace(/^\s*(?:-\s+|\d+\.\s+)/, "").trim());
          index += 1;
          continue;
        }

        if (candidate.trim() && items.length > 0) {
          items[items.length - 1] = `${items[items.length - 1]} ${candidate.trim()}`;
          index += 1;
          continue;
        }

        break;
      }

      blocks.push({ type: "list", ordered, items });
      continue;
    }

    const paragraphLines: string[] = [line];
    index += 1;

    while (index < lines.length) {
      const next = lines[index].trim();
      if (
        !next ||
        next.startsWith("```") ||
        /^(#{1,6})\s+/.test(next) ||
        /^---+$/.test(next) ||
        next.startsWith("|") ||
        /^\s*-\s+/.test(lines[index]) ||
        /^\s*\d+\.\s+/.test(lines[index])
      ) {
        break;
      }
      paragraphLines.push(next);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      text: paragraphLines.join(" "),
    });
  }

  return blocks;
}

function resolveDocHref(url: string, currentSlug: string[], isIndex: boolean) {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return { href: url, external: true };
  }

  if (url.startsWith("#")) {
    return { href: url, external: false };
  }

  if (url.startsWith("/")) {
    return { href: url, external: false };
  }

  if (url.endsWith(".md") || url.startsWith("./") || url.startsWith("../")) {
    const currentDir = isIndex
      ? currentSlug.join("/")
      : currentSlug.slice(0, -1).join("/");
    const baseSegments = currentDir ? currentDir.split("/") : [];
    const urlSegments = url.split("/");
    const normalizedSegments = normalizePathSegments([
      ...baseSegments,
      ...urlSegments,
    ]);
    const normalizedPath = normalizedSegments.join("/");
    const withoutExt = normalizedPath.replace(/\.md$/, "").replace(/\/README$/, "");

    if (!withoutExt) return { href: "/docs", external: false };
    return { href: `/docs/${withoutExt}`, external: false };
  }

  return { href: url, external: false };
}

function renderInline(
  text: string,
  currentSlug: string[],
  isIndex: boolean,
): ReactNode[] {
  const tokenRegex = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null = null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];

    if (token.startsWith("`")) {
      nodes.push(<InlineCode key={`${match.index}-code`}>{token.slice(1, -1)}</InlineCode>);
    } else if (token.startsWith("**")) {
      nodes.push(<strong key={`${match.index}-strong`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("[")) {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, label, url] = linkMatch;
        const target = resolveDocHref(url, currentSlug, isIndex);
        if (target.external) {
          nodes.push(
            <InlineAnchor
              key={`${match.index}-link`}
              href={target.href}
              target="_blank"
              rel="noreferrer"
            >
              {label}
            </InlineAnchor>,
          );
        } else {
          nodes.push(
            <InlineLink key={`${match.index}-link`} href={target.href}>
              {label}
            </InlineLink>,
          );
        }
      } else {
        nodes.push(token);
      }
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

export default function MarkdownRenderer({
  content,
  currentSlug,
  isIndex = false,
}: Props) {
  const blocks = tokenizeMarkdown(content);

  return (
    <Article>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const id = slugify(block.text);
          if (block.level === 1) {
            return (
              <Heading1 id={id} key={`${block.type}-${index}`}>
                {renderInline(block.text, currentSlug, isIndex)}
              </Heading1>
            );
          }
          if (block.level === 2) {
            return (
              <Heading2 id={id} key={`${block.type}-${index}`}>
                {renderInline(block.text, currentSlug, isIndex)}
              </Heading2>
            );
          }
          if (block.level === 3) {
            return (
              <Heading3 id={id} key={`${block.type}-${index}`}>
                {renderInline(block.text, currentSlug, isIndex)}
              </Heading3>
            );
          }
          return (
            <Heading4 id={id} key={`${block.type}-${index}`}>
              {renderInline(block.text, currentSlug, isIndex)}
            </Heading4>
          );
        }

        if (block.type === "paragraph") {
          return (
            <Paragraph key={`${block.type}-${index}`}>
              {renderInline(block.text, currentSlug, isIndex)}
            </Paragraph>
          );
        }

        if (block.type === "list") {
          const ListTag = block.ordered ? OrderedList : UnorderedList;
          return (
            <ListTag key={`${block.type}-${index}`}>
              {block.items.map((item, itemIndex) => (
                <li key={`${index}-${itemIndex}`}>
                  {renderInline(item, currentSlug, isIndex)}
                </li>
              ))}
            </ListTag>
          );
        }

        if (block.type === "code") {
          return (
            <CodeBlock key={`${block.type}-${index}`}>
              {block.language ? <CodeLanguage>{block.language}</CodeLanguage> : null}
              <pre>
                <code>{block.code}</code>
              </pre>
            </CodeBlock>
          );
        }

        if (block.type === "table") {
          return (
            <TableWrap key={`${block.type}-${index}`}>
              <Table>
                <thead>
                  <tr>
                    {block.headers.map((header, headerIndex) => (
                      <th key={`${index}-header-${headerIndex}`}>
                        {renderInline(header, currentSlug, isIndex)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, rowIndex) => (
                    <tr key={`${index}-row-${rowIndex}`}>
                      {row.map((cell, cellIndex) => (
                        <td key={`${index}-${rowIndex}-${cellIndex}`}>
                          {renderInline(cell, currentSlug, isIndex)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          );
        }

        return <Divider key={`${block.type}-${index}`} />;
      })}
    </Article>
  );
}

const Article = styled.article`
  color: #203042;
  line-height: 1.75;
`;

const baseHeading = `
  scroll-margin-top: 6rem;
  font-weight: 900;
  color: #142132;
`;

const Heading1 = styled.h1`
  ${baseHeading}
  font-size: clamp(2rem, 3vw, 2.6rem);
  line-height: 1.15;
  margin-bottom: 1.1rem;
`;

const Heading2 = styled.h2`
  ${baseHeading}
  font-size: 1.45rem;
  margin-top: 2.2rem;
  margin-bottom: 0.9rem;
  padding-top: 0.3rem;
`;

const Heading3 = styled.h3`
  ${baseHeading}
  font-size: 1.12rem;
  margin-top: 1.6rem;
  margin-bottom: 0.55rem;
`;

const Heading4 = styled.h4`
  ${baseHeading}
  font-size: 1rem;
  margin-top: 1.2rem;
  margin-bottom: 0.45rem;
`;

const Paragraph = styled.p`
  font-size: 0.98rem;
  color: #425569;
  margin-bottom: 0.9rem;
`;

const listBase = `
  margin: 0 0 1rem 1.2rem;
  color: #425569;

  li {
    margin-bottom: 0.38rem;
  }
`;

const UnorderedList = styled.ul`
  ${listBase}
  list-style: disc;
`;

const OrderedList = styled.ol`
  ${listBase}
  list-style: decimal;
`;

const CodeBlock = styled.section`
  margin: 1rem 0 1.2rem;
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid #d8e2ef;
  background: #0f1724;

  pre {
    margin: 0;
    padding: 1rem 1.1rem 1.15rem;
    overflow-x: auto;
  }

  code {
    color: #e5eef8;
    font-size: 0.88rem;
    font-family:
      "SFMono-Regular",
      ui-monospace,
      "Cascadia Code",
      "Source Code Pro",
      Menlo,
      monospace;
  }
`;

const CodeLanguage = styled.div`
  padding: 0.55rem 0.9rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.74rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #91a4ba;
  background: rgba(255, 255, 255, 0.04);
`;

const TableWrap = styled.div`
  margin: 1rem 0 1.2rem;
  overflow-x: auto;
  border: 1px solid #dce5f0;
  border-radius: 20px;
  background: #fff;
`;

const Table = styled.table`
  width: 100%;
  min-width: 36rem;
  border-collapse: collapse;

  th,
  td {
    padding: 0.85rem 0.95rem;
    text-align: left;
    border-bottom: 1px solid #e7edf4;
    vertical-align: top;
    font-size: 0.9rem;
  }

  th {
    background: #f6f9fd;
    color: #213248;
    font-weight: 900;
  }

  td {
    color: #4a5d73;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px dashed #dbe4ef;
  margin: 1.5rem 0;
`;

const InlineCode = styled.code`
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  background: #eef4fb;
  color: #2d5a8b;
  padding: 0.05rem 0.38rem;
  font-size: 0.9em;
  font-family:
    "SFMono-Regular",
    ui-monospace,
    Menlo,
    monospace;
`;

const InlineLink = styled(Link)`
  color: #2f66c7;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const InlineAnchor = styled.a`
  color: #2f66c7;
  font-weight: 700;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;
