import styled, { keyframes } from "styled-components";
import Switch from "../../../components/common/Switch";
import CreateButton from "@/components/common/CreateButton";

interface RoomFormProps {
  formData: {
    roomName: string;
    startDate: string;
    endDate: string;
    includeWeekend: boolean;
  };
  loading: boolean;
  isCustomPeriod: boolean;
  setIsCustomPeriod: (v: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
}

export default function RoomForm({
  formData,
  loading,
  isCustomPeriod,
  setIsCustomPeriod,
  onChange,
  onSubmit,
}: RoomFormProps) {
  return (
    <StFormContainer>
      {/* 1. 약속 이름 */}
      <StInputGroup>
        <StLabel>약속 이름</StLabel>
        <StTextInput
          type="text"
          placeholder="예: 신년회, 회식"
          value={formData.roomName}
          onChange={(e) => onChange("roomName", e.target.value)}
        />
      </StInputGroup>

      {/* 2. 날짜 설정 영역 */}
      <StDateSection>
        {/* 시작 날짜 */}
        <StInputGroup>
          <StLabel>
            시작 날짜
            {!isCustomPeriod && (
              <StAutoInfoText>(자동 3주 설정됨)</StAutoInfoText>
            )}
          </StLabel>
          <StDateInput
            type="date"
            value={formData.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </StInputGroup>

        {/* 종료 날짜 직접 지정 토글 */}
        <StToggleRow>
          <StToggleLabel onClick={() => setIsCustomPeriod(!isCustomPeriod)}>
            종료 날짜 직접 지정하기
          </StToggleLabel>
          <Switch
            checked={isCustomPeriod}
            onChange={setIsCustomPeriod}
            label="종료 날짜 직접 입력 여부"
          />
        </StToggleRow>

        {/* 토글이 켜졌을 때만 나타나는 종료 날짜 입력창 */}
        {isCustomPeriod && (
          <StInputGroup className="animate-fade-in">
            <StLabel>종료 날짜</StLabel>
            <StDateInput
              type="date"
              value={formData.endDate}
              min={formData.startDate} // 시작일 이전은 선택 불가
              onChange={(e) => onChange("endDate", e.target.value)}
              $isWhite={true} // 배경색 구분을 위한 props
            />
          </StInputGroup>
        )}
      </StDateSection>

      {/* 3. 주말 포함 토글 */}
      <StToggleRow>
        <StToggleLabel>주말 포함</StToggleLabel>
        <Switch
          checked={formData.includeWeekend}
          onChange={(isChecked) => onChange("includeWeekend", isChecked)}
          label="주말 포함 여부"
        />
      </StToggleRow>

      {/* 4. 버튼 */}
      <CreateButton onClick={onSubmit} isLoading={loading}>
        방 만들기 ➔
      </CreateButton>
    </StFormContainer>
  );
}

// ✨ 스타일 정의 (St 프리픽스)

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
`;

const StFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* space-y-6 */
`;

const StInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* space-y-2 */

  &.animate-fade-in {
    animation: ${fadeIn} 0.3s ease-out;
  }
`;

const StLabel = styled.label`
  font-size: 0.75rem; /* text-xs */
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  margin-left: 0.25rem; /* ml-1 */
  display: flex;
  align-items: center;
`;

const StAutoInfoText = styled.span`
  color: ${({ theme }) => theme.colors.blue600}; /* indigo-500 대응 */
  font-weight: 400;
  margin-left: 0.25rem;
`;

const StTextInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem; /* px-4 py-3 */
  background-color: ${({ theme }) => theme.colors.gray50};
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  transition: all 0.2s;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.blue600};
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.blue100}; /* ring effect */
  }
`;

const StDateSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem; /* space-y-4 */
`;

const StDateInput = styled(StTextInput)<{ $isWhite?: boolean }>`
  display: block;
  width: 240px;
  height: 50px;
  background-color: ${({ theme, $isWhite }) =>
    $isWhite ? theme.colors.white : theme.colors.gray50};
`;

const StToggleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem; /* px-1 py-1 */
`;

const StToggleLabel = styled.span`
  font-size: 0.875rem; /* text-sm */
  font-weight: 500;
  color: ${({ theme }) => theme.colors.gray600};
  cursor: pointer;
`;
