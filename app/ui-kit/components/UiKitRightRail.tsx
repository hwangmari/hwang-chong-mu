"use client";

import styled from "styled-components";
import { Typography } from "@hwangchongmu/ui";

interface UiKitRightRailProps {
  items: readonly { id: string; label: string }[];
  activeHash: string;
}

export function UiKitRightRail({ items, activeHash }: UiKitRightRailProps) {
  return (
    <RightRail>
      <RailCard>
        <Typography as="h2" variant="h4">
          On This Page
        </Typography>
        <NavList>
          {items.map((item) => (
            <NavItem key={item.id}>
              <RailLink
                href={`#${item.id}`}
                $active={activeHash === `#${item.id}`}
              >
                {item.label}
              </RailLink>
            </NavItem>
          ))}
        </NavList>
      </RailCard>
    </RightRail>
  );
}

const RightRail = styled.aside`
  position: sticky;
  top: calc(3.5rem + 1rem);
  flex: 0 0 220px;
  max-height: calc(100vh - 5rem);

  @media ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

const RailCard = styled.div`
  display: grid;
  gap: 1rem;
  padding: 1rem;
  max-height: inherit;
  overflow-y: auto;
  border-radius: 1.25rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.04);
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.35rem;
`;

const NavItem = styled.li`
  display: block;
`;

const RailLink = styled.a<{ $active: boolean }>`
  display: block;
  padding: 0.45rem 0.6rem;
  border-radius: 0.9rem;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.blue700 : theme.colors.gray700};
  font-size: 0.88rem;
  font-weight: ${({ $active }) => ($active ? 800 : 600)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.blue50 : "transparent"};
  border: 1px solid
    ${({ theme, $active }) =>
      $active ? theme.colors.blue100 : "transparent"};

  &:hover {
    background: ${({ theme }) => theme.colors.blue50};
    color: ${({ theme }) => theme.colors.blue700};
  }
`;
