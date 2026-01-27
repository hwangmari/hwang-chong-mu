"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import Link from "next/link";
import { createBoard } from "@/services/schedule"; // 👈 변경

export default function CreateSchedulePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return alert("일정관리 제목을 입력해주세요!");

    setIsSubmitting(true);
    try {
      // ✨ 보드 생성
      const newBoard = await createBoard(formData.title, formData.description);
      router.push(`/schedule/${newBoard.id}`);
    } catch (error) {
      console.error(error);
      alert("생성 실패!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <StPageContainer>
      <StFormContainer>
        <StHeader>
          <h2>새 일정관리 만들기</h2>
          <p>여러 프로젝트 일정을 한눈에 관리할 수 있는 보드를 만듭니다.</p>
        </StHeader>
        <StForm onSubmit={handleSubmit}>
          <StFormGroup>
            <label>
              보드 이름 <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 2026 황총무 전체 일정"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              autoFocus
            />
          </StFormGroup>
          <StFormGroup>
            <label>설명</label>
            <textarea
              placeholder="이 보드에 대한 설명..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </StFormGroup>
          <StSubmitButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "생성 중..." : "생성하기"}
          </StSubmitButton>
        </StForm>
      </StFormContainer>
    </StPageContainer>
  );
}

// ... 스타일은 기존과 동일 (생략) ...
const StPageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9fafb;
  padding: 3rem 1rem;
`;
const StFormContainer = styled.div`
  width: 100%;
  max-width: 500px;
  background: white;
  padding: 1.5rem;
  border-radius: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;
const StHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
  .back-link {
    color: #6b7280;
    text-decoration: none;
    display: block;
    margin-bottom: 1rem;
  }
  h2 {
    font-size: 1.5rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
  }
  p {
    color: #6b7280;
  }
`;
const StForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;
const StFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  label {
    font-weight: 700;
    color: #374151;
    .req {
      color: #ef4444;
    }
  }
  input,
  textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 12px;
  }
  textarea {
    min-height: 100px;
    resize: none;
  }
`;
const StSubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #111827;
  color: white;
  font-weight: 700;
  border-radius: 12px;
  transition: background-color 0.2s;
  &:hover {
    background-color: #000;
  }
  &:disabled {
    opacity: 0.7;
  }
`;
