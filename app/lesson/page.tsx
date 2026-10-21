"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ServiceLayout from "@/components/common/ServiceLayout";
import { useModal } from "@/components/common/ModalProvider";
import { SkeletonBlock, SkeletonCard } from "@/components/common/Skeleton";
import { LESSON_GUIDE_DATA } from "@/data/footerGuides";
import { TENNIS_LESSONS, type TennisLesson } from "@/data/tennisLessons";
import { formatDurationMin, todayISO } from "@/app/workout/helpers";
import { useWorkoutSession } from "@/app/workout/useWorkoutSession";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@hwangchongmu/ui";
import {
  StError,
  StLoginCard,
  StLoginDesc,
  StLoginEmoji,
  StLoginTitle,
  StOwnerPill,
  StPageTab,
  StPageTabs,
  StTabCount,
} from "@/app/gift-log/page.styles";
import {
  countUnmovedRoomLessons,
  deleteLesson,
  fetchLessons,
  findUnlinkedTennisActivity,
  importRoomLessons,
  LESSON_STORE_MISSING,
  needsTips,
  saveLesson,
  type LessonRecord,
} from "./repository";
import LessonForm, { formMinutes, type LessonFormState } from "./components/LessonForm";
import LessonList, { lessonDateLabel } from "./components/LessonList";
import TipBoard from "./components/TipBoard";
import { StHintLink, StSeedBand } from "./page.styles";

type Tab = "write" | "list" | "tips";

/* 세 가지 상태(불러오는 중·로그인 전·일지)가 같은 제목을 쓴다 */
const INTRO_ICON = "🎾";
const INTRO_TITLE = "테니스 레슨 일지";

const GUIDE = {
  title: LESSON_GUIDE_DATA.title,
  tips: LESSON_GUIDE_DATA.tips,
};

/** 새 일지는 지난번 구성(레슨 20분 · 볼머신 20분)을 그대로 깔고 시작한다 — 대개 같은 구성이라서 */
function emptyForm(last?: LessonRecord): LessonFormState {
  const parts = last?.parts.length
    ? last.parts.map((p) => ({ name: p.name, minutes: String(p.minutes) }))
    : [{ name: "레슨", minutes: "" }];
  return { id: null, date: todayISO(), parts, raw: "" };
}

function toParts(form: LessonFormState): TennisLesson["parts"] {
  return form.parts
    .map((p) => ({ name: p.name.trim(), minutes: Number(p.minutes) || 0 }))
    .filter((p) => p.name || p.minutes > 0)
    .map((p) => ({ name: p.name || "테니스", minutes: p.minutes }));
}

// 불러오기 실패 문구 — 저장 공간(표·함수)이 아직 없으면 무엇을 실행해야 하는지 알려 준다
function loadErrorMessage(e: unknown) {
  return e instanceof Error && e.message === LESSON_STORE_MISSING
    ? "레슨 일지 저장 공간이 아직 없어요. supabase/20261016_tennis_lessons_by_account.sql 을 먼저 실행해 주세요."
    : "일지를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.";
}

