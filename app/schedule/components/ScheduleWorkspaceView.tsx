"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { ScheduleServiceData, SchedulePart } from "@/types/work-schedule";
import { updateService, deleteService } from "@/services/schedule";
import { StLoadingWrapper } from "@/components/styled/layout.styled";
import { useModal } from "@/components/common/ModalProvider";
import ServiceCard from "./ServiceCard/ServiceCard";

interface Props {
  part: SchedulePart;
  services: ScheduleServiceData[];
  onBack: () => void;
  onCreateService: (
    partId: string,
    title: string,
    description: string,
  ) => Promise<any>;
  onReloadServices: () => void;
}

export default function ScheduleWorkspaceView({
  part,
  services,
  onBack,
  onCreateService,
  onReloadServices,
}: Props) {
  const router = useRouter();
  const { openConfirm, openAlert } = useModal();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const handleUpdate = async (
    serviceId: string,
    title: string,
    description: string,
  ) => {
    try {
      await updateService(serviceId, { title, description });
      onReloadServices();
      setEditingId(null);
    } catch {
      await openAlert("수정에 실패했습니다.");
    }
  };

  const handleDelete = async (serviceId: string) => {
    const confirmed = await openConfirm(
      "정말 이 서비스를 삭제하시겠습니까?\n포함된 모든 일정이 삭제됩니다.",
    );
    if (!confirmed) return;
    try {
      await deleteService(serviceId);
      onReloadServices();
    } catch {
      await openAlert("삭제에 실패했습니다.");
    }
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await onCreateService(part.id, newTitle, newDesc);
      setNewTitle("");
      setNewDesc("");
      setShowCreateForm(false);
    } catch (err: any) {
      console.error("서비스 생성 에러:", err);
      await openAlert(`생성 실패: ${err.message || "알 수 없는 오류"}`);
    }
  };

  return (
    <StContainer>
      <StHeader>
        <div className="text-group">
          <StBackLink onClick={onBack}>&larr; 돌아가기</StBackLink>
          <h1>
            {part.type === "shared" ? "👥" : "📅"} {part.name}
          </h1>
          <p>
            {part.type === "shared"
              ? `파트 캘린더 · 멤버 ${part.memberIds.length}명`
              : "내 캘린더"}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <StCalendarButton
            onClick={() => router.push(`/schedule/part-calendar?partId=${part.id}`)}
          >
            🗓️ 파트 캘린더
          </StCalendarButton>
          {part.type === "shared" && (
            <StCalendarButton
              onClick={() => router.push(`/schedule/members?partId=${part.id}`)}
            >
              👥 멤버 리소스
            </StCalendarButton>
          )}
          <StCreateButton onClick={() => setShowCreateForm(true)}>
            + 새 서비스 만들기
          </StCreateButton>
        </div>
      </StHeader>

      {showCreateForm && (
        <StCreateForm>
          <StFormInput
            placeholder="서비스 제목"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />
          <StFormInput
            placeholder="설명 (선택)"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <StFormActions>
            <StSecondaryBtn onClick={() => setShowCreateForm(false)}>
              취소
            </StSecondaryBtn>
            <StPrimaryBtn onClick={handleCreate}>만들기</StPrimaryBtn>
          </StFormActions>
        </StCreateForm>
      )}

      <StGrid>
        {services.map((svc) => (
          <ServiceCard
            key={svc.id}
            board={svc}
            isEditing={editingId === svc.id}
            onEnter={() => router.push(`/schedule/${svc.id}`)}
            onStartEdit={() => setEditingId(svc.id)}
            onCancelEdit={() => setEditingId(null)}
            onSave={handleUpdate}
            onDelete={handleDelete}
          />
        ))}

        {services.length === 0 && !showCreateForm && (
          <StEmptyCard>
            <p>아직 생성된 서비스가 없습니다.</p>
            <StLink onClick={() => setShowCreateForm(true)}>새로 만들기</StLink>
          </StEmptyCard>
        )}
      </StGrid>
    </StContainer>
  );
}

const StContainer = styled.div`
  max-width: ${({ theme }) => theme.layout.maxWidth};
  margin: 0 auto;
  padding: 2rem 1.5rem;
`;

const StHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.gray100};
  .text-group {
    h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: ${({ theme }) => theme.colors.gray900};
      margin-bottom: 0.25rem;
    }
    p {
      color: ${({ theme }) => theme.colors.gray500};
      font-size: 0.9rem;
    }
  }
`;

const StBackLink = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.gray400};
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  margin-bottom: 0.5rem;
  display: block;
  &:hover {
    color: ${({ theme }) => theme.colors.blue600};
  }
`;

const StCalendarButton = styled.button`
  background: #eff6ff;
  color: #3b82f6;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  border: 1px solid #bfdbfe;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #dbeafe;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const StCreateButton = styled.button`
  background: ${({ theme }) => theme.colors.gray900};
  color: white;
  padding: 0.7rem 1.2rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

const StGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const StEmptyCard = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed ${({ theme }) => theme.colors.gray200};
  border-radius: 16px;
  padding: 2rem;
  color: ${({ theme }) => theme.colors.gray400};
  gap: 0.5rem;
`;

const StLink = styled.button`
  border: none;
  background: none;
  color: ${({ theme }) => theme.colors.blue600};
  font-weight: 700;
  text-decoration: underline;
  cursor: pointer;
`;

const StCreateForm = styled.div`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 1rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const StFormInput = styled.input`
  padding: 0.7rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.5rem;
  font-size: 0.95rem;
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

const StFormActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const StPrimaryBtn = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.gray900};
  color: white;
  font-weight: 700;
  font-size: 0.85rem;
  border: none;
  cursor: pointer;
`;

const StSecondaryBtn = styled.button`
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: white;
  color: ${({ theme }) => theme.colors.gray600};
  font-weight: 700;
  font-size: 0.85rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  cursor: pointer;
`;
