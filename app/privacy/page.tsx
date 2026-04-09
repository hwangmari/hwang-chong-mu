"use client";

import styled from "styled-components";
import PageIntro from "@/components/common/PageIntro";
import {
  StContainer,
  StWrapper,
  StSection,
} from "@/components/styled/layout.styled";

const PRIVACY_SECTIONS = [
  {
    title: "1. 수집하는 개인정보 항목",
    content:
      "황총무의 실험실은 서비스 이용 과정에서 아래와 같은 정보를 수집할 수 있습니다.\n\n- 약속 잡기, 장소잡기: 사용자가 입력한 닉네임, 투표 내역\n- 가계부: 수입/지출 내역 (로컬 및 Supabase 저장)\n- 습관 관리, 일일 기록: 사용자가 직접 입력한 기록 데이터\n- 체중 관리: 사용자가 입력한 체중, 식단 기록\n- 자동 수집: 서비스 이용 기록, 접속 로그, 쿠키",
  },
  {
    title: "2. 개인정보의 수집 및 이용 목적",
    content:
      "수집된 정보는 아래 목적으로만 활용됩니다.\n\n- 서비스 제공 및 기능 개선\n- 사용자 요청에 따른 데이터 저장 및 조회\n- 서비스 이용 통계 분석\n- 광고 게재 (Google AdSense)",
  },
  {
    title: "3. 개인정보의 보유 및 이용 기간",
    content:
      "사용자의 개인정보는 서비스 이용 기간 동안 보유하며, 사용자가 삭제를 요청할 경우 지체 없이 파기합니다. 서비스 탈퇴 또는 데이터 삭제 요청 시 관련 데이터는 즉시 삭제됩니다.",
  },
  {
    title: "4. 개인정보의 제3자 제공",
    content:
      "황총무의 실험실은 사용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우 예외로 합니다.\n\n- 사용자가 사전에 동의한 경우\n- 법령의 규정에 의하거나 수사 목적으로 법령에 정해진 절차에 따른 요청이 있는 경우",
  },
  {
    title: "5. 광고 및 쿠키",
    content:
      "본 서비스는 Google AdSense를 통해 광고를 게재하고 있습니다. Google은 사용자의 관심사에 기반한 광고를 표시하기 위해 쿠키를 사용할 수 있습니다.\n\n- 사용자는 브라우저 설정에서 쿠키를 비활성화할 수 있습니다.\n- Google의 광고 쿠키 사용에 대한 자세한 내용은 Google 개인정보처리방침(https://policies.google.com/privacy)을 참고하시기 바랍니다.",
  },
  {
    title: "6. 개인정보 보호를 위한 기술적 대책",
    content:
      "- 데이터 전송 시 SSL/TLS 암호화 적용\n- Supabase Row Level Security(RLS)를 통한 데이터 접근 제어\n- 민감 정보의 서버 사이드 관리 (API 키 등)",
  },
  {
    title: "7. 개인정보 관리 책임자",
    content:
      "성명: 황혜경\n이메일: hwangmari@naver.com\n\n개인정보와 관련한 문의사항이 있으시면 위 이메일로 연락해 주시기 바랍니다.",
  },
  {
    title: "8. 개인정보처리방침 변경",
    content:
      "이 개인정보처리방침은 2025년 3월 1일부터 적용됩니다. 법령이나 서비스 변경에 따라 내용이 추가, 삭제 또는 수정될 수 있으며, 변경 시 사이트를 통해 공지합니다.",
  },
];

export default function PrivacyPage() {
  return (
    <StContainer>
      <StWrapper>
        <PageIntro
          icon="🔒"
          title="개인정보처리방침"
          description="황총무의 실험실의 개인정보 처리에 관한 안내입니다."
        />

        <StSection>
          <StLastUpdated>최종 수정일: 2025년 3월 1일</StLastUpdated>

          {PRIVACY_SECTIONS.map((section) => (
            <StPrivacyBlock key={section.title}>
              <StSectionTitle>{section.title}</StSectionTitle>
              <StSectionContent>{section.content}</StSectionContent>
            </StPrivacyBlock>
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

const StPrivacyBlock = styled.div`
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
