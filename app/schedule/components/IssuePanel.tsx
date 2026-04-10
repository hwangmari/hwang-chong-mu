"use client";

import { useState } from "react";
import styled from "styled-components";
import { ScheduleIssue, IssueSeverity, IssueStatus } from "@/types/work-schedule";
import * as API from "@/services/schedule";

const SEVERITY_CONFIG = {
  blocker: { label: "블로커", color: "#ef4444", bg: "#fef2f2", icon: "🔴" },
  warning: { label: "주의", color: "#f59e0b", bg: "#fffbeb", icon: "🟡" },
  normal: { label: "정상", color: "#10b981", bg: "#ecfdf5", icon: "🟢" },
};

const STATUS_CONFIG = {
  open: { label: "열림", color: "#3b82f6" },
  in_progress: { label: "진행 중", color: "#f59e0b" },
  resolved: { label: "해결", color: "#10b981" },
};

interface Props {
  serviceId: string;
  issues: ScheduleIssue[];
  onReload: () => void;
}

export default function IssuePanel({ serviceId, issues, onReload }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IssueSeverity>("normal");
  const [loading, setLoading] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const openIssues = issues.filter((i) => i.status !== "resolved");
  const resolvedIssues = issues.filter((i) => i.status === "resolved");

  const handleCreate = async () => {
    if (!title.trim()) return;
    setLoading(true);
    try {
      await API.createIssue(serviceId, title.trim(), description.trim(), severity);
      setTitle("");
      setDescription("");
      setSeverity("normal");
      setShowForm(false);
      onReload();
    } catch (err) {
      console.error(err);
      alert("이슈 생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (issueId: string, status: IssueStatus) => {
    try {
      await API.updateIssue(issueId, { status });
      onReload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (issueId: string) => {
    if (!confirm("이슈를 삭제하시겠습니까?")) return;
    try {
      await API.deleteIssue(issueId);
      onReload();
    } catch (err) {
      console.error(err);
    }
  };

  const renderIssue = (issue: ScheduleIssue) => {
    const sev = SEVERITY_CONFIG[issue.severity];
    const stat = STATUS_CONFIG[issue.status];

    return (
      <StIssueItem key={issue.id} $severity={issue.severity}>
        <StIssueHeader>
          <StIssueBadges>
            <StSeverityBadge $color={sev.color} $bg={sev.bg}>
              {sev.icon} {sev.label}
            </StSeverityBadge>
            <StStatusSelect
              value={issue.status}
              onChange={(e) =>
                handleStatusChange(issue.id, e.target.value as IssueStatus)
              }
              $color={stat.color}
            >
              <option value="open">열림</option>
              <option value="in_progress">진행 중</option>
              <option value="resolved">해결</option>
            </StStatusSelect>
          </StIssueBadges>
          <StDeleteBtn onClick={() => handleDelete(issue.id)}>✕</StDeleteBtn>
        </StIssueHeader>
        <StIssueTitle $resolved={issue.status === "resolved"}>
          {issue.title}
        </StIssueTitle>
        {issue.description && (
          <StIssueDesc>{issue.description}</StIssueDesc>
        )}
      </StIssueItem>
    );
  };

  return (
    <StContainer>
      <StPanelHeader>
        <StPanelTitle>
          이슈 트래킹
          {openIssues.length > 0 && (
            <StIssueCount>{openIssues.length}</StIssueCount>
          )}
        </StPanelTitle>
        <StAddBtn onClick={() => setShowForm(!showForm)}>
          {showForm ? "취소" : "+ 이슈"}
        </StAddBtn>
      </StPanelHeader>

      {showForm && (
        <StForm>
          <StFormInput
            placeholder="이슈 제목"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <StFormTextarea
            placeholder="설명 (선택)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <StFormRow>
            <StSeverityGroup>
              {(["normal", "warning", "blocker"] as IssueSeverity[]).map((s) => (
                <StSeverityOption
                  key={s}
                  $active={severity === s}
                  $color={SEVERITY_CONFIG[s].color}
                  onClick={() => setSeverity(s)}
                >
                  {SEVERITY_CONFIG[s].icon} {SEVERITY_CONFIG[s].label}
                </StSeverityOption>
              ))}
            </StSeverityGroup>
            <StSubmitBtn onClick={handleCreate} disabled={!title.trim() || loading}>
              {loading ? "..." : "등록"}
            </StSubmitBtn>
          </StFormRow>
        </StForm>
      )}

      <StIssueList>
        {openIssues.length === 0 && !showForm && (
          <StEmpty>등록된 이슈가 없습니다.</StEmpty>
        )}
        {openIssues.map(renderIssue)}
      </StIssueList>

      {resolvedIssues.length > 0 && (
        <StResolvedSection>
          <StResolvedToggle onClick={() => setShowResolved(!showResolved)}>
            {showResolved ? "▼" : "▶"} 해결된 이슈 ({resolvedIssues.length})
          </StResolvedToggle>
          {showResolved && (
            <StIssueList>{resolvedIssues.map(renderIssue)}</StIssueList>
          )}
        </StResolvedSection>
      )}
    </StContainer>
  );
}

// ── Styled Components ──

const StContainer = styled.div`
  border-top: 1px solid #f3f4f6;
  padding-top: 1rem;
`;

const StPanelHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
  margin-bottom: 0.75rem;
`;

const StPanelTitle = styled.h3`
  font-size: 0.95rem;
  font-weight: 800;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StIssueCount = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: #ef4444;
  background: #fef2f2;
  padding: 1px 8px;
  border-radius: 9999px;
`;

const StAddBtn = styled.button`
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: #3b82f6;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: #dbeafe;
  }
`;

const StForm = styled.div`
  margin: 0 1rem 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const StFormInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const StFormTextarea = styled.textarea`
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.85rem;
  resize: none;
  &:focus {
    outline: none;
    border-color: #3b82f6;
  }
`;

const StFormRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
`;

const StSeverityGroup = styled.div`
  display: flex;
  gap: 4px;
`;

const StSeverityOption = styled.button<{ $active: boolean; $color: string }>`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid ${({ $active, $color }) => ($active ? $color : "#e5e7eb")};
  background: ${({ $active, $color }) => ($active ? `${$color}15` : "white")};
  color: ${({ $active, $color }) => ($active ? $color : "#9ca3af")};
  transition: all 0.15s;
`;

const StSubmitBtn = styled.button`
  padding: 5px 14px;
  border-radius: 6px;
  background: #111827;
  color: white;
  font-size: 0.8rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

const StIssueList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0 1rem;
`;

const StIssueItem = styled.div<{ $severity: string }>`
  padding: 0.6rem 0.75rem;
  border-radius: 0.6rem;
  background: white;
  border: 1px solid ${({ $severity }) =>
    $severity === "blocker" ? "#fecaca" : $severity === "warning" ? "#fde68a" : "#e5e7eb"};
  border-left: 3px solid ${({ $severity }) =>
    SEVERITY_CONFIG[$severity as IssueSeverity]?.color || "#e5e7eb"};
`;

const StIssueHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
`;

const StIssueBadges = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const StSeverityBadge = styled.span<{ $color: string; $bg: string }>`
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  color: ${({ $color }) => $color};
  background: ${({ $bg }) => $bg};
`;

const StStatusSelect = styled.select<{ $color: string }>`
  font-size: 0.7rem;
  font-weight: 700;
  padding: 1px 4px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: ${({ $color }) => $color};
  background: white;
  cursor: pointer;
  &:focus {
    outline: none;
  }
`;

const StDeleteBtn = styled.button`
  background: none;
  border: none;
  color: #d1d5db;
  cursor: pointer;
  font-size: 0.8rem;
  padding: 2px 4px;
  border-radius: 3px;
  &:hover {
    color: #ef4444;
    background: #fef2f2;
  }
`;

const StIssueTitle = styled.div<{ $resolved: boolean }>`
  font-size: 0.85rem;
  font-weight: 700;
  color: ${({ $resolved }) => ($resolved ? "#9ca3af" : "#374151")};
  text-decoration: ${({ $resolved }) => ($resolved ? "line-through" : "none")};
`;

const StIssueDesc = styled.div`
  font-size: 0.78rem;
  color: #9ca3af;
  margin-top: 2px;
  line-height: 1.4;
`;

const StEmpty = styled.div`
  text-align: center;
  color: #d1d5db;
  font-size: 0.85rem;
  padding: 1rem 0;
`;

const StResolvedSection = styled.div`
  margin-top: 0.75rem;
  padding: 0 1rem;
`;

const StResolvedToggle = styled.button`
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  padding: 4px 0;
  margin-bottom: 0.5rem;
  &:hover {
    color: #6b7280;
  }
`;
