"use client";

import { formatDurationMin } from "@/app/workout/helpers";
import { lessonMinutes, lessonPartsLabel } from "@/data/tennisLessons";
import { SkeletonList } from "@/components/common/Skeleton";
import {
  StCard,
  StCardHead,
  StCardTitle,
  StDelBtn,
  StEditBtn,
  StEmpty,
} from "@/app/gift-log/page.styles";
import { needsTips, type LessonRecord } from "../repository";
import {
  StLessonDate,
  StLessonHead,
  StLessonActions,
  StLessonItem,
  StLessonList,
  StLessonMeta,
  StLessonTips,
  StLessonTitle,
  StPill,
  StRaw,
  StTipGroup,
  StTipPoints,
  StTipTopic,
} from "../page.styles";
import TipText from "./TipText";

const WEEKDAY = ["일", "월", "화", "수", "목", "금", "토"];

/** "10월 15일 (목)" */
export function lessonDateLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return `${m}월 ${d}일 (${WEEKDAY[day]})`;
}

type Props = {
  loading: boolean;
  lessons: LessonRecord[];
  busy: boolean;
  onEdit: (lesson: LessonRecord) => void;
  onRemove: (lesson: LessonRecord) => void;
};

export default function LessonList({ loading, lessons, busy, onEdit, onRemove }: Props) {
  if (loading) return <SkeletonList count={2} lines={4} />;

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>📒 레슨 일지</StCardTitle>
      </StCardHead>

      {lessons.length === 0 ? (
        <StEmpty>아직 적은 일지가 없어요. 레슨이 끝나면 <b>쓰기</b> 탭에서 적어 보세요.</StEmpty>
      ) : (
        <StLessonList>
          {lessons.map((lesson) => {
            const minutes = lessonMinutes(lesson);
            const pending = needsTips(lesson);
            return (
              <StLessonItem key={lesson.id}>
                <StLessonHead>
                  <StLessonTitle>
                    <StLessonDate dateTime={lesson.date}>{lessonDateLabel(lesson.date)}</StLessonDate>
                    <StLessonMeta>
                      {lesson.parts.length > 0 ? <span>{lessonPartsLabel(lesson)}</span> : null}
                      {minutes > 0 && lesson.parts.length > 1 ? <span>· 총 {formatDurationMin(minutes)}</span> : null}
                      {pending ? (
                        <StPill $tone="amber">{lesson.tips.length === 0 ? "팁 정리 전" : "다시 정리"}</StPill>
                      ) : null}
                      {lesson.activityId ? (
                        <StPill $tone="teal">운동 기록 ✓</StPill>
                      ) : (
                        <StPill $tone="gray">운동 기록 없음</StPill>
                      )}
                    </StLessonMeta>
                  </StLessonTitle>
                  <StLessonActions>
                    <StEditBtn type="button" disabled={busy} onClick={() => onEdit(lesson)}>
                      고치기
                    </StEditBtn>
                    <StDelBtn type="button" disabled={busy} onClick={() => onRemove(lesson)}>
                      지우기
                    </StDelBtn>
                  </StLessonActions>
                </StLessonHead>

                {lesson.raw.trim() ? <StRaw>{lesson.raw}</StRaw> : null}

                {lesson.tips.length > 0 ? (
                  <StLessonTips>
                    {lesson.tips.map((tip) => (
                      <StTipGroup key={tip.topic}>
                        <StTipTopic>💡 {tip.topic}</StTipTopic>
                        <StTipPoints>
                          {tip.points.map((point) => (
                            <li key={point}>
                              <TipText text={point} />
                            </li>
                          ))}
                        </StTipPoints>
                      </StTipGroup>
                    ))}
                  </StLessonTips>
                ) : null}
              </StLessonItem>
            );
          })}
        </StLessonList>
      )}
    </StCard>
  );
}
