import styled from "styled-components";
import Switch from "../../../components/common/Switch";
import {
  StInlineButton,
  StOptionGroup,
  StOptionRow,
  StFieldLabel,
  StFieldGrid,
  StField,
} from "@/components/styled/layout.styled";
import CreateButton from "@/components/common/CreateButton";
import { Input } from "@hwangchongmu/ui";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

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
  members: string[];
  memberInput: string;
  setMemberInput: (v: string) => void;
  addMember: (name: string) => void;
  removeMember: (name: string) => void;
}

export default function RoomForm({
  formData,
  loading,
  isCustomPeriod,
  setIsCustomPeriod,
  onChange,
  onSubmit,
  members,
  memberInput,
  setMemberInput,
  addMember,
  removeMember,
}: RoomFormProps) {
  return (
    <StFormContainer>
      <StFieldGrid>
        {/* 1행: 약속 이름 | 시작 날짜 */}
        <StField>
          <Input
            label="약속 이름"
            placeholder="예: 신년회, 회식"
            value={formData.roomName}
            onChange={(e) => onChange("roomName", e.target.value)}
          />
        </StField>

        <StField>
          <Input
            label={
              <>
                시작 날짜
                {!isCustomPeriod && (
                  <StAutoInfoText>(자동 3주 설정됨)</StAutoInfoText>
                )}
              </>
            }
            type="date"
            value={formData.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
          />
        </StField>

        {/* 2행: 기간 옵션 묶음 | 참여 멤버 */}
        <StField>
          <StOptionGroup>
            <StOptionRow>
              <StToggleLabel onClick={() => setIsCustomPeriod(!isCustomPeriod)}>
                종료 날짜 직접 지정하기
              </StToggleLabel>
              <Switch
                checked={isCustomPeriod}
                onChange={setIsCustomPeriod}
                label="종료 날짜 직접 입력 여부"
              />
            </StOptionRow>

            <StOptionRow>
              <StToggleLabel>주말 포함</StToggleLabel>
              <Switch
                checked={formData.includeWeekend}
                onChange={(isChecked) => onChange("includeWeekend", isChecked)}
                label="주말 포함 여부"
              />
            </StOptionRow>
          </StOptionGroup>
        </StField>

        <StField>
          <StMemberSection>
            <StFieldLabel>참여 멤버 (선택)</StFieldLabel>
            <StMemberInputRow>
              <Input
                placeholder="이름 입력 후 추가"
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addMember(memberInput);
                  }
                }}
              />
              <StInlineButton
                type="button"
                onClick={() => addMember(memberInput)}
                disabled={!memberInput.trim()}
              >
                추가
              </StInlineButton>
            </StMemberInputRow>
          </StMemberSection>
        </StField>

        {/* 토글이 켜졌을 때만 나타나는 종료 날짜 입력창 */}
        {isCustomPeriod && (
          <StField>
            <Input
              label="종료 날짜"
              type="date"
              value={formData.endDate}
              min={formData.startDate} // 시작일 이전은 선택 불가
              onChange={(e) => onChange("endDate", e.target.value)}
            />
          </StField>
        )}

        {/* 담은 멤버 칩은 한 줄 전체 */}
        {members.length > 0 && (
          <StField $span="full">
            <StMemberChipList>
              {members.map((name) => (
                <StMemberChip key={name}>
                  {name}
                  <StRemoveBtn onClick={() => removeMember(name)}>
                    ✕
                  </StRemoveBtn>
                </StMemberChip>
              ))}
            </StMemberChipList>
          </StField>
        )}
      </StFieldGrid>

      {/* 5. 버튼 */}
      <CreateButton onClick={onSubmit} isLoading={loading}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.35rem",
          }}
        >
          방 만들기 <ArrowForwardIcon fontSize="small" />
        </span>
      </CreateButton>
    </StFormContainer>
  );
}

const StFormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
`;

const StAutoInfoText = styled.span`
  color: ${({ theme }) => theme.semantic.primary};
  font-weight: 600;
  font-size: 0.75rem;
  margin-left: 0.25rem;
`;

const StToggleLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 600;
  color: ${({ theme }) => theme.semantic.text};
  cursor: pointer;
`;

const StMemberSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StMemberInputRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
`;

const StMemberChipList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const StMemberChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  height: 32px;
  padding: 0 0.75rem;
  border-radius: 0.6rem;
  background-color: ${({ theme }) => theme.semantic.bg};
  border: 1px solid ${({ theme }) => theme.semantic.border};
  color: ${({ theme }) => theme.semantic.text};
  font-size: 0.813rem;
  font-weight: 700;
`;

const StRemoveBtn = styled.button`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.gray400};
  transition: color 0.15s ease;

  &:hover {
    color: ${({ theme }) => theme.semantic.text};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;
