"use client";

import Link from "next/link";
import styled, { keyframes } from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import { SkeletonBlock } from "@/components/common/Skeleton";
import { byId } from "@/lib/services";

// 로그인하면 한 계정에 이어지는 대표 서비스 6개 — 상자 옆에서 천천히 도는 아이콘 링
const ORBIT_SERVICES = ["meeting", "calc", "account-book", "workout", "tennis", "gift-log"] as const;

function OrbitIcons() {
  return (
    <StOrbit aria-hidden="true">
      <StOrbitCore>✨</StOrbitCore>
      <StOrbitRing>
        {ORBIT_SERVICES.map((id, index) => (
          <StOrbitItem key={id} $index={index} $total={ORBIT_SERVICES.length}>
            <span>{byId(id).icon}</span>
          </StOrbitItem>
        ))}
      </StOrbitRing>
    </StOrbit>
  );
}

// 메인의 계정 안내: 로그인 없이도 쓰지만, 로그인하면 여러 서비스를 한 계정으로 이어서 쓸 수 있다는 안내.
// 로그인 전: 로그인/회원가입으로, 로그인 후: 내 서비스 요약으로.
export default function LoginInvite() {
  const { user, loading } = useAuth();
  // 로그인 확인 중: 빈 상자 대신 실제 배치(제목·설명·버튼) 모양의 스켈레톤으로 영역을 유지한다
  if (loading) {
    return (
      <StBox aria-busy="true" aria-label="계정 안내 불러오는 중">
        <StText>
          <SkeletonBlock width="14rem" height="1.15rem" />
          <SkeletonBlock width="min(34rem, 100%)" height="0.9rem" />
        </StText>
        <StActions>
          <SkeletonBlock width="9.5rem" height="2.6rem" radius="0.8rem" />
        </StActions>
      </StBox>
    );
  }

  return (
    <StBox>
      {!user && <OrbitIcons />}
      <StText>
        {user ? (
          <>
            <strong>{user.nickname}님, 다시 오셨네요 👋</strong>
            <span>연결해 둔 서비스와 최근 기록을 내 서비스 요약에서 한 번에 볼 수 있어요.</span>
          </>
        ) : (
          <>
            <strong>황총무가 마음에 드신다면, 로그인해서 이어 써 보세요</strong>
            <span>
              모든 도구는 로그인 없이 바로 쓸 수 있어요. 로그인하면 약속 잡기·여행 경비·가계부·운동 기록 같은 서비스를 한 계정에
              연결해 두고, 폰과 PC 어디서든 이어서 볼 수 있어요.
            </span>
          </>
        )}
      </StText>
      <StActions>
        {user ? (
          <StPrimary href="/my">✨ 내 서비스 요약 보기</StPrimary>
        ) : (
          <>
            <StPrimary href="/login">로그인 / 회원가입</StPrimary>
            <StGhost href="/my">어떻게 연결되나요?</StGhost>
          </>
        )}
      </StActions>
    </StBox>
  );
}

const StBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  min-height: 6.5rem;
  padding: 1.25rem 1.5rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.semantic.primaryLight};
  border: 1px solid ${({ theme }) => theme.colors.blue100};

  @media ${({ theme }) => theme.media.mobile} {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.1rem 1.15rem;
  }
`;

/* 링 전체가 한 바퀴, 아이콘은 반대로 돌아 항상 똑바로 보인다 */
const spin = keyframes`
  to { transform: rotate(360deg); }
`;
const counterSpin = keyframes`
  to { transform: rotate(-360deg); }
`;
const pop = keyframes`
  from { opacity: 0; transform: scale(0.4); }
  to { opacity: 1; transform: scale(1); }
`;

const ORBIT_SIZE = "6.25rem";
const ORBIT_PERIOD = "28s";

const StOrbit = styled.div`
  position: relative;
  flex: none;
  width: ${ORBIT_SIZE};
  height: ${ORBIT_SIZE};
  margin: -0.25rem 0.25rem -0.25rem 0;

  @media ${({ theme }) => theme.media.mobile} {
    display: none;
  }
`;

const StOrbitCore = styled.div`
  position: absolute;
  inset: 50% auto auto 50%;
  transform: translate(-50%, -50%);
  width: 2.1rem;
  height: 2.1rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1rem;
  background: ${({ theme }) => theme.colors.white};
  box-shadow: 0 2px 8px rgba(49, 130, 246, 0.18);
`;

const StOrbitRing = styled.div`
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed ${({ theme }) => theme.colors.blue100};
  animation: ${spin} ${ORBIT_PERIOD} linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/* 각 아이콘: 링 중심에서 각도만큼 돌린 뒤 반지름만큼 밀어 놓는다 */
const StOrbitItem = styled.div<{ $index: number; $total: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  width: 1.7rem;
  height: 1.7rem;
  margin: -0.85rem 0 0 -0.85rem;
  /* 아이콘 중심이 링 위에 놓이도록 반지름에서 아이콘 반폭만큼 뺀다 — 상자 밖으로 삐져나오지 않게 */
  transform: rotate(${({ $index, $total }) => ($index / $total) * 360}deg)
    translate(calc(${ORBIT_SIZE} / 2 - 0.85rem));

  span {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    font-size: 0.9rem;
    background: ${({ theme }) => theme.colors.white};
    box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
    /* 링 회전을 상쇄 + 처음 뜰 때 하나씩 뿅 */
    animation:
      ${counterSpin} ${ORBIT_PERIOD} linear infinite,
      ${pop} 360ms cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
    animation-delay: 0s, ${({ $index }) => 120 + $index * 90}ms;
  }

  @media (prefers-reduced-motion: reduce) {
    span {
      animation: none;
    }
  }
`;

const StText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
  flex: 1;
  strong {
    font-size: 1.05rem;
    color: ${({ theme }) => theme.semantic.text};
    word-break: keep-all;
  }
  span {
    font-size: 0.86rem;
    line-height: 1.55;
    color: ${({ theme }) => theme.semantic.subText};
    word-break: keep-all;
  }
`;

const StActions = styled.div`
  display: flex;
  gap: 0.5rem;
  flex: none;
  flex-wrap: wrap;
  @media ${({ theme }) => theme.media.mobile} {
    > a {
      flex: 1;
      text-align: center;
    }
  }
`;

const StPrimary = styled(Link)`
  padding: 0.7rem 1.1rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.semantic.primary};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 800;
  font-size: 0.92rem;
  text-decoration: none;
  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.amber500};
    outline-offset: 2px;
  }
`;

const StGhost = styled(Link)`
  padding: 0.7rem 1rem;
  border-radius: 0.8rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.semantic.primary};
  font-weight: 700;
  font-size: 0.92rem;
  text-decoration: none;
  border: 1px solid ${({ theme }) => theme.colors.blue100};
`;
