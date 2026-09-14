import { OgTemplate, TONES } from "@/components/common/OgTemplate";
import { ImageResponse } from "next/og";
import { SERVICES } from "@/lib/services";
import { OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { loadOgFonts } from "@/lib/og-font";

// 사이트 대문(hwang-lab.kr)을 공유했을 때 뜨는 미리보기 이미지.
// 서비스 하나가 아니라 "도구 상자"라는 걸 보여줘야 해서, 오른쪽 타일 대신
// 대표 도구 6개의 아이콘을 늘어놓는다.

export const runtime = "edge";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "황총무의 실험실 — 약속 잡기부터 정산·기록까지";

/** 대표로 보여줄 도구 6개 (이름은 lib/services.ts 에서 가져온다) */
const SHOWCASE = ["meeting", "calc", "place", "overtime", "account-book", "habit"];

export default async function Image() {
  const c = TONES.lab;
  const icons = SHOWCASE.map(
    (id) => SERVICES.find((service) => service.id === id)?.icon ?? "🐾",
  );

  const title = "황총무의 실험실";
  const brand = "복잡한 건 제가 할게요, 총총총";
  const subtitle = `약속 잡기부터 정산·기록까지, 도구 ${SERVICES.length}개`;
  const url = "hwang-lab.kr";

  const fonts = await loadOgFonts(`${title}${brand}${subtitle}${url}`);

  const tile = (icon: string, marginLeft: number) => (
    <div
      key={icon}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 116,
        height: 116,
        marginLeft,
        borderRadius: 32,
        background: "#FFFFFF",
        borderWidth: 2,
        borderStyle: "solid",
        borderColor: "#E7E3D8",
        fontSize: 62,
      }}
    >
      {icon}
    </div>
  );

  return new ImageResponse(
    (
      <OgTemplate
        title={title}
        brand={brand}
        subtitle={subtitle}
        emoji="🐰"
        tone="lab"
        url={url}
        right={
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
            }}
          >
            <div style={{ display: "flex" }}>
              {tile(icons[0], 0)}
              {tile(icons[1], 18)}
              {tile(icons[2], 18)}
            </div>
            <div style={{ display: "flex", marginTop: 18 }}>
              {tile(icons[3], 0)}
              {tile(icons[4], 18)}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 116,
                  height: 116,
                  marginLeft: 18,
                  borderRadius: 32,
                  backgroundImage: `linear-gradient(145deg, ${c.tile} 0%, ${c.tileDeep} 100%)`,
                  fontSize: 62,
                }}
              >
                🐰
              </div>
            </div>
          </div>
        }
      />
    ),
    { ...OG_SIZE, fonts },
  );
}
