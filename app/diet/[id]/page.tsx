"use client";

import { useEffect, useState, use } from "react";
import styled from "styled-components";
import EditIcon from "@mui/icons-material/Edit";
import { supabase } from "@/lib/supabase";
import { StContainer } from "@/components/styled/layout.styled";
import { useModal } from "@/components/common/ModalProvider";
import DietMainContent from "../DietMainContent";

interface DietGoal {
  id: number;
  title: string;
  target_weight: number | null;
  created_at?: string;
}

export default function DietRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { openAlert } = useModal();
  const [goal, setGoal] = useState<DietGoal | null>(null);

  // 목표(이름·목표 몸무게) 인라인 수정 상태
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchGoal = async () => {
      const { data } = await supabase
        .from("diet_goals")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setGoal(data);
    };
    fetchGoal();
  }, [id]);

  const startEdit = () => {
    if (!goal) return;
    setEditTitle(goal.title);
    setEditTarget(goal.target_weight != null ? String(goal.target_weight) : "");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!goal) return;
    const title = editTitle.trim();
    if (!title) {
      await openAlert("목표 이름을 입력해주세요!");
      return;
    }
    let targetWeight: number | null = null;
    if (editTarget.trim()) {
      const parsed = parseFloat(editTarget);
      if (isNaN(parsed) || parsed <= 0) {
        await openAlert("목표 몸무게는 숫자로 입력해주세요!");
        return;
      }
      targetWeight = parsed;
    }

    setSaving(true);
    const { error } = await supabase
      .from("diet_goals")
      .update({ title, target_weight: targetWeight })
      .eq("id", goal.id);
    setSaving(false);

    if (error) {
      await openAlert("수정에 실패했습니다 ㅠㅠ 잠시 후 다시 시도해주세요.");
      return;
    }
    setGoal({ ...goal, title, target_weight: targetWeight });
    setEditing(false);
  };

  if (!goal) return <div className="p-10 text-center">로딩 중... 🥗</div>;

  return (
    <StContainer>
      <Header>
        {editing ? (
          <EditForm>
            <EditField>
              <EditLabel>목표 이름</EditLabel>
              <EditInput
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="예: 이번 여름까지 -5kg!"
                maxLength={40}
              />
            </EditField>
            <EditField>
              <EditLabel>목표 몸무게 (kg)</EditLabel>
              <EditInput
                value={editTarget}
                onChange={(e) => setEditTarget(e.target.value)}
                placeholder="예: 55 (비우면 목표 없음)"
                inputMode="decimal"
              />
            </EditField>
            <EditActions>
              <EditButton type="button" onClick={() => setEditing(false)}>
                취소
              </EditButton>
              <EditButton
                type="button"
                $primary
                disabled={saving}
                onClick={saveEdit}
              >
                {saving ? "저장 중…" : "저장"}
              </EditButton>
            </EditActions>
          </EditForm>
        ) : (
          <>
            <TitleRow>
              <Title>🥗 {goal.title}</Title>
              <EditIconButton
                type="button"
                aria-label="목표 수정"
                onClick={startEdit}
              >
                <EditIcon style={{ fontSize: "1.05rem" }} />
              </EditIconButton>
            </TitleRow>
            {goal.target_weight && (
              <SubTitle>목표: {goal.target_weight}kg</SubTitle>
            )}
          </>
        )}
      </Header>

      {/* 메인 로직 컴포넌트 분리 */}
      <DietMainContent goalId={Number(id)} />
    </StContainer>
  );
}

const Header = styled.div`
  text-align: center;
  margin: 1rem 0 2rem;
`;
const TitleRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
`;
const Title = styled.h1`
  font-size: 1.8rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray800};
`;
const SubTitle = styled.p`
  color: ${({ theme }) => theme.colors.gray500};
  margin-top: 0.5rem;
  font-weight: 600;
`;
const EditIconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  border-radius: 50%;
  background: none;
  color: ${({ theme }) => theme.colors.gray400};
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.gray100};
    color: ${({ theme }) => theme.colors.gray700};
  }
`;
const EditForm = styled.div`
  max-width: 20rem;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: left;
`;
const EditField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;
const EditLabel = styled.label`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
`;
const EditInput = styled.input`
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  font-size: 0.95rem;
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.green500};
  }
`;
const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 0.25rem;
`;
const EditButton = styled.button<{ $primary?: boolean }>`
  padding: 0.5rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid
    ${({ $primary, theme }) => ($primary ? "transparent" : theme.colors.gray200)};
  background: ${({ $primary, theme }) =>
    $primary ? theme.colors.green500 : theme.colors.white};
  color: ${({ $primary, theme }) =>
    $primary ? theme.colors.white : theme.colors.gray600};
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.15s;

  &:hover {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }
`;
