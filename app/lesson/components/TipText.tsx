import { Fragment } from "react";

/** 팁 한 줄의 **강조** 표시만 굵은 글자로 바꾼다 (다른 마크다운은 쓰지 않는다) */
export default function TipText({ text }: { text: string }) {
  const pieces = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {pieces.map((piece, i) =>
        i % 2 === 1 ? <b key={i}>{piece}</b> : <Fragment key={i}>{piece}</Fragment>,
      )}
    </>
  );
}
