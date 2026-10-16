"use client";

import { useMemo } from "react";
import { SkeletonList } from "@/components/common/Skeleton";
import {
  StCard,
  StCardHead,
  StCardHint,
  StCardTitle,
  StEmpty,
} from "@/app/gift-log/page.styles";
import type { LessonRecord } from "../repository";
import { StTipDates, StTipGroup, StTipPoints, StTipTopic } from "../page.styles";
import TipText from "./TipText";

type TopicGroup = {
  topic: string;
  /** 이 주제가 나온 날짜들 (최근 먼저) */
  dates: string[];
  points: string[];
};

/** 여러 일지의 팁을 주제 이름으로 모은다. 최근에 배운 주제가 위로 온다. */
function groupByTopic(lessons: LessonRecord[]): TopicGroup[] {
  const map = new Map<string, TopicGroup>();
  // lessons 는 최근 날짜 먼저 들어온다
  for (const lesson of lessons) {
    for (const tip of lesson.tips) {
      const key = tip.topic.trim();
      const group = map.get(key) ?? { topic: key, dates: [], points: [] };
      if (!group.dates.includes(lesson.date)) group.dates.push(lesson.date);
      for (const point of tip.points) {
        if (!group.points.includes(point)) group.points.push(point);
      }
      map.set(key, group);
    }
  }
  return [...map.values()];
}

function shortDate(iso: string) {
  const [, m, d] = iso.split("-").map(Number);
  return `${m}/${d}`;
}

type Props = {
  loading: boolean;
  lessons: LessonRecord[];
  pendingCount: number;
};

export default function TipBoard({ loading, lessons, pendingCount }: Props) {
  const groups = useMemo(() => groupByTopic(lessons), [lessons]);

  if (loading) return <SkeletonList count={1} lines={6} />;

  return (
    <StCard>
      <StCardHead>
        <StCardTitle>💡 팁 모아보기</StCardTitle>
      </StCardHead>

      {groups.length === 0 ? (
        <StEmpty>아직 정리된 팁이 없어요. 일지를 적어 두면 클로드가 읽고 주제별로 채워요.</StEmpty>
      ) : (
        <div>
          {groups.map((group) => (
            <StTipGroup key={group.topic}>
              <StTipTopic>
                <span>{group.topic}</span>
                <StTipDates>{group.dates.map(shortDate).join(" · ")}</StTipDates>
              </StTipTopic>
              <StTipPoints>
                {group.points.map((point) => (
                  <li key={point}>
                    <TipText text={point} />
                  </li>
                ))}
              </StTipPoints>
            </StTipGroup>
          ))}
        </div>
      )}

      {pendingCount > 0 ? (
        <StCardHint>
          아직 정리 전인 일지 <b>{pendingCount}건</b>은 여기에 없어요. 클로드에게 &quot;레슨 팁 정리해 줘&quot;라고 하면 채워져요.
        </StCardHint>
      ) : null}
    </StCard>
  );
}
