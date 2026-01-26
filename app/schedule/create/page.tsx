"use client";

import styled from "styled-components";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CreateSchedulePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6", // 기본값: 파랑
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return alert("서비스 이름을 입력해주세요!");

    // TODO: Supabase에 새 서비스 저장 로직 추가
    // const newId = await createService(formData);
    const mockNewId = `svc_${Date.now()}`; // 임시 ID 생성

    // 생성 후 상세 페이지로 이동
    router.push(`/schedule/${mockNewId}`);
  };

  return (
    <StPageContainer>
      <StFormContainer>
        <StHeader>
          <Link href="/schedule" className="back-link">
            ← 목록으로
          </Link>
          <h2>새 서비스 만들기</h2>
          <p>팀원들과 공유할 새로운 업무 일정 대시보드를 생성합니다.</p>
        </StHeader>

        <StForm onSubmit={handleSubmit}>
          <StFormGroup>
            <label>
              서비스 이름 <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="예: 황총무 2.0 리뉴얼"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              autoFocus
            />
          </StFormGroup>

          <StFormGroup>
            <label>간단한 설명</label>
            <textarea
              placeholder="이 프로젝트의 목표나 기간 등을 적어주세요."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </StFormGroup>

          <StFormGroup>
            <label>테마 색상</label>
            <div className="color-picker-wrapper">
              <input
                type="color"
                value={formData.color}
                onChange={(e) =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
              <span className="color-code">{formData.color}</span>
            </div>
            <p className="help-text">
              캘린더에서 이 서비스의 대표 색상으로 표시됩니다.
            </p>
          </StFormGroup>

          <StButtonDetails>
            <StSubmitButton type="submit">생성하기</StSubmitButton>
          </StButtonDetails>
        </StForm>
      </StFormContainer>
    </StPageContainer>
  );
}

// --- 스타일 ---
const StPageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f9fafb;
  padding: 1rem;
`;

const StFormContainer = styled.div`
  width: 100%;
  max-width: 500px;
  background: white;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
`;

const StHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;

  .back-link {
    display: inline-block;
    font-size: 0.85rem;
    color: #6b7280;
    margin-bottom: 1rem;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }

  h2 {
    font-size: 1.5rem;
    font-weight: 800;
    color: #111827;
    margin-bottom: 0.5rem;
  }

  p {
    color: #6b7280;
    font-size: 0.9rem;
    word-break: keep-all;
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
    font-size: 0.9rem;
    font-weight: 700;
    color: #374151;

    .req {
      color: #ef4444;
      margin-left: 2px;
    }
  }

  input[type="text"],
  textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    font-size: 0.95rem;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
  }

  textarea {
    min-height: 100px;
    resize: none;
  }

  .color-picker-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 12px;
    background-color: white;

    input[type="color"] {
      width: 40px;
      height: 40px;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
    }

    .color-code {
      font-family: monospace;
      color: #6b7280;
      font-size: 0.9rem;
    }
  }

  .help-text {
    font-size: 0.8rem;
    color: #9ca3af;
  }
`;

const StButtonDetails = styled.div`
  margin-top: 1rem;
`;

const StSubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: #111827;
  color: white;
  font-weight: 700;
  font-size: 1rem;
  border-radius: 12px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #000;
  }

  &:active {
    transform: scale(0.98);
  }
`;
