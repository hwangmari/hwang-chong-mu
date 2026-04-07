"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import { AccountBookUser, AccountBookWorkspace } from "../types";

type Props = {
  activeUser: AccountBookUser | null;
  users: AccountBookUser[];
  workspaces: AccountBookWorkspace[];
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateServerRoom: (
    roomName: string,
    roomPassword: string,
    ownerName: string,
    ownerPassword: string,
  ) => Promise<void>;
  onCreatePersonalWorkspace: (
    userName: string,
    userPassword: string,
  ) => Promise<void>;
  onCreateSharedWorkspaceForActiveUser: (
    roomName: string,
    roomPassword: string,
  ) => Promise<void>;
  onJoinServerRoom: (
    inviteCode: string,
    userName: string,
    userPassword: string,
  ) => Promise<void>;
  onLoginPersonalWorkspace: (
    userName: string,
    userPassword: string,
  ) => Promise<void>;
  onResetActiveUser: () => void;
  onOpenManage: () => void;
};

type RoomFormState = {
  createMode: "personal" | "shared";
  roomName: string;
  roomPassword: string;
  userName: string;
  userPassword: string;
};

type JoinFormState = {
  inviteCode: string;
  userName: string;
  userPassword: string;
};

type PersonalLoginFormState = {
  userName: string;
  userPassword: string;
};