export default function LessonPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  // 운동방은 있으면 쓰는 덤이다: 있으면 저장할 때 운동 기록에 테니스 한 줄이 함께 들어간다
  const session = useWorkoutSession();
  const { openAlert, openConfirm } = useModal();

  const [tab, setTab] = useState<Tab>("write");
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // 운동방에 적어 둔 예전 일지 중 아직 내 계정으로 옮기지 않은 개수. null = 아직 세는 중이거나 세지 못함
  const [unmoved, setUnmoved] = useState<number | null>(null);
  // 손대기 전에는 지난번 구성으로 채운 빈 폼을 보여 주고, 손대는 순간부터 draft 에 담는다
  const [draft, setDraft] = useState<LessonFormState | null>(null);
  const form = draft ?? emptyForm(lessons[0]);

  const userId = user?.id ?? null;
  const roomId = session?.roomId ?? null;

  // 저장·삭제 뒤 다시 불러오기. 뼈대로 바꾸지 않고 목록을 그대로 둔 채 바꿔 끼운다
  const load = useCallback(async () => {
    try {
      setLessons(await fetchLessons());
      setError("");
    } catch (e) {
      setError(loadErrorMessage(e));
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetchLessons()
      .then((next) => alive && setLessons(next))
      .catch((e) => alive && setError(loadErrorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    if (!roomId || !userId || loading) return;
    let alive = true;
    countUnmovedRoomLessons(roomId, lessons).then((n) => alive && setUnmoved(n));
    return () => {
      alive = false;
    };
  }, [roomId, userId, loading, lessons]);

  const lessonDates = useMemo(() => new Set(lessons.map((l) => l.date)), [lessons]);
  const pendingCount = useMemo(() => lessons.filter(needsTips).length, [lessons]);
  const tipLessons = useMemo(() => lessons.filter((l) => l.tips.length > 0), [lessons]);
  const roomUnmoved = roomId ? unmoved : 0;
  const roomPending = roomUnmoved === null || roomUnmoved > 0;

  // 화면이 생기기 전에 코드에 적어 둔 일지 중 아직 옮기지 않은 것 (같은 날짜 일지가 있으면 옮긴 것으로 본다).
  // 운동방 일지를 아직 안 옮겼으면 그쪽에 같은 날이 있을 수 있어, 그걸 먼저 옮긴 뒤에 보여 준다.
  const seeds = useMemo(
    () =>
      // 운동방 개수를 다 세기 전에도 숨긴다 — 그 사이에 누르면 같은 날 일지가 두 번 들어갈 수 있다
      loading || error || roomPending
        ? []
        : TENNIS_LESSONS.filter((s) => !lessonDates.has(s.date)),
    [loading, error, roomPending, lessonDates],
  );

  function patchForm(patch: Partial<LessonFormState>) {
    setDraft({ ...form, ...patch });
  }

  function resetForm() {
    setDraft(null);
  }

  /** 새 일지일 때: 같은 날 이미 적어 둔 테니스 활동이 있으면 이어 붙일지 묻는다 */
  async function pickActivityId(date: string, minutes: number, editing?: LessonRecord) {
    if (editing) return editing.activityId;
    if (!roomId) return null;
    const existing = await findUnlinkedTennisActivity(roomId, date, lessons);
    if (!existing) return null;
    const ok = await openConfirm(
      `${lessonDateLabel(date)} 운동 기록에 테니스${existing.durationMin ? ` ${formatDurationMin(existing.durationMin)}` : ""}이 이미 있어요.\n그 줄에 이 일지를 이어 붙일까요?` +
        (minutes > 0 && minutes !== existing.durationMin
          ? `\n이어 붙이면 그 줄의 시간이 ${formatDurationMin(minutes)}으로 바뀌어요.`
          : "") +
        "\n(취소를 누르면 테니스 한 줄을 새로 더 만들어요)",
    );
    return ok ? existing.id : null;
  }

  async function submit() {
    if (busy) return;
    const parts = toParts(form);
    if (!form.date) {
      setError("날짜를 골라 주세요.");
      return;
    }
    if (!form.raw.trim() && formMinutes(form) === 0) {
      setError("배운 것을 한 줄이라도 적거나, 몇 분 했는지 넣어 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const editing = form.id ? lessons.find((l) => l.id === form.id) : undefined;
      const activityId = await pickActivityId(form.date, formMinutes(form), editing);
      await saveLesson({
        id: editing?.id,
        roomId,
        date: form.date,
        parts,
        raw: form.raw.trim(),
        activityId,
      });
      await load();
      setDraft(null);
      setTab("list");
    } catch (e) {
      setError(e instanceof Error ? e.message : "저장하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(lesson: LessonRecord) {
    setDraft({
      id: lesson.id,
      date: lesson.date,
      parts: lesson.parts.length
        ? lesson.parts.map((p) => ({ name: p.name, minutes: String(p.minutes) }))
        : [{ name: "레슨", minutes: "" }],
      raw: lesson.raw,
    });
    setError("");
    setTab("write");
  }

  async function remove(lesson: LessonRecord) {
    const ok = await openConfirm(
      `${lessonDateLabel(lesson.date)} 일지를 지울까요?` +
        (roomId && lesson.activityId ? "\n운동 기록의 테니스 한 줄도 함께 지워져요." : "") +
        "\n지우면 되돌릴 수 없어요.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await deleteLesson(lesson, roomId);
      if (form.id === lesson.id) resetForm();
      await load();
    } catch (e) {
      await openAlert(e instanceof Error ? e.message : "지우지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function importSeeds() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      for (const seed of seeds) {
        const activityId = await pickActivityId(seed.date, seed.parts.reduce((sum, p) => sum + p.minutes, 0));
        await saveLesson({ roomId, date: seed.date, parts: seed.parts, raw: seed.raw, tips: seed.tips, activityId });
      }
      await load();
      setTab("list");
    } catch (e) {
      setError(e instanceof Error ? e.message : "옮기지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  /** 운동방에 적어 둔 예전 일지를 내 계정으로 옮긴다 (운동 기록 줄은 그대로 이어진다) */
  async function importRoom() {
    if (!roomId || busy) return;
    setBusy(true);
    setError("");
    try {
      const count = await importRoomLessons(roomId);
      await load();
      setTab("list");
      await openAlert(`운동방에 적어 둔 일지 ${count}개를 내 계정으로 옮겼어요.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "옮기지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  // 로그인 확인 중엔 빈 화면 대신 같은 자리를 차지하는 뼈대를 보여 준다 (설명은 그대로 내보낸다)
  if (authLoading) {
    return (
      <ServiceLayout
        width="wide"
        intro={{
          icon: INTRO_ICON,
          title: INTRO_TITLE,
          description: "레슨에서 배운 걸 생각나는 대로 적고, 정리된 팁을 주제별로 모아 봐요.",
        }}
        guide={GUIDE}
      >
        <SkeletonBlock width="100%" height="2.5rem" radius="0.5rem" />
        <SkeletonCard height="28rem" lines={5} titleWidth="30%" />
      </ServiceLayout>
    );
  }

  if (!user) {
    return (
      <ServiceLayout
        width="narrow"
        intro={{
          icon: INTRO_ICON,
          title: INTRO_TITLE,
          description: "레슨에서 배운 걸 생각나는 대로 적고, 정리된 팁을 주제별로 모아 봐요.",
        }}
        guide={GUIDE}
      >
        <StLoginCard>
          <StLoginEmoji>🔐</StLoginEmoji>
          <StLoginTitle>로그인하면 레슨 일지를 쓸 수 있어요</StLoginTitle>
          <StLoginDesc>
            일지는 내 계정에 저장돼서 어느 기기에서든 이어서 볼 수 있어요.
            <br />
            황총무 통합 계정 하나로 다른 서비스도 함께 관리할 수 있어요.
          </StLoginDesc>
          <Button
            color="primary"
            variant="fill"
            size="medium"
            onClick={() => router.push("/login?next=/lesson")}
          >
            로그인 / 회원가입
          </Button>
        </StLoginCard>
      </ServiceLayout>
    );
  }

  return (
    <ServiceLayout
      width="wide"
      intro={{
        icon: INTRO_ICON,
        title: INTRO_TITLE,
        description: (
          <>
            <StOwnerPill>👤 {user.nickname}의 레슨 일지</StOwnerPill>
            <br />
            {roomId
              ? "레슨에서 배운 걸 생각나는 대로 적어 두면, 운동 기록에도 테니스로 함께 남아요."
              : "레슨에서 배운 걸 생각나는 대로 적고, 정리된 팁을 주제별로 모아 봐요."}
          </>
        ),
      }}
      guide={GUIDE}
    >
      {roomUnmoved !== null && roomUnmoved > 0 ? (
        <StSeedBand>
          <span>
            운동방에 적어 둔 일지 <b>{roomUnmoved}개</b>가 있어요. 내 계정으로 옮기면 여기서 이어서 볼 수 있어요.
          </span>
          <Button color="primary" variant="fill" size="small" onClick={importRoom} disabled={busy}>
            내 계정으로 옮기기
          </Button>
        </StSeedBand>
      ) : null}

      {seeds.length > 0 ? (
        <StSeedBand>
          <span>
            미리 적어 둔 일지 <b>{seeds.map((s) => lessonDateLabel(s.date)).join(", ")}</b>가 있어요.
          </span>
          <Button color="primary" variant="fill" size="small" onClick={importSeeds} disabled={busy}>
            내 일지로 옮기기
          </Button>
        </StSeedBand>
      ) : null}

      <StPageTabs role="tablist" aria-label="레슨 일지 화면">
        <StPageTab type="button" role="tab" aria-selected={tab === "write"} $active={tab === "write"} onClick={() => setTab("write")}>
          쓰기
        </StPageTab>
        <StPageTab type="button" role="tab" aria-selected={tab === "list"} $active={tab === "list"} onClick={() => setTab("list")}>
          일지
          {lessons.length > 0 ? <StTabCount>{lessons.length}</StTabCount> : null}
        </StPageTab>
        <StPageTab type="button" role="tab" aria-selected={tab === "tips"} $active={tab === "tips"} onClick={() => setTab("tips")}>
          팁 모아보기
        </StPageTab>
      </StPageTabs>

      {tab === "write" ? (
        <LessonForm
          form={form}
          lessons={lessons}
          busy={busy}
          error={error}
          onChange={patchForm}
          onSubmit={submit}
          onCancel={resetForm}
          workoutLinked={Boolean(roomId)}
          footnote={
            roomId ? null : (
              <>
                운동방을 계정에 이어 두면 저장할 때 <b>운동 기록</b>에도 테니스가 함께 들어가요.{" "}
                <StHintLink href="/workout">운동 기록 열기</StHintLink>
              </>
            )
          }
        />
      ) : (
        <>
          {error ? <StError>{error}</StError> : null}
          {tab === "list" ? (
            <LessonList loading={loading} lessons={lessons} busy={busy} onEdit={startEdit} onRemove={remove} />
          ) : (
            <TipBoard loading={loading} lessons={tipLessons} pendingCount={pendingCount} />
          )}
        </>
      )}
    </ServiceLayout>
  );
}
