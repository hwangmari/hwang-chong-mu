"use client";

import { Button } from "@hwangchongmu/ui";
import { useState } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { SchedulePhase } from "@/types/work-schedule";
import * as API from "@/services/schedule";

interface Props {
  date: Date;
  phases: SchedulePhase[];
  serviceId: string;
  onClose: () => void;
  onCreated: () => void;
}

export default function QuickTaskModal({
  date,
  phases,
  serviceId,
  onClose,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [endDate, setEndDate] = useState(format(date, "yyyy-MM-dd"));
  const [selectedPhaseId, setSelectedPhaseId] = useState(
    phases.filter((s) => !s.isCompleted)[0]?.id || "",
  );
  const [loading, setLoading] = useState(false);

  const activePhases = phases.filter((s) => !s.isCompleted);

  const handleSubmit = async () => {
    if (!title.trim() || !selectedPhaseId) return;
    setLoading(true);
    try {
      const parsedEnd = new Date(endDate);
      const finalEnd = parsedEnd >= date ? parsedEnd : date;
      await API.createTask(selectedPhaseId, {
        title: title.trim(),
        startDate: date,
        endDate: finalEnd,
        memo: "",
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("일정 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <StOverlay onClick={onClose}>
      <StModal onClick={(e) => e.stopPropagation()}>
        <StDate>{format(date, "yyyy년 M월 d일")}</StDate>
        <StTitle>빠른 일정 등록</StTitle>

        {activePhases.length === 0 ? (
          <StEmpty>
            등록된 단계가 없습니다.
            <br />
            먼저 우측 패널에서 단계를 추가해주세요.
          </StEmpty>
        ) : (
          <>
            <StSelect
              value={selectedPhaseId}
              onChange={(e) => setSelectedPhaseId(e.target.value)}
            >
              {activePhases.map((phase) => (
                <option key={phase.id} value={phase.id}>
                  {phase.phaseName}
                </option>
              ))}
            </StSelect>

            <StInput
              placeholder="일정 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />

            <StDateRow>
              <StDateLabel>종료일</StDateLabel>
              <StDateInput
                type="date"
                value={endDate}
                min={format(date, "yyyy-MM-dd")}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </StDateRow>

            <StActions>
              <Button color="light" variant="fill" size="small" onClick={onClose}>
                취소
              </Button>
              <Button
                color="dark"
                variant="fill"
                size="small"
                onClick={handleSubmit}
                disabled={!title.trim() || loading}
              >
                {loading ? "생성 중..." : "등록"}
              </Button>
            </StActions>
          </>
        )}
      </StModal>
    </StOverlay>
  );
}

const StOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  z-index: 300;
  padding: 1rem;
`;

const StModal = styled.div`
  width: min(100%, 22rem);
  background: ${({ theme }) => theme.colors.white};
  border-radius: 1.25rem;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
`;

const StDate = styled.div`
  font-size: 0.8rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.blue600};
`;

const StTitle = styled.h3`
  font-size: 1.15rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.gray900};
  margin: 0;
`;

const StEmpty = styled.p`
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray500};
  line-height: 1.6;
  text-align: center;
  padding: 1rem 0;
`;

const StSelect = styled.select`
  padding: 0.7rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.75rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray800};
  background: ${({ theme }) => theme.colors.white};
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
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

const StDateRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const StDateLabel = styled.span`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.gray500};
  white-space: nowrap;
`;

const StDateInput = styled.input`
  flex: 1;
  padding: 0.55rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.gray200};
  border-radius: 0.6rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.gray800};
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.blue500};
  }
`;

const StActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.25rem;
`;