export default function WorkspaceHub({
  activeUser,
  users,
  workspaces,
  onSelectWorkspace,
  onCreateServerRoom,
  onCreatePersonalWorkspace,
  onCreateSharedWorkspaceForActiveUser,
  onJoinServerRoom,
  onLoginPersonalWorkspace,
  onResetActiveUser,
  onOpenManage,
}: Props) {
  const [modalMode, setModalMode] = useState<
    "create" | "join" | "personal-login" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createForm, setCreateForm] = useState<RoomFormState>({
    createMode: "shared",
    roomName: "",
    roomPassword: "",
    userName: activeUser?.name || "",
    userPassword: "",
  });
  const [joinForm, setJoinForm] = useState<JoinFormState>({
    inviteCode: "",
    userName: "",
    userPassword: "",
  });
  const [personalLoginForm, setPersonalLoginForm] =
    useState<PersonalLoginFormState>({
      userName: "",
      userPassword: "",
    });

  const personalWorkspaces = useMemo(
    () =>
      activeUser
        ? workspaces.filter(
            (workspace) =>
              workspace.type === "personal" &&
              (workspace.ownerUserId === activeUser.id ||
                workspace.memberIds.includes(activeUser.id)),
          )
        : [],
    [activeUser, workspaces],
  );
  const sharedWorkspaces = useMemo(
    () =>
      activeUser
        ? workspaces.filter(
            (workspace) =>
              workspace.type === "shared" &&
              workspace.memberIds.includes(activeUser.id),
          )
        : [],
    [activeUser, workspaces],
  );

  const getMembersLabel = (workspace: AccountBookWorkspace) =>
    workspace.memberIds
      .map((memberId) => users.find((user) => user.id === memberId)?.name)
      .filter(Boolean)
      .join(", ");

  const closeModal = () => {
    setModalMode(null);
    setIsSubmitting(false);
  };

  const handleCreateRoom = async () => {
    const needsPersonalIdentity =
      createForm.createMode === "personal" || !activeUser;

    if (
      needsPersonalIdentity &&
      (!createForm.userName.trim() || !createForm.userPassword.trim())
    ) {
      return;
    }

    if (
      createForm.createMode === "shared" &&
      (!createForm.roomName.trim() || !createForm.roomPassword.trim())
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (createForm.createMode === "shared") {
        if (activeUser) {
          await onCreateSharedWorkspaceForActiveUser(
            createForm.roomName.trim(),
            createForm.roomPassword.trim(),
          );
        } else {
          await onCreateServerRoom(
            createForm.roomName.trim(),
            createForm.roomPassword.trim(),
            createForm.userName.trim(),
            createForm.userPassword.trim(),
          );
        }
      } else {
        await onCreatePersonalWorkspace(
          createForm.userName.trim(),
          createForm.userPassword.trim(),
        );
      }

      setCreateForm({
        createMode: "shared",
        roomName: "",
        roomPassword: "",
        userName: "",
        userPassword: "",
      });
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinRoom = async () => {
    if (
      !joinForm.inviteCode.trim() ||
      !joinForm.userName.trim() ||
      !joinForm.userPassword.trim()
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onJoinServerRoom(
        joinForm.inviteCode.trim().toUpperCase(),
        joinForm.userName.trim(),
        joinForm.userPassword.trim(),
      );
      setJoinForm({
        inviteCode: "",
        userName: "",
        userPassword: "",
      });
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonalLogin = async () => {
    if (!personalLoginForm.userName.trim() || !personalLoginForm.userPassword.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onLoginPersonalWorkspace(
        personalLoginForm.userName.trim(),
        personalLoginForm.userPassword.trim(),
      );
      setPersonalLoginForm({
        userName: "",
        userPassword: "",
      });
      closeModal();
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyInviteCode = async (inviteCode: string) => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      window.alert(`참여 코드 ${inviteCode} 를 복사했어요.`);
    } catch {
      window.alert(`참여 코드: ${inviteCode}`);
    }
  };

  return (
    <StPage>
      <StPageInner>
        <StHeader>
          <div>
            <StEyebrow>Together Ledger</StEyebrow>
            <StTitle>함께 쓰는 가계부 허브</StTitle>
            <StDescription>
              개인 가계부로 시작하고, 필요할 때 공용방으로 자연스럽게
              확장해보세요. 참여 코드를 보내면 같은 흐름 안에서 함께 기록하고
              비교할 수 있습니다.
            </StDescription>
          </div>
          <StHeaderActions>
            <StManageButton
              type="button"
              disabled={!activeUser}
              onClick={onOpenManage}
            >
              서버방 참가자 설정
            </StManageButton>
          </StHeaderActions>
        </StHeader>

        <StHeroPanel>
          <StHeroCopy>
            <strong>
              {activeUser
                ? `${activeUser.name} 님으로 참여 중`
                : "먼저 서버방을 만들거나 참여하세요"}
            </strong>
            <span>
              {activeUser
                ? "이 계정으로 참여한 공용 가계부방과 개인 작업공간만 보여줍니다."
                : "참여 코드로 입장하면 내 전용 작업공간도 함께 만들어집니다."}
            </span>
          </StHeroCopy>
          <StHeroActions>
            <StPrimaryButton
              type="button"
              onClick={() => {
                setCreateForm((prev) => ({
                  ...prev,
                  userName: activeUser?.name || prev.userName,
                }));
                setModalMode("create");
              }}
            >
              서버방 만들기
            </StPrimaryButton>
            <StSecondaryButton
              type="button"
              onClick={() => setModalMode("join")}
            >
              참여 코드로 입장
            </StSecondaryButton>
            {!activeUser ? (
              <StGhostButton
                type="button"
                onClick={() => setModalMode("personal-login")}
              >
                개인방 로그인
              </StGhostButton>
            ) : null}
            {activeUser ? (
              <StGhostButton type="button" onClick={onResetActiveUser}>
                참여 계정 바꾸기
              </StGhostButton>
            ) : null}
          </StHeroActions>
        </StHeroPanel>

        {!activeUser ? (
          <StEmptyCard>
            서버방을 만들거나 참여 코드로 입장하면, 이 허브에 내가 사용할
            가계부방이 표시됩니다. 이미 만든 개인 가계부가 있다면 개인방
            로그인으로 다시 들어올 수 있어요.
          </StEmptyCard>
        ) : (
          <StWorkspaceColumns>
            <StSection>
              <StSectionTitle>개인 작업공간</StSectionTitle>
              <StSectionDescription>
                참여 시 자동 생성된 개인 작업공간입니다. 개인 정리용 원본 기록을
                남기고 필요한 항목만 공유할 수 있습니다.
              </StSectionDescription>
              <StGrid>
                {personalWorkspaces.map((workspace) => (
                  <StCard
                    key={workspace.id}
                    type="button"
                    onClick={() => onSelectWorkspace(workspace.id)}
                  >
                    <StCardBody>
                      <StCardMain>
                        <StCardType>PERSONAL</StCardType>
                        <StCardTitle>{workspace.name}</StCardTitle>
                        <StCardMeta>
                          작성자 {getMembersLabel(workspace) || activeUser.name}
                        </StCardMeta>
                        <StCardHint>
                          개인 기준 원본 기록을 관리하고, 필요한 항목만 공용
                          가계부방으로 연결합니다.
                        </StCardHint>
                      </StCardMain>
                      <StCardAside>
                        <StCardAsideLabel>개인 작업 흐름</StCardAsideLabel>
                        <StCardAsideValue>원본 기록 정리</StCardAsideValue>
                        <StCardAsideDescription>
                          혼자 먼저 내용을 정리하고, 필요한 내역만 골라
                          공용방으로 연결할 수 있어요.
                        </StCardAsideDescription>
                        <StCardAsideTags>
                          <span>개인 기록</span>
                          <span>공용 연결</span>
                        </StCardAsideTags>
                      </StCardAside>
                    </StCardBody>
                  </StCard>
                ))}
              </StGrid>
            </StSection>

            <StSection>
              <StSectionTitle>공용 가계부방</StSectionTitle>
              <StGrid>
                {sharedWorkspaces.length === 0 ? (
                  <StEmptyCard>
                    아직 참여한 공용 가계부방이 없습니다. 참여 코드로 입장하거나
                    새 서버방을 만들어보세요.
                  </StEmptyCard>
                ) : (
                  sharedWorkspaces.map((workspace) => (
                    <StCard
                      key={workspace.id}
                      type="button"
                      onClick={() => onSelectWorkspace(workspace.id)}
                    >
                      <StCardBody>
                        <StCardMain>
                          <StCardType>SHARED ROOM</StCardType>
                          <StCardTitle>{workspace.name}</StCardTitle>
                          <StCardMeta>
                            참가자 {getMembersLabel(workspace) || "미설정"}
                          </StCardMeta>
                          {workspace.inviteCode ? (
                            <StInviteRow>
                              <span>초대 코드 {workspace.inviteCode}</span>
                            </StInviteRow>
                          ) : null}
                          <StMemberPreview>
                            {workspace.memberIds.map((memberId) => {
                              const label =
                                users.find((user) => user.id === memberId)
                                  ?.name || "참가자";
                              return (
                                <span key={`${workspace.id}-${memberId}`}>
                                  {label}
                                </span>
                              );
                            })}
                          </StMemberPreview>
                          <StCardHint>
                            방 안에서 `전체 / 참가자별`로 필터링해서 생활비와
                            사용내역을 바로 볼 수 있습니다.
                          </StCardHint>
                        </StCardMain>
                        <StCardAside>
                          <StCardAsideLabel>공용방 요약</StCardAsideLabel>
                          <StCardAsideValue>
                            {workspace.memberIds.length}명 참여 중
                          </StCardAsideValue>
                          <StCardAsideDescription>
                            참여 코드를 공유하고, 함께 쓴 내역을 한 공간에서
                            바로 비교해볼 수 있어요.
                          </StCardAsideDescription>
                          {workspace.inviteCode ? (
                            <StInviteCopyAction
                              role="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void copyInviteCode(workspace.inviteCode || "");
                              }}
                            >
                              초대 코드 복사
                            </StInviteCopyAction>
                          ) : null}
                        </StCardAside>
                      </StCardBody>
                    </StCard>
                  ))
                )}
              </StGrid>
            </StSection>
          </StWorkspaceColumns>
        )}
      </StPageInner>

      {modalMode ? (
        <StModalBackdrop onClick={closeModal}>
          <StModalCard onClick={(event) => event.stopPropagation()}>
            <StModalTitle>
              {modalMode === "create"
                ? "가계부 시작하기"
                : modalMode === "join"
                  ? "참여 코드로 입장"
                  : "개인 가계부 로그인"}
            </StModalTitle>
            <StModalDescription>
              {modalMode === "create"
                ? activeUser
                  ? "현재 참여 중인 계정에 공용방을 추가하거나, 새 개인 가계부를 따로 시작할 수 있습니다."
                  : "개인만 사용할지, 공용방까지 같이 만들지 먼저 정한 뒤 시작할 수 있습니다."
                : modalMode === "join"
                  ? "초대 코드와 닉네임을 입력하면 이 방의 참여자로 등록됩니다."
                  : "이미 만든 개인 가계부가 있다면 닉네임과 비밀번호로 다시 들어올 수 있습니다."}
            </StModalDescription>

            {modalMode === "create" ? (
              <>
                <StModeSelector>
                  <StModeOption
                    type="button"
                    $active={createForm.createMode === "personal"}
                    onClick={() =>
                      setCreateForm((prev) => ({
                        ...prev,
                        createMode: "personal",
                      }))
                    }
                  >
                    <strong>개인만 사용</strong>
                    <span>내 개인 가계부만 먼저 시작합니다.</span>
                  </StModeOption>
                  <StModeOption
                    type="button"
                    $active={createForm.createMode === "shared"}
                    onClick={() =>
                      setCreateForm((prev) => ({
                        ...prev,
                        createMode: "shared",
                      }))
                    }
                  >
                    <strong>공용방도 추가</strong>
                    <span>개인 가계부와 공용 가계부방을 함께 만듭니다.</span>
                  </StModeOption>
                </StModeSelector>
                {createForm.createMode === "shared" ? (
                  <>
                    <StField>
                      <label>방 이름</label>
                      <input
                        value={createForm.roomName}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            roomName: event.target.value,
                          }))
                        }
                        placeholder="예: 우리집 생활비"
                      />
                    </StField>
                    <StField>
                      <label>방 비밀번호</label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={createForm.roomPassword}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            roomPassword: event.target.value,
                          }))
                        }
                        placeholder="예: 비밀번호를 생성해주세요"
                      />
                    </StField>
                    {activeUser ? (
                      <StActiveUserNote>
                        현재 계정 <strong>{activeUser.name}</strong> 으로 이
                        공용방을 추가합니다.
                      </StActiveUserNote>
                    ) : null}
                  </>
                ) : null}
                {createForm.createMode === "personal" || !activeUser ? (
                  <>
                    <StField>
                      <label>내 닉네임</label>
                      <input
                        value={createForm.userName}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            userName: event.target.value,
                          }))
                        }
                        placeholder="예: 마리"
                      />
                    </StField>
                    <StField>
                      <label>내 개인 비밀번호</label>
                      <input
                        type="password"
                        autoComplete="new-password"
                        value={createForm.userPassword}
                        onChange={(event) =>
                          setCreateForm((prev) => ({
                            ...prev,
                            userPassword: event.target.value,
                          }))
                        }
                        placeholder="개인 작업공간 비밀번호"
                      />
                    </StField>
                  </>
                ) : null}
              </>
            ) : modalMode === "join" ? (
              <>
                <StField>
                  <label>참여 코드</label>
                  <input
                    value={joinForm.inviteCode}
                    onChange={(event) =>
                      setJoinForm((prev) => ({
                        ...prev,
                        inviteCode: event.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="예: AB12CD34"
                  />
                </StField>
                <StField>
                  <label>내 닉네임</label>
                  <input
                    value={joinForm.userName}
                    onChange={(event) =>
                      setJoinForm((prev) => ({
                        ...prev,
                        userName: event.target.value,
                      }))
                    }
                    placeholder="예: 아내"
                  />
                </StField>
                <StField>
                  <label>내 개인 비밀번호</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={joinForm.userPassword}
                    onChange={(event) =>
                      setJoinForm((prev) => ({
                        ...prev,
                        userPassword: event.target.value,
                      }))
                    }
                    placeholder="개인 작업공간 비밀번호"
                  />
                </StField>
              </>
            ) : (
              <>
                <StField>
                  <label>내 닉네임</label>
                  <input
                    value={personalLoginForm.userName}
                    onChange={(event) =>
                      setPersonalLoginForm((prev) => ({
                        ...prev,
                        userName: event.target.value,
                      }))
                    }
                    placeholder="예: 마리"
                  />
                </StField>
                <StField>
                  <label>내 개인 비밀번호</label>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={personalLoginForm.userPassword}
                    onChange={(event) =>
                      setPersonalLoginForm((prev) => ({
                        ...prev,
                        userPassword: event.target.value,
                      }))
                    }
                    placeholder="개인 작업공간 비밀번호"
                  />
                </StField>
              </>
            )}

            <StModalActions>
              <StGhostButton type="button" onClick={closeModal}>
                취소
              </StGhostButton>
              <StPrimaryButton
                type="button"
                disabled={isSubmitting}
                onClick={() =>
                  void (modalMode === "create"
                    ? handleCreateRoom()
                    : modalMode === "join"
                      ? handleJoinRoom()
                      : handlePersonalLogin())
                }
              >
                {isSubmitting
                  ? "처리 중..."
                  : modalMode === "create"
                    ? createForm.createMode === "shared"
                      ? "방 만들기"
                      : "개인 가계부 만들기"
                    : modalMode === "join"
                      ? "방 참여하기"
                      : "내 가계부 열기"}
              </StPrimaryButton>
            </StModalActions>
          </StModalCard>
        </StModalBackdrop>
      ) : null}
    </StPage>
  );
}

