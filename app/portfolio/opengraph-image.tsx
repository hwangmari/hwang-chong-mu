import { OgTemplate, TONES } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { loadOgFonts } from "@/lib/og-font";
import { careerYears, companyCount, keyProjectCount } from "./careerFacts";

// 포트폴리오를 공유했을 때 뜨는 미리보기 이미지.
// 숫자는 careerFacts.ts 가 data/experiences.tsx 에서 계산해 온 값이라
// 경력이 늘면 이미지도 저절로 같이 바뀐다. (사진은 넣지 않는다)

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "황혜경 — 프론트엔드 개발자 포트폴리오";

export default async function Image() {
  const c = TONES.slate;

  const title = "황혜경";
  const brand = "황총무의 실험실";
  const subtitle = `프론트엔드 개발자 · ${careerYears}년차`;
  const url = "hwang-lab.kr/portfolio";

  const facts: [string, string][] = [
    ["경력", `${careerYears}년`],
    ["회사", `${companyCount}곳`],
    ["주요 프로젝트", `${keyProjectCount}개`],
  ];

  const fonts = await loadOgFonts(
    `${title}${brand}${subtitle}${url}${facts.flat().join("")}Frontend Developer`,
  );

  return new ImageResponse(
    (
      <OgTemplate
        title={title}
        brand={brand}
        subtitle={subtitle}
        emoji="👩‍💻"
        tone="slate"
        url={url}
        fragment={
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                padding: "10px 20px",
                borderRadius: 999,
                background: "#FFFFFF",
                color: c.tileDeep,
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              Frontend Developer
            </div>
            <div style={{ display: "flex", marginTop: 14 }}>
              {facts.map(([label, value], index) => (
                <div
                  key={label}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginLeft: index === 0 ? 0 : 22,
                  }}
                >
                  <div style={{ fontSize: 30, fontWeight: 800, color: "#FFFFFF" }}>
                    {value}
                  </div>
                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 22,
                      fontWeight: 400,
                      color: "rgba(255,255,255,0.72)",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      />
    ),
    { ...OG_SIZE, fonts },
  );
}
