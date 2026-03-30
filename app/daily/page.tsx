"use client";

import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { Typography } from "@hwangchongmu/ui";
import CreateButton from "@/components/common/CreateButton";
import { createDailyNotebook } from "./repository";
import {
  clearLegacyDailyLocalData,
  getMonthKey,
  sanitizeChecklist,
  setStoredDailyAccessCode,
} from "./storage";

export default function DailyCreatePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [items, setItems] = useState(["운동", "물 2L", "영양제"]);
  const [accessCode, setAccessCode] = useState("");
  const [openNotebookId, setOpenNotebookId] = useState("");
  const [openAccessCode, setOpenAccessCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    clearLegacyDailyLocalData();
  }, []);

  const addItem = () => setItems((prev) => [...prev, ""]);

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, current) => current !== index));
  };

  const updateItem = (index: number, value: string) => {
    setItems((prev) =>
      prev.map((item, current) => (current === index ? value : item)),
    );
  };

  const handleCreate = async () => {
    const trimmedTitle = title.trim();
    const checklist = sanitizeChecklist(items);
    const trimmedCode = accessCode.trim();

    if (!trimmedTitle) {
      alert("기록장 이름을 입력해주세요.");
      return;
    }

    if (trimmedCode.length < 4) {
      alert("접근 비밀번호는 4자 이상 입력해주세요.");
      return;
    }

    setIsCreating(true);
    try {
      const notebookId = await createDailyNotebook(
        trimmedTitle,
        trimmedCode,
        getMonthKey(new Date()),
        checklist,
      );
      setStoredDailyAccessCode(notebookId, trimmedCode);
      router.push(`/daily/${notebookId}`);
    } catch (error) {
      console.error("기록장 생성 실패:", error);
      alert("기록장을 서버에 저장하지 못했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenNotebook = () => {
    const trimmedId = openNotebookId.trim();
    const trimmedCode = openAccessCode.trim();

    if (!trimmedId) {
      alert("기록장 ID를 입력해주세요.");
      return;
    }

    if (!trimmedCode) {
      alert("접근 비밀번호를 입력해주세요.");
      return;
    }

    setIsOpening(true);
    setStoredDailyAccessCode(trimmedId, trimmedCode);
    router.push(`/daily/${trimmedId}`);
  };

  return (
    <CreateContainer>
      <header className="mb-10 text-center">
        <Typography variant="h1" className="mb-2">
          📓 일일 기록
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          이제 기록은 브라우저가 아니라 서버에서 불러옵니다.
        </Typography>
      </header>

      <FormSection>
        <Typography variant="h3" className="mb-3">
          1. 기록장 이름
        </Typography>
        <InputField
          placeholder="예: 4월 루틴 기록장"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </FormSection>

      <FormSection>
        <HeaderRow>
          <Typography variant="h3">2. 접근 비밀번호</Typography>
        </HeaderRow>
        <InputField
          type="password"
          placeholder="4자 이상 입력해주세요"
          value={accessCode}
          onChange={(event) => setAccessCode(event.target.value)}
        />
        <HelperText>
          서버에 암호화되어 저장되므로 이후에도 이 비밀번호가 필요해요.
        </HelperText>
      </FormSection>

      <FormSection>
        <HeaderRow>
          <Typography variant="h3">3. 체크리스트 항목</Typography>
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
              onChange={(event) => updateItem(index, event.target.value)}
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

      <div className="mt-8">
        <CreateButton
          onClick={handleCreate}
          className="w-full"
          bgColor="#22c55e"
          disabled={isCreating}
        >
          {isCreating ? "기록장 만드는 중..." : "기록장 만들기"}
        </CreateButton>
      </div>

      <OpenSection>
        <Typography variant="h3" className="mb-3">
          기존 기록장 열기
        </Typography>
        <OpenGrid>
          <InputField
            placeholder="기록장 ID"
            value={openNotebookId}
            onChange={(event) => setOpenNotebookId(event.target.value)}
          />
          <InputField
            type="password"
            placeholder="접근 비밀번호"
            value={openAccessCode}
            onChange={(event) => setOpenAccessCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleOpenNotebook();
              }
            }}
          />
        </OpenGrid>
        <OpenButton type="button" onClick={handleOpenNotebook} disabled={isOpening}>
          기록장 열기
        </OpenButton>
      </OpenSection>
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

const OpenSection = styled.section`
  margin-top: 2.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #ece4d8;
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

const HelperText = styled.p`
  margin-top: 0.55rem;
  font-size: 0.85rem;
  color: #6b7280;
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

const OpenGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 0.75rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const OpenButton = styled.button`
  margin-top: 0.75rem;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #fff;
  color: #1f2937;
  padding: 0.65rem 0.9rem;
  font-size: 0.92rem;
  font-weight: 700;
`;
