"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ServiceLayout from "@/components/common/ServiceLayout";
import { useModal } from "@/components/common/ModalProvider";
import { LESSON_GUIDE_DATA } from "@/data/footerGuides";
import { TENNIS_LESSONS, type TennisLesson } from "@/data/tennisLessons";
import { formatDurationMin, todayISO } from "@/app/workout/helpers";
import { useWorkoutSession } from "@/app/workout/useWorkoutSession";
import { Button } from "@hwangchongmu/ui";
import {
  StError,
  StPageTab,
  StPageTabs,
  StTabCount,
} from "@/app/gift-log/page.styles";
import {
  deleteLesson,
  fetchLessons,
  findUnlinkedTennisActivity,
  needsTips,
  saveLesson,
  type LessonRecord,
} from "./repository";
import LessonForm, { formMinutes, type LessonFormState } from "./components/LessonForm";
import LessonList, { lessonDateLabel } from "./components/LessonList";
import TipBoard from "./components/TipBoard";
import { StSeedBand } from "./page.styles";

type Tab = "write" | "list" | "tips";

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

export default function LessonPage() {
  const session = useWorkoutSession();
  const { openAlert, openConfirm } = useModal();

  const [tab, setTab] = useState<Tab>("write");
  const [lessons, setLessons] = useState<LessonRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // 손대기 전에는 지난번 구성으로 채운 빈 폼을 보여 주고, 손대는 순간부터 draft 에 담는다
  const [draft, setDraft] = useState<LessonFormState | null>(null);
  const form = draft ?? emptyForm(lessons[0]);

  const roomId = session?.roomId;

  // 불러오기 실패 문구 — 표가 아직 없으면 무엇을 실행해야 하는지 알려 준다
  function loadErrorMessage(e: unknown) {
    return e instanceof Error && /tennis_lessons/.test(e.message)
      ? "레슨 일지 저장 공간이 아직 없어요. supabase/20261016_create_tennis_lessons.sql 을 먼저 실행해 주세요."
      : "일지를 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요.";
  }

  // 저장·삭제 뒤 다시 불러오기. 뼈대로 바꾸지 않고 목록을 그대로 둔 채 바꿔 끼운다
  const load = useCallback(async () => {
    if (!roomId) return;
    try {
      setLessons(await fetchLessons(roomId));
      setError("");
    } catch (e) {
      setError(loadErrorMessage(e));
    }
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    let alive = true;
    fetchLessons(roomId)
      .then((next) => alive && setLessons(next))
      .catch((e) => alive && setError(loadErrorMessage(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [roomId]);

  const lessonDates = useMemo(() => new Set(lessons.map((l) => l.date)), [lessons]);
  const pendingCount = useMemo(() => lessons.filter(needsTips).length, [lessons]);
  const tipLessons = useMemo(() => lessons.filter((l) => l.tips.length > 0), [lessons]);

  // 화면이 생기기 전에 코드에 적어 둔 일지 중 아직 옮기지 않은 것 (같은 날짜 일지가 있으면 옮긴 것으로 본다)
  const seeds = useMemo(
    () => (loading || error ? [] : TENNIS_LESSONS.filter((s) => !lessonDates.has(s.date))),
    [loading, error, lessonDates],
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
    if (!roomId || busy) return;
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
        (lesson.activityId ? "\n운동 기록의 테니스 한 줄도 함께 지워져요." : "") +
        "\n지우면 되돌릴 수 없어요.",
    );
    if (!ok) return;
    setBusy(true);
    try {
      await deleteLesson(lesson);
      if (form.id === lesson.id) resetForm();
      await load();
    } catch (e) {
      await openAlert(e instanceof Error ? e.message : "지우지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function importSeeds() {
    if (!roomId || busy) return;
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

  return (
    <ServiceLayout
      width="wide"
      intro={{
        icon: "🎾",
        title: "테니스 레슨 일지",
        description: "레슨에서 배운 걸 생각나는 대로 적어 두면, 운동 기록에도 테니스로 함께 남아요.",
      }}
      guide={GUIDE}
    >
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
          lessonDates={lessonDates}
          busy={busy}
          error={error}
          onChange={patchForm}
          onSubmit={submit}
          onCancel={resetForm}
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
