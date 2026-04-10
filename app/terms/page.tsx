"use client";

import styled from "styled-components";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StWrapper,
  StSection,
} from "@/components/styled/layout.styled";

const TERMS_SECTIONS = [
  {
    title: "1. 목적",
    content:
      "이 약관은 황총무의 실험실(이하 '서비스')의 이용 조건 및 절차, 이용자와 운영자의 권리·의무에 관한 사항을 규정하는 것을 목적으로 합니다.",
  },
  {
    title: "2. 서비스의 내용",
    content:
      "서비스는 약속 잡기, 장소잡기, N빵 계산기, 야근 계산기, 가계부, 습관 관리, 일일 기록, 체중 관리, 게임방, 업무 캘린더 등 일상 편의 도구를 무료로 제공합니다.\n\n서비스의 기능은 사전 공지 없이 추가, 변경 또는 중단될 수 있습니다.",
  },
  {
    title: "3. 이용자의 의무",
    content:
      "이용자는 서비스 이용 시 다음 행위를 하여서는 안 됩니다.\n\n- 타인의 정보를 도용하거나 허위 정보를 입력하는 행위\n- 서비스의 정상적인 운영을 방해하는 행위\n- 서비스를 이용하여 법령 또는 공서양속에 반하는 행위\n- 서비스의 데이터를 무단으로 수집하거나 상업적으로 이용하는 행위",
  },
  {
    title: "4. 서비스 이용의 제한",
    content:
      "운영자는 이용자가 본 약관을 위반하거나 서비스의 정상적인 운영을 방해하는 경우, 사전 통보 없이 서비스 이용을 제한할 수 있습니다.",
  },
  {
    title: "5. 면책 조항",
    content:
      "서비스는 개인 프로젝트로 운영되며, 서비스 이용으로 발생하는 직접적·간접적 손해에 대해 운영자는 책임을 지지 않습니다.\n\n- 서비스 장애, 데이터 손실 등에 대한 보상 의무가 없습니다.\n- 이용자가 입력한 데이터의 정확성에 대한 책임은 이용자 본인에게 있습니다.\n- 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임지지 않습니다.",
  },
  {
    title: "6. 광고 게재",
    content:
      "서비스는 Google AdSense를 통해 광고를 게재할 수 있습니다. 광고와 관련된 거래 및 책임은 광고주와 이용자 간에 발생하며, 운영자는 이에 대해 책임을 지지 않습니다.",
  },
  {
    title: "7. 지적 재산권",
    content:
      "서비스에 포함된 디자인, 코드, 콘텐츠 등의 지적 재산권은 운영자에게 있습니다. 이용자는 운영자의 사전 동의 없이 이를 복제, 배포, 상업적으로 이용할 수 없습니다.",
  },
  {
    title: "8. 약관의 변경",
    content:
      "이 약관은 2026년 4월 10일부터 적용됩니다. 운영자는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은 사이트를 통해 공지합니다.",
  },
];

export default function TermsPage() {
  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          icon="📋"
          title="이용약관"
          description="황총무의 실험실 서비스 이용에 관한 약관입니다."
        />

        <StSection>
          <StLastUpdated>최종 수정일: 2026년 4월 10일</StLastUpdated>

          {TERMS_SECTIONS.map((section) => (
            <StTermsBlock key={section.title}>
              <StSectionTitle>{section.title}</StSectionTitle>
              <StSectionContent>{section.content}</StSectionContent>
            </StTermsBlock>
          ))}
        </StSection>
      </StWrapper>
    </StContainer>
  );
}

const StLastUpdated = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray400};
  margin-bottom: 2rem;
`;

const StTermsBlock = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const StSectionTitle = styled.h3`
  font-size: 1.05rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.75rem;
`;

const StSectionContent = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray600};
  line-height: 1.8;
  white-space: pre-wrap;
`;
