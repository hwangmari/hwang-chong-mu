"use client";

import { useState } from "react";
import Link from "next/link";
import { useMarkChromeHidden } from "@/components/common/useChromeHidden";
import ServiceLayout from "@/components/common/ServiceLayout";
import OfficeView from "./OfficeView";
import { STATIONS, ZONES } from "./stations";
import { StDirCard, StDirGrid, StDirItem, StDirectory } from "./page.styles";

// 안내도: 구역 4개 — 벽에 걸린 블로그·포트폴리오는 마지막 구역 카드 끝에
const DIRECTORY = ZONES.map((z, i) => ({
  title: `${z.emoji} ${z.title}`,
  items: STATIONS.filter(
    (s) => s.zone === z.id || (i === ZONES.length - 1 && s.zone === "extra"),
  ),
}));

export default function OfficePage() {
  // 전체 화면 모드: 헤더·푸터·소개·안내도를 모두 빼고 사무실만 (사무실은 같은 자리에 그대로 두어 걷던 곳이 이어진다)
  const [full, setFull] = useState(false);
  useMarkChromeHidden(full);

  return (
    <ServiceLayout
      width="wide"
      intro={
        full
          ? undefined
          : {
              icon: "🏢",
              title: "황총무 오피스",
              description:
                "사무실을 걸어 다니며 가구를 눌러 보세요. 가구마다 황총무의 실험실 도구가 하나씩 들어 있어요.",
            }
      }
    >
      <OfficeView full={full} onFullChange={setFull} />

      {!full && (
        <StDirectory aria-labelledby="office-directory">
          <h2 id="office-directory">사무실 안내도</h2>
          <StDirGrid>
            {DIRECTORY.map((g) => (
              <StDirCard key={g.title}>
                <h3>{g.title}</h3>
                <ul>
                  {g.items.map((s) => (
                    <StDirItem key={s.key}>
                      <span aria-hidden="true">{s.icon}</span>
                      <Link href={s.href}>{s.name}</Link>
                      <small>{s.desc}</small>
                    </StDirItem>
                  ))}
                </ul>
              </StDirCard>
            ))}
          </StDirGrid>
        </StDirectory>
      )}
    </ServiceLayout>
  );
}
