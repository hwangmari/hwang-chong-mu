"use client";

import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { createPortal } from "react-dom";

interface InstallGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallGuide({ isOpen, onClose }: InstallGuideProps) {
  const [os, setOs] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes("iphone") || userAgent.includes("ipad")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOs("ios");
    } else if (userAgent.includes("android")) {
      setOs("android");
    }
  }, []);

  if (!isOpen) return null;

  return createPortal(
    <Overlay onClick={onClose}>
      <BottomSheet onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>📌 홈 화면에 추가하기</Title>
          <CloseButton onClick={onClose}>&times;</CloseButton>
        </Header>

        <Content>
          {os === "ios" ? (
            <GuideStep>
              <StepIcon>1️⃣</StepIcon>
              <StepText>
                Safari 하단의 <strong>공유 버튼</strong>{" "}
                <ShareIcon>📤</ShareIcon> 을 눌러주세요.
              </StepText>
              <StepIcon>2️⃣</StepIcon>
              <StepText>
                메뉴에서 <strong>&apos;홈 화면에 추가&apos;</strong>를 찾아
                선택하면 끝!
              </StepText>
            </GuideStep>
          ) : os === "android" ? (
            <GuideStep>
              <StepIcon>1️⃣</StepIcon>
              <StepText>
                브라우저 우측 상단의 <strong>메뉴(⋮)</strong>를 눌러주세요.
              </StepText>
              <StepIcon>2️⃣</StepIcon>
              <StepText>
                <strong>&apos;홈 화면에 추가&apos;</strong> 또는{" "}
                <strong>&apos;앱 설치&apos;</strong>를 선택하세요.
              </StepText>
            </GuideStep>
          ) : (
            <GuideStep>
              <StepText>
                브라우저의 <strong>북마크(Ctrl+D)</strong> 기능을 이용해
                <br />이 페이지를 저장해주세요! ⭐️
              </StepText>
            </GuideStep>
          )}
        </Content>
      </BottomSheet>
    </Overlay>,
    document.body
  );
}

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end; /* 바텀시트 형태 */
  justify-content: center;
`;

const BottomSheet = styled.div`
  background: ${({ theme }) => theme.colors.white};
  width: 100%;
  max-width: 420px;
  border-radius: 24px 24px 0 0;
  padding: 1.5rem 1.5rem 2.5rem;
  animation: ${slideUp} 0.3s ease-out;
  position: relative;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Title = styled.h2`
  font-size: 1.1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray800};
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: ${({ theme }) => theme.colors.gray400};
  cursor: pointer;
  padding: 0.5rem;
`;

const Content = styled.div`
  background: ${({ theme }) => theme.colors.gray100};
  padding: 1.5rem;
  border-radius: 16px;
`;

const GuideStep = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StepIcon = styled.div`
  font-size: 1.2rem;
  margin-bottom: -0.5rem;
`;

const StepText = styled.p`
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.gray700};
  line-height: 1.6;

  strong {
    color: ${({ theme }) => theme.colors.blue600};
    font-weight: 700;
  }
`;

const ShareIcon = styled.span`
  display: inline-block;
  font-size: 1.1rem;
`;
