"use client";

import Link from "next/link";
import styled from "styled-components";

type NavDocEntry = {
  href: string;
  title: string;
  summary: string;
};

type Props = {
  currentHref: string;
  title: string;
  description: string;
  sections: Array<{
    key: string;
    label: string;
    entries: NavDocEntry[];
  }>;
  children: React.ReactNode;
};

export default function DocsShell({
  currentHref,
  title,
  description,
  sections,
  children,
}: Props) {
  return (
    <PageShell>
      <HeroCard>
        <HeroEyebrow>Docs</HeroEyebrow>
        <HeroTitle>{title}</HeroTitle>
        <HeroDescription>{description}</HeroDescription>
      </HeroCard>

      <Layout>
        <Sidebar>
          <SidebarInner>
            <SidebarHomeLink href="/docs" $active={currentHref === "/docs"}>
              문서 홈
            </SidebarHomeLink>

            {sections.map((section) => (
              <NavSection key={section.key}>
                <NavSectionTitle>{section.label}</NavSectionTitle>
                <NavList>
                  {section.entries.map((entry) => (
                    <NavItem key={entry.href}>
                      <NavLink href={entry.href} $active={entry.href === currentHref}>
                        <strong>{entry.title}</strong>
                        <span>{entry.summary}</span>
                      </NavLink>
                    </NavItem>
                  ))}
                </NavList>
              </NavSection>
            ))}
          </SidebarInner>
        </Sidebar>

        <MainPanel>{children}</MainPanel>
      </Layout>
    </PageShell>
  );
}

const PageShell = styled.main`
  min-height: 100vh;
  padding: 1.4rem;
  background:
    radial-gradient(circle at top left, rgba(84, 118, 214, 0.12), transparent 24%),
    linear-gradient(180deg, #f4f7fb 0%, #eef3f8 100%);
`;

const HeroCard = styled.header`
  max-width: 1400px;
  margin: 0 auto 1rem;
  padding: 1.3rem 1.4rem;
  border-radius: 28px;
  border: 1px solid #d8e2ef;
  background:
    radial-gradient(circle at top right, rgba(132, 168, 255, 0.17), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(244, 248, 253, 0.98));
  box-shadow: 0 24px 48px rgba(84, 106, 140, 0.08);
`;

const HeroEyebrow = styled.p`
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #6e83a2;
`;

const HeroTitle = styled.h1`
  margin-top: 0.28rem;
  font-size: clamp(1.8rem, 3vw, 2.4rem);
  font-weight: 900;
  color: #172435;
`;

const HeroDescription = styled.p`
  margin-top: 0.55rem;
  max-width: 52rem;
  font-size: 0.95rem;
  line-height: 1.65;
  color: #5e7087;
`;

const Layout = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 1rem;
  align-items: start;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 1rem;

  @media (max-width: 1080px) {
    position: static;
  }
`;

const SidebarInner = styled.div`
  border: 1px solid #d9e3ef;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.94);
  padding: 0.9rem;
  box-shadow: 0 18px 44px rgba(83, 103, 136, 0.06);
`;

const SidebarHomeLink = styled(Link)<{ $active: boolean }>`
  display: block;
  margin-bottom: 0.8rem;
  border-radius: 16px;
  border: 1px solid ${({ $active }) => ($active ? "#a9bdf6" : "#d8e2ee")};
  background: ${({ $active, theme }) => ($active ? "#eef3ff" : theme.colors.blue50)};
  color: ${({ $active }) => ($active ? "#395fb7" : "#546b89")};
  padding: 0.78rem 0.9rem;
  font-size: 0.88rem;
  font-weight: 900;
  text-decoration: none;
`;

const NavSection = styled.section`
  margin-top: 0.9rem;
`;

const NavSectionTitle = styled.h2`
  margin-bottom: 0.45rem;
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #73859f;
`;

const NavList = styled.ul`
  display: grid;
  gap: 0.45rem;
`;

const NavItem = styled.li`
  list-style: none;
`;

const NavLink = styled(Link)<{ $active: boolean }>`
  display: block;
  border-radius: 18px;
  border: 1px solid ${({ $active }) => ($active ? "#a9bdf6" : "#e2e9f2")};
  background: ${({ $active, theme }) => ($active ? "#eef3ff" : theme.colors.white)};
  padding: 0.72rem 0.78rem;
  text-decoration: none;

  strong {
    display: block;
    font-size: 0.86rem;
    font-weight: 900;
    color: ${({ $active }) => ($active ? "#2f56b4" : "#22324a")};
  }

  span {
    display: block;
    margin-top: 0.18rem;
    font-size: 0.74rem;
    line-height: 1.5;
    color: #708096;
  }
`;

const MainPanel = styled.section`
  min-width: 0;
  border: 1px solid #d9e3ef;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 48px rgba(83, 103, 136, 0.08);
  padding: 1.25rem;
`;
