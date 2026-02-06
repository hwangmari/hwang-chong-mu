"use client";

import Image from "next/image";
import styled from "styled-components";
import Typography from "@/components/common/Typography";

export default function ProfileCard() {
  return (
    <StCardContainer>
      {/* 1. 프로필 이미지 영역 */}
      <StImageWrapper>
        {/* fill 속성을 사용하여 부모 크기에 꽉 차게 설정 */}
        <Image
          src="/images/hwang.png"
          alt="황혜경 프로필"
          fill
          style={{ objectFit: "cover" }}
          priority // 중요 이미지 우선 로딩
        />
      </StImageWrapper>

      {/* 2. 정보 텍스트 영역 */}
      <StInfoList>
        <InfoItem label="Update" value="@2025.12.26" />
        <InfoItem label="Writer" value="@linda.hwang" />
      </StInfoList>
    </StCardContainer>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <StInfoItem>
      <Typography variant="body2" color="gray500" className="label">
        {label}
      </Typography>
      <Typography variant="body1" color="gray900" className="value">
        {value}
      </Typography>
    </StInfoItem>
  );
}


const StCardContainer = styled.div`
  width: 100%;
  max-width: 180px;
  background-color: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 1.5rem;
  overflow: hidden; /* 자식 요소(이미지)가 둥근 모서리 넘치지 않게 */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); /* 부드러운 그림자 */
`;

const StImageWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1 / 1; /* 1:1 정사각형 비율 유지 */
  background-color: ${({ theme }) => theme.colors.gray100};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray100};
`;

const StInfoList = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StInfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;

  .label {
    font-weight: 600;
    font-size: 0.5rem;
    text-transform: uppercase; /* 라벨은 대문자로 깔끔하게 */
    letter-spacing: 0.05em;
  }

  .value {
    font-weight: 500;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
  }
`;
