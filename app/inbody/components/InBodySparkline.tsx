"use client";

type SparklinePoint = {
  date: string;
  value: number;
};

type Props = {
  points: SparklinePoint[]; // oldest → newest
  color: string;
  height?: number;
};

export default function InBodySparkline({ points, color, height = 56 }: Props) {
  const viewW = 240;
  const viewH = height;
  const padX = 4;
  const padY = 6;

  if (points.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
    );
  }

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(0.01, max - min);
  const innerW = viewW - padX * 2;
  const innerH = viewH - padY * 2;

  const xFor = (i: number) =>
    points.length === 1
      ? padX + innerW / 2
      : padX + (i / (points.length - 1)) * innerW;
  const yFor = (v: number) => padY + (1 - (v - min) / range) * innerH;

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(p.value).toFixed(1)}`,
    )
    .join(" ");

  // 영역 채우기
  const areaPath = `${path} L ${xFor(points.length - 1).toFixed(1)} ${(padY + innerH).toFixed(1)} L ${xFor(0).toFixed(1)} ${(padY + innerH).toFixed(1)} Z`;

  const lastIdx = points.length - 1;

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      role="img"
      aria-label="추이"
      style={{ width: "100%", height: "auto", display: "block" }}
    >
      <defs>
        <linearGradient id={`grad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {points.length >= 2 ? (
        <>
          <path d={areaPath} fill={`url(#grad-${color.replace("#", "")})`} />
          <path
            d={path}
            fill="none"
            stroke={color}
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {points.map((p, i) => (
        <circle
          key={`${p.date}-${i}`}
          cx={xFor(i)}
          cy={yFor(p.value)}
          r={i === lastIdx ? 2.6 : 1.6}
          fill={color}
          stroke="#ffffff"
          strokeWidth={1}
        >
          <title>
            {p.date} · {p.value}
          </title>
        </circle>
      ))}
    </svg>
  );
}
