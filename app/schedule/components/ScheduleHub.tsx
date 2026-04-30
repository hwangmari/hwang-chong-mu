"use client";

import { useState } from "react";
import styled from "styled-components";
import { Button } from "@hwangchongmu/ui";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { SchedulePart, ScheduleUser } from "@/types/work-schedule";

type ModalMode = "create-personal" | "create-shared" | "join" | null;

interface Props {
  activeUser: ScheduleUser | null;
  personalParts: SchedulePart[];
  sharedParts: SchedulePart[];
  onSelectPart: (partId: string) => void;
  onCreatePersonal: (name: string, password: string) => Promise<any>;
  onLogin: (name: string, password: string) => Promise<any>;
  onCreateSharedPart: (
    partName: string,
    partPassword: string,
    ownerName: string,
    ownerPassword: string,
  ) => Promise<any>;
  onJoinPart: (
    inviteCode: string,
    userName: string,
    userPassword: string,
  ) => Promise<any>;
  onLogout: () => void;
}

export default function ScheduleHub({
  activeUser,
  personalParts,
  sharedParts,
  onSelectPart,
  onCreatePersonal,
  onLogin,
  onCreateSharedPart,
  onJoinPart,
  onLogout,
}: Props) {
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [loginMode, setLoginMode] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 폼 상태
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [partName, setPartName] = useState("");
  const [partPassword, setPartPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  const resetForm = () => {
    setName("");
    setPassword("");
    setPartName("");
    setPartPassword("");
    setInviteCode("");
    setError("");
    setLoading(false);
  };

  const closeModal = () => {
    setModalMode(null);
    setLoginMode(false);
    resetForm();
  };

  const handleKeyDownSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      if (loginMode) {
        await onLogin(name, password);
        closeModal();
        return;
      }
      if (modalMode === "create-personal") {
        await onCreatePersonal(name, password);
      } else if (modalMode === "create-shared") {
        await onCreateSharedPart(partName, partPassword, name, password);
      } else if (modalMode === "join") {
        await onJoinPart(inviteCode, name, password);
      }
      closeModal();
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  // 로그인 안 된 상태
  if (!activeUser) {
    return (
      <StContainer>
        <StHeroSection>
          <StHeroEmoji>🗓️</StHeroEmoji>
          <StHeroTitle>업무 캘린더</StHeroTitle>
          <StHeroDesc>
            파트 단위로 서비스 일정을 관리하거나,
            <br />
            팀과 함께 공용 캘린더를 사용해보세요.
          </StHeroDesc>
        </StHeroSection>

        <StButtonGroup>
          <Button color="dark" variant="fill" size="large" onClick={() => setModalMode("create-personal")}>
            새 계정 만들기
          </Button>
          <Button color="light" variant="fill" size="large" onClick={() => setLoginMode(true)}>
            기존 계정 로그인
          </Button>
        </StButtonGroup>

        {/* 로그인 모달 */}
        {loginMode && (
          <StOverlay onClick={closeModal}>
            <StModal onClick={(e) => e.stopPropagation()}>
              <StModalTitle>로그인</StModalTitle>
              <StInput
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <StInput
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDownSubmit}
              />
              {error && <StError>{error}</StError>}
              <StModalActions>
                <Button color="light" variant="fill" size="medium" onClick={closeModal}>취소</Button>
                <Button color="dark" variant="fill" size="medium" onClick={handleSubmit} disabled={loading}>
                  {loading ? "처리 중..." : "로그인"}
                </Button>
              </StModalActions>
            </StModal>
          </StOverlay>
        )}

        {/* 계정 생성 모달 */}
        {modalMode === "create-personal" && (
          <StOverlay onClick={closeModal}>
            <StModal onClick={(e) => e.stopPropagation()}>
              <StModalTitle>새 계정 만들기</StModalTitle>
              <StInput
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <StInput
                type="password"
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDownSubmit}
              />
              {error && <StError>{error}</StError>}
              <StModalActions>
                <Button color="light" variant="fill" size="medium" onClick={closeModal}>취소</Button>
                <Button color="dark" variant="fill" size="medium" onClick={handleSubmit} disabled={loading}>
                  {loading ? "처리 중..." : "만들기"}
                </Button>
              </StModalActions>
            </StModal>
          </StOverlay>
        )}
      </StContainer>
    );
  }

  // 로그인 된 상태
  return (
    <StContainer>
      <StUserHeader>
        <div>
          <StWelcome>
            <b>{activeUser.name}</b>님, 안녕하세요!
          </StWelcome>
        </div>
        <Button color="light" variant="weak" size="small" onClick={onLogout}>로그아웃</Button>
      </StUserHeader>

      {/* 개인 캘린더 */}
      <StSectionHeader>
        <StSectionTitle>내 캘린더</StSectionTitle>
      </StSectionHeader>
      <StWorkspaceGrid>
        {personalParts.map((part) => (
          <StWorkspaceCard key={part.id} onClick={() => onSelectPart(part.id)}>
            <StCardIcon>📅</StCardIcon>
            <StCardInfo>
              <StCardName>{part.name}</StCardName>
              <StCardType>개인</StCardType>
            </StCardInfo>
          </StWorkspaceCard>
        ))}
      </StWorkspaceGrid>

      {/* 공용 파트 */}
      <StSectionHeader>
        <StSectionTitle>파트 캘린더</StSectionTitle>
        <StSectionActions>
          <Button color="light" variant="fill" size="small" onClick={() => setModalMode("create-shared")}>
            + 파트 만들기
          </Button>
          <Button color="light" variant="fill" size="small" onClick={() => setModalMode("join")}>
            초대코드 입장
          </Button>
        </StSectionActions>
      </StSectionHeader>
      <StWorkspaceGrid>
        {sharedParts.map((part) => (
          <StWorkspaceCard key={part.id} onClick={() => onSelectPart(part.id)}>
            <StCardIcon>👥</StCardIcon>
            <StCardInfo>
              <StCardName>{part.name}</StCardName>
              <StCardMeta>
                <StCardType>파트</StCardType>
                {part.inviteCode && (
                  <StInviteCode
                    onClick={(e) => {
                      e.stopPropagation();
                      copyInviteCode(part.inviteCode!);
                    }}
                  >
                    <ContentCopyIcon style={{ fontSize: "0.75rem" }} />
                    {part.inviteCode}
                  </StInviteCode>
                )}
              </StCardMeta>
            </StCardInfo>
          </StWorkspaceCard>
        ))}
        {sharedParts.length === 0 && (
          <StEmptyMessage>
            아직 참여 중인 파트가 없습니다.
          </StEmptyMessage>
        )}
      </StWorkspaceGrid>

      {/* 공용 파트 생성 모달 */}
      {modalMode === "create-shared" && (
        <StOverlay onClick={closeModal}>
          <StModal onClick={(e) => e.stopPropagation()}>
            <StModalTitle>파트 만들기</StModalTitle>
            <StInputLabel>파트 정보</StInputLabel>
            <StInput
              placeholder="파트 이름"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              autoFocus
            />
            <StInput
              type="password"
              placeholder="파트 비밀번호"
              value={partPassword}
              onChange={(e) => setPartPassword(e.target.value)}
            />
            <StInputLabel>내 정보 (새 계정)</StInputLabel>
            <StInput
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <StInput
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDownSubmit}
            />
            {error && <StError>{error}</StError>}
            <StModalActions>
              <Button color="light" variant="fill" size="medium" onClick={closeModal}>취소</Button>
              <Button color="dark" variant="fill" size="medium" onClick={handleSubmit} disabled={loading}>
                {loading ? "처리 중..." : "만들기"}
              </Button>
            </StModalActions>
          </StModal>
        </StOverlay>
      )}

      {/* 파트 참여 모달 */}
      {modalMode === "join" && (
        <StOverlay onClick={closeModal}>
          <StModal onClick={(e) => e.stopPropagation()}>
            <StModalTitle>초대코드로 참여</StModalTitle>
            <StInput
              placeholder="초대코드"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              autoFocus
            />
            <StInputLabel>내 정보 (새 계정)</StInputLabel>
            <StInput
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <StInput
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDownSubmit}
            />
            {error && <StError>{error}</StError>}
            <StModalActions>
              <Button color="light" variant="fill" size="medium" onClick={closeModal}>취소</Button>
              <Button color="dark" variant="fill" size="medium" onClick={handleSubmit} disabled={loading}>
                {loading ? "처리 중..." : "참여하기"}
              </Button>
            </StModalActions>
          </StModal>
        </StOverlay>
      )}
    </StContainer>
  );
}

