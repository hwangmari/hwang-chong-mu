"use client";

import styled from "styled-components";

interface NavGroup {
  title: string;
  items: readonly { id: string; label: string }[];
}

interface UiKitLeftRailProps {
  groups: readonly NavGroup[];
  activeHash: string;
}

export function UiKitLeftRail({ groups, activeHash }: UiKitLeftRailProps) {
  return (
    <LeftRail>
      <RailCard>
        {groups.map((group) => (
          <NavGroupWrap key={group.title}>
            <NavGroupTitle>{group.title}</NavGroupTitle>
            <NavList>
              {group.items.map((item) => (
                <NavItem key={item.id}>
                  <NavLink
                    href={`#${item.id}`}
                    $active={activeHash === `#${item.id}`}
                  >
                    {item.label}
                  </NavLink>
                </NavItem>
              ))}
            </NavList>
          </NavGroupWrap>
        ))}
      </RailCard>
    </LeftRail>
  );
}

const LeftRail = styled.aside`
  position: sticky;
  top: calc(3.5rem + 1rem);
  flex: 0 0 240px;
  max-height: calc(100vh - 5rem);

  @media ${({ theme }) => theme.media.mobile} {
    position: static;
    width: 100%;
    max-height: none;
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

const NavGroupWrap = styled.div`
  display: grid;
  gap: 0.5rem;
`;

const NavGroupTitle = styled.div`
  font-size: 0.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray500};
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

const NavLink = styled.a<{ $active: boolean }>`
  display: block;
  padding: 0.7rem 0.85rem;
  border-radius: 0.9rem;
  color: ${({ theme, $active }) =>
    $active ? theme.colors.blue700 : theme.colors.gray700};
  font-size: 0.95rem;
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
