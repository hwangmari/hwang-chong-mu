import { Fragment } from "react";

// 안내문을 마침표(. 또는 。) 뒤에서 줄바꿈해 보여 준다. 소수점(4.5)이나 "R10." 같은 건 뒤에 공백이 있을 때만 끊는다.
// 예) "…우선 배정. 16:00 종료 후 저녁 식사. 혼성 A팀(7) = …" → 세 줄 (2026-09-15)
export function splitNoteLines(text: string): string[] {
  return text
    .split(/(?<=[.。])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function NoteLines({ text }: { text: string }) {
  const lines = splitNoteLines(text);
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}