// ── Styled Components ──

const StContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const StHeroSection = styled.div`
  text-align: center;
  padding: 3rem 0;
`;

const StHeroEmoji = styled.div`
  font-size: 3.5rem;
  margin-bottom: 1rem;
`;

const StHeroTitle = styled.h1`
  font-size: 1.75rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.75rem;
`;

const StHeroDesc = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.95rem;
  line-height: 1.6;
`;

const StButtonGroup = styled.div`
  display: flex;
  gap: 0.75rem;
  justify-content: center;
  margin-top: 1.5rem;
`;

const StPrimaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.gray900};
  color: ${({ theme }) => theme.colors.white};
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StSecondaryButton = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray700};
  font-weight: 700;
  font-size: 0.9rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
  }
`;

const StUserHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray100};
`;

const StWelcome = styled.p`
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.gray700};
  b {
    font-weight: 800;
    color: ${({ theme }) => theme.colors.gray900};
  }
`;

const StLogoutButton = styled.button`
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray500};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.colors.gray700};
    border-color: ${({ theme }) => theme.colors.gray300};
  }
`;

const StSectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  margin-top: 2rem;
`;

const StSectionTitle = styled.h2`
  font-size: 1.1rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StSectionActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StSmallButton = styled.button`
  padding: 0.4rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  background: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray600};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${({ theme }) => theme.colors.gray50};
    border-color: ${({ theme }) => theme.colors.blue500};
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StWorkspaceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
`;

const StWorkspaceCard = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 1rem;
  background: ${({ theme }) => theme.colors.white};
  border: 1px solid ${({ theme }) => theme.colors.gray100};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    border-color: ${({ theme }) => theme.colors.blue200};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }
`;

const StCardIcon = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const StCardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const StCardName = styled.div`
  font-size: 1rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray900};
  margin-bottom: 0.25rem;
`;

const StCardMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StCardType = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray400};
`;

const StInviteCode = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.blue600};
  background: ${({ theme }) => theme.colors.blue50};
  border: none;
  padding: 0.15rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background: ${({ theme }) => theme.colors.blue100};
  }
`;

const StEmptyMessage = styled.div`
  padding: 2rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.9rem;
  border: 2px dashed ${({ theme }) => theme.colors.gray200};
  border-radius: 1rem;
  grid-column: 1 / -1;
`;

// ── 모달 ──

const StOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  z-index: 200;
  padding: 1rem;
`;

const StModal = styled.div`
  width: min(100%, 24rem);
  background: ${({ theme }) => theme.colors.white};
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const StModalTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
`;

const StInputLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  margin-top: 0.25rem;
`;

const StInput = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.75rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.gray900};
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray300};
  }
`;

const StError = styled.p`
  font-size: 0.8rem;
  color: #d04a73;
  font-weight: 600;
`;

const StModalActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;
