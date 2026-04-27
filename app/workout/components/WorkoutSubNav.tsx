"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { clearWorkoutSession } from "../storage";
import { useWorkoutSession } from "../useWorkoutSession";

const TABS = [
  { href: "/workout", label: "홈", match: (p: string) => p === "/workout" },
  { href: "/workout/run", label: "러닝", match: (p: string) => p.startsWith("/workout/run") },
  { href: "/workout/weight", label: "웨이트", match: (p: string) => p.startsWith("/workout/weight") },
  { href: "/workout/activity", label: "활동", match: (p: string) => p.startsWith("/workout/activity") },
];

export default function WorkoutSubNav() {
  const pathname = usePathname() || "";
  const session = useWorkoutSession();

  return (
    <StWrap>
      <StInner>
        <StTabs>
          {TABS.map((tab) => {
            const active = tab.match(pathname);
            return (
              <StTabLink key={tab.href} href={tab.href} $active={active}>
                {tab.label}
              </StTabLink>
            );
          })}
        </StTabs>

        {session ? (
          <StRoom>
            <StRoomName>🏠 {session.roomName}</StRoomName>
            <StLogout type="button" onClick={() => clearWorkoutSession()}>
              나가기
            </StLogout>
          </StRoom>
        ) : null}
      </StInner>
    </StWrap>
  );
}

const StWrap = styled.nav`
  position: sticky;
  top: 0;
  z-index: 5;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: saturate(180%) blur(10px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StInner = styled.div`
  max-width: 720px;
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-width: 0;

  @media (max-width: 540px) {
    padding: 0.6rem 0.75rem;
    gap: 0.4rem;
  }
`;

const StTabs = styled.div`
  display: flex;
  gap: 0.35rem;
  padding: 0.25rem;
  background: ${({ theme }) => theme.colors.gray100};
  border-radius: 0.8rem;
  min-width: 0;

  @media (max-width: 540px) {
    gap: 0.15rem;
    padding: 0.2rem;
  }
`;

const StTabLink = styled(Link)<{ $active: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.6rem;
  font-size: 0.85rem;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;

  @media (max-width: 540px) {
    padding: 0.4rem 0.55rem;
    font-size: 0.78rem;
  }
  background: ${({ $active, theme }) =>
    $active ? theme.colors.white : "transparent"};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.blue600 : theme.colors.gray500};
  box-shadow: ${({ $active }) =>
    $active ? "0 2px 6px rgba(41, 58, 92, 0.08)" : "none"};
  transition: all 0.15s;

  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StRoom = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StRoomName = styled.span`
  font-size: 0.78rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray600};

  @media (max-width: 500px) {
    display: none;
  }
`;

const StLogout = styled.button`
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.4rem 0.7rem;
  border-radius: 0.6rem;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;

  @media (max-width: 540px) {
    font-size: 0.72rem;
    padding: 0.35rem 0.55rem;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.rose600};
    border-color: ${({ theme }) => theme.colors.rose200};
  }
`;
