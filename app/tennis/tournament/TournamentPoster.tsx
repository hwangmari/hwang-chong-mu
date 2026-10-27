"use client";

import styled from "styled-components";

/**
 * 밴드 공지용 포스터 (주인 요청 2026-10-06).
 *
 * 2025년 포스터 구도를 그대로 따르되, 색만 2026년 코트(아식스 테니스 아카데미)에 맞춰
 * 안쪽 보라 · 바깥 파랑으로 바꿨다. 그림 파일이 아니라 SVG라 화면 폭에 맞춰 늘어나고,
 * 날짜·장소는 대회 데이터에서 그대로 받아 쓴다(한 곳만 고치면 포스터도 같이 바뀐다).
 */
type Props = {
  /** 왼쪽 위 작은 연도 */
  year: string;
  /** 사선으로 크게 들어가는 영문 이름 */
  headline: string;
  /** 공 옆 클럽 이름 */
  club: string;
  /** 왼쪽 아래 날짜·시간 */
  when: string;
  /** 오른쪽 아래 장소 */
  where: string;
};

const W = 860;
const H = 1100;

export default function TournamentPoster({
  year,
  headline,
  club,
  when,
  where,
}: Props) {
  // 장소 글자가 길어도 오른쪽 끝(805)을 넘지 않게 시작 x를 뒤에서 계산한다.
  // 한글 한 글자는 글자 크기(23px)와 거의 같은 폭을 차지한다.
  const whereWidth = [...where].reduce(
    (w, ch) => w + (/[\x20-\x7e]/.test(ch) ? 12 : 23),
    0,
  );
  const whereX = Math.max(440, 805 - whereWidth - 36);

  return (
    <StPoster
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${year} ${headline} 포스터`}
    >
      <rect className="bg" width={W} height={H} />
      {/* 왼쪽 위 밝은 구역 — 2025 원본에서 잰 사선 y = 468 - 0.555x 위쪽 */}
      <polygon className="corner" points="0,0 846,0 0,468" />

      <line
        className="line"
        x1="-20"
        y1="479"
        x2="880"
        y2="-21"
        strokeWidth="16"
      />
      <line
        className="line"
        x1="118"
        y1="-12"
        x2="-4"
        y2="414"
        strokeWidth="9"
      />
      <line
        className="line"
        x1="-20"
        y1="809"
        x2="880"
        y2="330"
        strokeWidth="16"
      />
      <line
        className="line"
        x1="658"
        y1="450"
        x2="872"
        y2="777"
        strokeWidth="15"
      />

      <text
        className="title small"
        x="182"
        y="352"
        fontSize="72"
        transform="rotate(-29 182 352)"
      >
        {year}
      </text>
      <text
        className="title big"
        x="128"
        y="622"
        fontSize="196"
        textLength="684"
        lengthAdjust="spacingAndGlyphs"
        transform="rotate(-29 128 622)"
      >
        {headline}
      </text>

      <g transform="translate(300 900)">
        <circle cx="31" cy="-16" r="31" fill="#ffe24a" />
        <path
          d="M14 -42 Q -6 -16 14 10"
          stroke="#fff"
          strokeWidth="3.4"
          fill="none"
        />
        <path
          d="M48 -42 Q 68 -16 48 10"
          stroke="#fff"
          strokeWidth="3.4"
          fill="none"
        />
        <text className="title" x="78" y="2" fontSize="52">
          {club}
        </text>
      </g>

      <g transform="translate(55 1002)">
        <circle className="mark" cx="13" cy="-8" r="11" />
        <path className="mark" d="M13 -14v6l4 2.5" strokeLinecap="round" />
        <text className="meta" x="38" y="0">
          {when}
        </text>
      </g>
      <g transform={`translate(${whereX} 1002)`}>
        <path
          className="mark"
          d="M13 3s8.5-7.4 8.5-13.4a8.5 8.5 0 1 0-17 0C4.5 -4.4 13 3 13 3z"
        />
        <circle cx="13" cy="-11" r="3.2" fill="#cfe0ea" />
        <text className="meta" x="36" y="0">
          {where}
        </text>
      </g>
    </StPoster>
  );
}

const StPoster = styled.svg`
  display: block;
  width: 100%;
  height: auto;
  border-radius: 1rem;

  .bg {
    fill: #5b4f85;
  }
  .corner {
    fill: #5287a3;
  }
  .line {
    stroke: #fff;
    stroke-linecap: butt;
  }
  .mark {
    stroke: #cfe0ea;
    stroke-width: 1.6;
    fill: none;
  }
  .title {
    fill: #fff;
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 500;
  }
  .small {
    filter: drop-shadow(3px 4px 5px rgba(0, 0, 0, 0.2));
  }
  .big {
    filter: drop-shadow(5px 7px 9px rgba(0, 0, 0, 0.24));
  }
  .meta {
    fill: #fff;
    font-size: 23px;
    font-weight: 400;
  }
`;