const StPage = styled.main`
  min-height: 100vh;
  padding: 1.4rem 1.25rem 2rem;
  background: #f7f9fc;

  @media (max-width: 720px) {
    padding: 1rem 0.9rem 1.4rem;
  }
`;

const StPageInner = styled.div`
  width: 100%;
  max-width: 1025px;
  margin: 0 auto;
`;

const StHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 1.2rem;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

const StHeaderActions = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;
`;

const StEyebrow = styled.p`
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #7083a1;
`;

const StTitle = styled.h1`
  margin-top: 0.25rem;
  font-size: 2rem;
  font-weight: 900;
  color: #1f2937;

  @media (max-width: 720px) {
    font-size: 1.55rem;
  }
`;

const StDescription = styled.p`
  margin-top: 0.45rem;
  max-width: 42rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: #66758b;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StModeSelector = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.65rem;
  margin: 0.9rem 0;

  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const StModeOption = styled.button<{ $active: boolean }>`
  border: 1px solid ${({ $active }) => ($active ? "#9db6ff" : "#d9e2ee")};
  border-radius: 1rem;
  background: ${({ $active }) => ($active ? "#f4f8ff" : "#fff")};
  padding: 0.9rem 1rem;
  text-align: left;
  display: grid;
  gap: 0.25rem;
  cursor: pointer;

  strong {
    font-size: 0.9rem;
    font-weight: 900;
    color: ${({ $active }) => ($active ? "#3756b7" : "#223147")};
  }

  span {
    font-size: 0.8rem;
    line-height: 1.45;
    color: ${({ $active }) => ($active ? "#5f73a5" : "#6f7f95")};
  }
`;

