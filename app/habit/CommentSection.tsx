"use client";

import { useEffect, useState, useCallback } from "react";
import styled from "styled-components";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { GoalComment } from "@/types";
import SendIcon from "@mui/icons-material/Send";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonIcon from "@mui/icons-material/Person";

interface Props {
  goalId: number;
  themeColor: string;
  selectedDate: Date;
}

export default function CommentSection({
  goalId,
  themeColor,
  selectedDate,
}: Props) {
  const [comments, setComments] = useState<GoalComment[]>([]);
  const [nickname, setNickname] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  // 댓글 목록 불러오기
  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("goal_comments")
      .select("*")
      .eq("goal_id", goalId)
      .eq("record_date", dateStr)
      .order("created_at", { ascending: false });

    if (data) setComments(data);
  }, [goalId, dateStr]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchComments();
  }, [fetchComments]);

  // 댓글 등록
  const handleSubmit = async () => {
    if (!nickname.trim() || !content.trim()) {
      return alert("닉네임과 내용을 모두 입력해주세요!");
    }
    setLoading(true);

    const { error } = await supabase.from("goal_comments").insert({
      goal_id: goalId,
      nickname,
      content,
      record_date: dateStr,
    });

    if (error) {
      alert("댓글 등록에 실패했습니다.");
    } else {
      setContent(""); // 닉네임은 유지
      fetchComments();
    }
    setLoading(false);
  };

  // 댓글 삭제
  const handleDelete = async (id: number) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("goal_comments")
      .delete()
      .eq("id", id);

    if (error) {
      alert("삭제 실패!");
    } else {
      fetchComments();
    }
  };

  return (
    <StCommentContainer>
      <StTitle>📝 {format(selectedDate, "M월 d일")}의 기록</StTitle>

      <StForm>
        <StInputGroup>
          <StNicknameInput
            placeholder="이름" // 닉네임 -> 이름 (조금 더 차분하게)
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            $focusColor={themeColor}
          />
          <StContentInput
            placeholder="오늘 활동은 어땠나요? (엔터로 등록)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.nativeEvent.isComposing && handleSubmit()
            }
            $focusColor={themeColor}
          />
          <StSubmitButton
            onClick={handleSubmit}
            disabled={loading}
            $bgColor={themeColor}
          >
            <SendIcon sx={{ fontSize: 18 }} />
          </StSubmitButton>
        </StInputGroup>
      </StForm>

      {/* 댓글 리스트 */}
      <StCommentList>
        {comments.length === 0 ? (
          <StEmptyState>
            {format(selectedDate, "M월 d일")}의 기록이 없어요. 첫 기록을
            남겨보세요! ✍️
          </StEmptyState>
        ) : (
          comments.map((comment) => (
            <StCommentItem key={comment.id}>
              <StProfile>
                <StAvatar $bgColor={themeColor}>
                  <PersonIcon sx={{ fontSize: 16, color: "white" }} />
                </StAvatar>
              </StProfile>
              <StBubbleWrapper>
                <StBubbleHeader>
                  <StNickname>{comment.nickname}</StNickname>
                  {/* 작성 시간만 간단히 표시 */}
                  <StDate>
                    {format(new Date(comment.created_at), "HH:mm")}
                  </StDate>
                  <StDeleteBtn onClick={() => handleDelete(comment.id)}>
                    {" "}
                    {/* handleDelete는 기존 로직 유지 */}
                    <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                  </StDeleteBtn>
                </StBubbleHeader>
                <StContent>{comment.content}</StContent>
              </StBubbleWrapper>
            </StCommentItem>
          ))
        )}
      </StCommentList>
    </StCommentContainer>
  );
}

// ✨ 스타일 정의
const StCommentContainer = styled.div`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 2px dashed #e2e8f0;
`;

const StTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 1rem;
`;

const StForm = styled.div`
  margin-bottom: 1.5rem;
`;

const StInputGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const StNicknameInput = styled.input<{ $focusColor: string }>`
  width: 80px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  outline: none;
  background: #f8fafc;
  &:focus {
    border-color: ${({ $focusColor }) => $focusColor};
    background: white;
  }
`;

const StContentInput = styled.input<{ $focusColor: string }>`
  flex: 1;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 0.9rem;
  outline: none;
  &:focus {
    border-color: ${({ $focusColor }) => $focusColor};
  }
`;

const StSubmitButton = styled.button<{ $bgColor: string }>`
  width: 40px;
  background: ${({ $bgColor }) => $bgColor};
  color: white;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: opacity 0.2s;
  &:hover {
    opacity: 0.9;
  }
  &:disabled {
    background: #cbd5e1;
    cursor: not-allowed;
  }
`;

const StCommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StEmptyState = styled.div`
  text-align: center;
  color: #94a3b8;
  padding: 1rem;
  font-size: 0.9rem;
`;

const StCommentItem = styled.div`
  display: flex;
  gap: 10px;
  align-items: flex-start;
`;

const StProfile = styled.div`
  flex-shrink: 0;
`;

const StAvatar = styled.div<{ $bgColor: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $bgColor }) => $bgColor}80; // 투명도 조절
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StBubbleWrapper = styled.div`
  flex: 1;
  background: #f1f5f9;
  padding: 10px 14px;
  border-radius: 0 16px 16px 16px;
`;

const StBubbleHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
`;

const StNickname = styled.span`
  font-weight: 700;
  font-size: 0.85rem;
  color: #334155;
`;

const StDate = styled.span`
  font-size: 0.75rem;
  color: #94a3b8;
  flex: 1;
`;

const StDeleteBtn = styled.button`
  background: none;
  border: none;
  padding: 0;
  color: #cbd5e1;
  cursor: pointer;
  &:hover {
    color: #ef4444;
  }
`;

const StContent = styled.p`
  font-size: 0.95rem;
  color: #475569;
  line-height: 1.4;
  word-break: break-all;
`;
