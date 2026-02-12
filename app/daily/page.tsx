"use client";

import React, { useMemo, useState, useSyncExternalStore } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import Typography from "@/components/common/Typography";
import CreateButton from "@/components/common/CreateButton";
import ColorPickerPanel from "@/components/common/ColorPickerPanel";
import {
  DailyNotebookConfig,
  getDailyNotebooks,
  saveDailyNotebook,
} from "./storage";

const DAILY_COLORS = ["#22c55e", "#3b82f6", "#6366f1", "#f97316", "#f43f5e", "#14b8a6", "#64748b"];

function createNotebookId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function DailyCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState(["운동", "물 2L", "영양제"]);
  const [accessCode, setAccessCode] = useState("");
  const [selectedColor, setSelectedColor] = useState(DAILY_COLORS[0]);
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const savedNotebooks = useMemo<DailyNotebookConfig[]>(
    () => (isClient ? getDailyNotebooks() : []),
    [isClient]
  );

  const addItem = () => setItems((prev) => [...prev, ""]);

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, current) => current !== index));
  };

  const updateItem = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, current) => (current === index ? value : item))
    );
  };

  const handleCreate = () => {
    const trimmedTitle = title.trim();
    const checklist = items.map((item) => item.trim()).filter(Boolean);
    const trimmedCode = accessCode.trim();
    if (!trimmedTitle) {
      alert("기록장 이름을 입력해주세요.");
      return;
    }
    if (checklist.length === 0) {
      alert("체크리스트를 1개 이상 입력해주세요.");
      return;
    }

    const id = createNotebookId();
    saveDailyNotebook({
      id,
      title: trimmedTitle,
      checklist,
      createdAt: new Date().toISOString(),
      accessCode: trimmedCode || undefined,
      color: selectedColor,
    });

    router.push(`/daily/${id}`);
  };

  return (
    <CreateContainer>
      <header className="mb-10 text-center">
        <Typography variant="h1" className="mb-2">
          📓 일일 기록
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          한 줄 일기와 O/X 체크리스트를 함께 기록해요.
        </Typography>
      </header>

      <FormSection>
        <Typography variant="h3" className="mb-3">
          1. 기록장 이름
        </Typography>
        <InputField
          placeholder="예: 2월 루틴 기록장"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormSection>

      <FormSection>
        <HeaderRow>
          <Typography variant="h3">2. 개인 비밀번호(선택)</Typography>
        </HeaderRow>
        <InputField
          type="password"
          placeholder="비워두면 누구나 접근 가능"
          value={accessCode}
          onChange={(e) => setAccessCode(e.target.value)}
        />
      </FormSection>

      <FormSection>
        <HeaderRow>
          <Typography variant="h3">3. 테마 컬러</Typography>
        </HeaderRow>
        <ColorPickerPanel
          selectedColor={selectedColor}
          onSelect={setSelectedColor}
          colors={DAILY_COLORS}
        />
      </FormSection>

      <FormSection>
        <HeaderRow>
          <Typography variant="h3">4. 체크리스트 항목</Typography>
          <TextButton type="button" onClick={addItem}>
            + 항목 추가
          </TextButton>
        </HeaderRow>

        {items.map((item, index) => (
          <ChecklistItem key={index}>
            <ItemIndex>{index + 1}</ItemIndex>
            <InputField
              placeholder="체크할 항목을 입력하세요"
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
            />
            <DeleteButton
              type="button"
              onClick={() => removeItem(index)}
              disabled={items.length <= 1}
            >
              삭제
            </DeleteButton>
          </ChecklistItem>
        ))}
      </FormSection>

      {savedNotebooks.length > 0 && (
        <FormSection>
          <HeaderRow>
            <Typography variant="h3">기존 기록장</Typography>
          </HeaderRow>
          <NotebookList>
            {savedNotebooks.slice(0, 4).map((notebook) => (
              <NotebookButton
                key={notebook.id}
                type="button"
                onClick={() => router.push(`/daily/${notebook.id}`)}
              >
                <strong>
                  {notebook.title}
                  {notebook.accessCode ? " 🔒" : ""}
                </strong>
                <span>{notebook.checklist.length}개 항목</span>
              </NotebookButton>
            ))}
          </NotebookList>
        </FormSection>
      )}

      <div className="mt-8">
        <CreateButton onClick={handleCreate} className="w-full" bgColor={selectedColor}>
          기록장 만들기
        </CreateButton>
      </div>
    </CreateContainer>
  );
}

const CreateContainer = styled.div`
  max-width: 700px;
  margin: 2rem auto;
  padding: 2rem;
  background: #fffdfa;
  border: 1px solid #e9e1d4;
  border-radius: 14px;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.04);
`;

const FormSection = styled.section`
  margin-bottom: 2rem;
`;

const HeaderRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

const InputField = styled.input`
  width: 100%;
  padding: 0.7rem 0.75rem;
  border: 1px solid #d9d7d2;
  border-radius: 8px;
  background: #fff;
  font-size: 1rem;
  outline: none;

  &:focus {
    border-color: #7aa1db;
    box-shadow: 0 0 0 3px rgba(122, 161, 219, 0.2);
  }
`;

const ChecklistItem = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const ItemIndex = styled.span`
  min-width: 28px;
  color: #8a8f9a;
  font-weight: 600;
  text-align: center;
`;

const TextButton = styled.button`
  color: #2f6cc7;
  font-size: 0.875rem;
  font-weight: 600;
`;

const DeleteButton = styled.button`
  color: #9ca3af;
  font-size: 0.8rem;
  padding: 0.35rem 0.45rem;

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const NotebookList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.5rem;
`;

const NotebookButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: left;
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #fff;

  strong {
    font-size: 0.95rem;
    color: #111827;
  }

  span {
    color: #6b7280;
    font-size: 0.8rem;
  }

  &:hover {
    border-color: #c3d5f2;
    background: #f8fbff;
  }
`;