const StActiveUserNote = styled.p`
  margin-top: -0.15rem;
  margin-bottom: 0.35rem;
  font-size: 0.82rem;
  line-height: 1.5;
  color: #66758b;

  strong {
    color: #314157;
    font-weight: 900;
  }
`;

const sharedButtonBase = `
  border-radius: 999px;
  padding: 0.72rem 1rem;
  font-size: 0.86rem;
  font-weight: 800;
`;

const StManageButton = styled.button`
  ${sharedButtonBase}
  border: 1px solid #cad8ea;
  background: #fff;
  color: #49628b;

  &:disabled {
    opacity: 0.48;
    cursor: not-allowed;
  }

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const StPrimaryButton = styled.button`
  ${sharedButtonBase}
  border: 1px solid #5a73d9;
  background: linear-gradient(135deg, #6d87ef, #5f73d9);
  color: #fff;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const StSecondaryButton = styled.button`
  ${sharedButtonBase}
  border: 1px solid #cad8ea;
  background: #f7faff;
  color: #49628b;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const StGhostButton = styled.button`
  ${sharedButtonBase}
  border: 1px solid #d8e1ee;
  background: #fff;
  color: #63758e;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const StHeroPanel = styled.section`
  border: 1px solid #d7e2ef;
  border-radius: 26px;
  background: #ffffff;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;

  @media (max-width: 900px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StHeroCopy = styled.div`
  display: grid;
  gap: 0.32rem;

  strong {
    font-size: 1.05rem;
    color: #223247;
  }

  span {
    font-size: 0.84rem;
    line-height: 1.55;
    color: #6f8097;
  }

  @media (max-width: 720px) {
    span {
      display: none;
    }
  }
`;

const StHeroActions = styled.div`
  display: flex;
  gap: 0.55rem;
  flex-wrap: wrap;

  @media (max-width: 720px) {
    width: 100%;
  }
`;

const StWorkspaceColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.1rem;
  align-items: start;
`;

const StSection = styled.section`
  margin-top: 1.1rem;
`;

const StSectionTitle = styled.h2`
  font-size: 1.05rem;
  font-weight: 900;
  color: #253348;
  margin-bottom: 0.7rem;
`;

const StSectionDescription = styled.p`
  margin-bottom: 0.7rem;
  font-size: 0.82rem;
  color: #748297;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.85rem;
`;

const StCard = styled.button`
  text-align: left;
  border: 1px solid #d8e1ee;
  border-radius: 22px;
  padding: 1rem;
  background: #ffffff;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;

  &:hover {
    border-color: #c7d5ea;
    box-shadow: 0 16px 36px rgba(76, 96, 135, 0.08);
    transform: translateY(-1px);
  }
`;

const StCardBody = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(min(220px, 100%), 0.9fr);
  gap: 1.1rem;
  align-items: stretch;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const StCardMain = styled.div`
  min-width: 0;
`;

const StCardAside = styled.div`
  display: grid;
  align-content: start;
  gap: 0.55rem;
  padding-left: 1.05rem;
  border-left: 1px dashed #cfd9e8;

  @media (max-width: 760px) {
    padding-left: 0;
    padding-top: 0.95rem;
    border-left: 0;
    border-top: 1px dashed #cfd9e8;
  }
`;

const StCardAsideLabel = styled.span`
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #7485a1;
`;

const StCardAsideValue = styled.strong`
  font-size: 1rem;
  font-weight: 900;
  color: #233248;
`;

const StCardAsideDescription = styled.p`
  font-size: 0.8rem;
  line-height: 1.6;
  color: #6f8097;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StCardAsideTags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;

  span {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    border: 1px solid #d7e2ef;
    background: #f8fbff;
    color: #516785;
    padding: 0.24rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 800;
  }
`;

const StCardType = styled.span`
  display: inline-flex;
  border-radius: 999px;
  background: #eef4ff;
  color: #4b69bb;
  font-size: 0.72rem;
  font-weight: 900;
  padding: 0.28rem 0.55rem;
`;

const StCardTitle = styled.h3`
  margin-top: 0.85rem;
  font-size: 1.2rem;
  font-weight: 900;
  color: #1f2937;
`;

const StCardMeta = styled.p`
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: #5f718b;
  font-weight: 700;
`;

const StInviteRow = styled.div`
  margin-top: 0.75rem;

  span {
    font-size: 0.78rem;
    font-weight: 800;
    color: #4f67a0;
  }
`;

const StInviteCopyAction = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  border: 1px solid #cad8ea;
  background: #fff;
  color: #49628b;
  border-radius: 999px;
  padding: 0.5rem 0.78rem;
  font-size: 0.74rem;
  font-weight: 800;
`;

const StCardHint = styled.p`
  margin-top: 1rem;
  font-size: 0.82rem;
  line-height: 1.55;
  color: #7b899d;

  @media (max-width: 720px) {
    display: none;
  }
`;

const StMemberPreview = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.8rem;

  span {
    display: inline-flex;
    align-items: center;
    border-radius: 999px;
    background: #eef4ff;
    color: #4d66a7;
    padding: 0.22rem 0.48rem;
    font-size: 0.72rem;
    font-weight: 800;
  }
`;

const StEmptyCard = styled.div`
  margin-top: 1rem;
  border-radius: 22px;
  border: 1px dashed #cbd7e7;
  background: #ffffff;
  color: #708096;
  font-size: 0.9rem;
  line-height: 1.6;
  padding: 1rem 1.1rem;
`;

const StModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.28);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  padding: 1rem;
  z-index: 200;
`;

const StModalCard = styled.div`
  width: min(460px, 100%);
  border-radius: 26px;
  border: 1px solid #d7e2ef;
  background: rgba(255, 255, 255, 0.98);
  padding: 1rem;
  box-shadow: 0 28px 64px rgba(55, 72, 111, 0.18);
`;

const StModalTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 900;
  color: #1f2937;
`;

const StModalDescription = styled.p`
  margin-top: 0.45rem;
  font-size: 0.84rem;
  line-height: 1.55;
  color: #6c7c93;
`;

const StField = styled.label`
  display: grid;
  gap: 0.35rem;
  margin-top: 0.8rem;

  label,
  span {
    font-size: 0.78rem;
    font-weight: 800;
    color: #5d6e86;
  }

  input {
    width: 100%;
    border: 1px solid #d6e0ec;
    border-radius: 12px;
    background: #fff;
    padding: 0.72rem 0.82rem;
    font-size: 0.92rem;
    color: #1f2937;
  }
`;

const StModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
`;
