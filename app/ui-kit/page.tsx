"use client";

import { useEffect, useState } from "react";
import styled from "styled-components";
import { leftNav, buttonToc } from "./content";
import { UiKitHero } from "./components/UiKitHero";
import { UiKitLeftRail } from "./components/UiKitLeftRail";
import { UiKitMainContent } from "./components/UiKitMainContent";
import { UiKitRightRail } from "./components/UiKitRightRail";

export default function UiKitPage() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeHash, setActiveHash] = useState("#overview");

  useEffect(() => {
    function syncHash() {
      setActiveHash(window.location.hash || "#overview");
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  async function handleCopy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedCode(label);
      window.setTimeout(() => {
        setCopiedCode((current) => (current === label ? null : current));
      }, 1500);
    } catch {
      setCopiedCode(null);
    }
  }

  return (
    <PageShell>
      <UiKitHero foundationCount={2} componentCount={3} />

      <DocsLayout>
        <UiKitLeftRail groups={leftNav} activeHash={activeHash} />
        <UiKitMainContent copiedCode={copiedCode} onCopy={handleCopy} />
        <UiKitRightRail items={buttonToc} activeHash={activeHash} />
      </DocsLayout>
    </PageShell>
  );
}

const PageShell = styled.main`
  margin: 0 auto;
  padding: 2rem 1.25rem 6rem;
  display: grid;
  gap: 1.5rem;
`;

const DocsLayout = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;

  @media ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
  }
`;
