import { ImageResponse } from "next/og";
import { OgTemplate, type OgTone } from "@/components/common/OgTemplate";
import { FRAGMENT_TEXT, fragmentFor } from "@/components/common/OgFragments";
import { byId, type ServiceId } from "@/lib/services";
import { loadOgFonts } from "@/lib/og-font";

// 링크 미리보기 이미지를 만드는 공통 입구.
//
// 화면(app/<서비스>/opengraph-image.tsx)마다 똑같은 코드를 적지 않으려고
// 여기 한 번만 적어 두고, 각 화면은 서비스 이름만 넘긴다.
//
// 이름·설명·아이콘은 lib/services.ts(서비스 단일 출처)에서 읽어 오므로
// 거기서 이름을 고치면 미리보기 이미지도 같이 바뀐다.

/** 링크 미리보기의 표준 크기. 카카오톡·슬랙·트위터가 모두 이 비율로 자른다. */
export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

const SITE = "hwang-lab.kr";

/** 서비스별 색. 도구의 성격에 맞춰 골랐다. */
const TONE_BY_SERVICE: Record<ServiceId, OgTone> = {
  meeting: "indigo",
  calc: "green",
  travel: "lab",
  place: "rose",
  game: "violet",
  tennis: "lime",
  overtime: "slate",
  schedule: "blue",
  "account-book": "amber",
  "gift-log": "plum",
  habit: "orange",
  daily: "teal",
  diet: "cyan",
  workout: "red",
  inbody: "teal",
};

/**
 * 서비스 하나의 링크 미리보기 이미지를 만든다.
 * @param id lib/services.ts 의 서비스 아이디
 * @param titleOverride 방 이름처럼 그 화면에서만 쓰는 제목 (없으면 서비스 이름)
 */
export async function serviceOgImage(id: ServiceId, titleOverride?: string) {
  const service = byId(id);
  const tone = TONE_BY_SERVICE[id];
  const title = titleOverride?.trim() || service.name;
  const subtitle = service.desc;
  const url = `${SITE}${service.href}`;

  const fonts = await loadOgFonts(
    `황총무의 실험실${title}${subtitle}${url}${FRAGMENT_TEXT[id] ?? ""}`,
  );

  return new ImageResponse(
    (
      <OgTemplate
        title={title}
        subtitle={subtitle}
        emoji={service.icon}
        tone={tone}
        url={url}
        fragment={fragmentFor(id, tone)}
      />
    ),
    { ...OG_SIZE, fonts },
  );
}
