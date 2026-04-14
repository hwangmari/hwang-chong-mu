"use client";
import styled from "styled-components";

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  participants: any[];
  myId: string;
  isHost: boolean;
  guestName: string;
  setGuestName: (val: string) => void;
  onAddGuest: () => void;
  onKick: (id: string, name: string) => void;
}

export default function ParticipantList({
  participants,
  myId,
  isHost,
  guestName,
  setGuestName,
  onAddGuest,
  onKick,
}: Props) {
  return (
    <StParticipantBoard>
      <StParticipantHeader>
        <StLabel style={{ marginBottom: 0 }}>
          참가자 ({participants.length}명)
        </StLabel>
      </StParticipantHeader>

      {/* 방장 전용: 게스트 추가 */}
      {isHost && (
        <StGuestInputWrapper>
          <StGuestInput
            placeholder="이름만 입력해서 깍두기 추가"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") onAddGuest();
            }}
          />
          <StGuestAddButton onClick={onAddGuest}>+</StGuestAddButton>
        </StGuestInputWrapper>
      )}

      <StList>
        {participants.map((p) => (
          <StCommentRow key={p.id} $isMe={p.id === myId}>
            <StAvatar>{p.is_host ? "👑" : "🙂"}</StAvatar>
            <StBubble>
              <StName>{p.nickname}</StName>
              {p.message && <StMessage>{p.message}</StMessage>}
            </StBubble>

            {/* 삭제 버튼 */}
            {isHost && !p.is_host && (
              <StDeleteBtn onClick={() => onKick(p.id, p.nickname)}>
                ✕
              </StDeleteBtn>
            )}
          </StCommentRow>
        ))}
        {participants.length === 0 && <StEmpty>아직 아무도 없어요.</StEmpty>}
      </StList>
    </StParticipantBoard>
  );
}

const StParticipantBoard = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;
const StParticipantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;
const StLabel = styled.span`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.gray500};
  font-weight: bold;
`;
const StGuestInputWrapper = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;
const StGuestInput = styled.input`
  flex: 1;
  padding: 0.8rem;
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;
const StGuestAddButton = styled.button`
  background: ${({ theme }) => theme.colors.gray800};
  color: ${({ theme }) => theme.colors.white};
  border: none;
  width: 40px;
  border-radius: 12px;
  font-size: 1.2rem;
  cursor: pointer;
`;
const StList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-bottom: 2rem;
`;
const StCommentRow = styled.div<{ $isMe: boolean }>`
  display: flex;
  gap: 0.8rem;
  align-items: center;
  flex-direction: ${({ $isMe }) => ($isMe ? "row-reverse" : "row")};
`;
const StAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.gray200};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
`;
const StBubble = styled.div`
  background: ${({ theme }) => theme.colors.white};
  padding: 0.8rem 1rem;
  border-radius: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  max-width: 80%;
  display: flex;
  flex-direction: column;
`;
const StName = styled.span`
  font-weight: bold;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray800};
`;
const StMessage = styled.span`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray700};
  margin-top: 0.2rem;
  word-break: break-word;
  line-height: 1.4;
`;
const StDeleteBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.rose100};
  color: ${({ theme }) => theme.colors.rose500};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 0.9rem;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: 0.5rem;
  &:hover {
    background: ${({ theme }) => theme.colors.rose200};
  }
`;
const StEmpty = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.gray400};
  margin-top: 2rem;
`;
