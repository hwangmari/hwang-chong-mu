import AdBanner from "../common/AdBanner";

export default function FooterTips() {
  return (
    <div className="mt-8 w-full max-w-md ">
      {/* 2. 브랜드 스토리 (무한 루프의 고통 강조!) */}
      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200">
        <h4 className="font-bold text-gray-800 mb-2 text-sm flex items-center gap-1">
          🤔 왜 만들었냐구요?
        </h4>
        <div className="text-xs text-gray-600 leading-relaxed space-y-2">
          <p>
            <b>&quot;이 날 어때?&quot;</b> 하면 철수가 안 되고,
            <br />
            <b>&quot;그럼 이 날은?&quot;</b> 하면 영희가 안 되고...🤦‍♂️
            <br />이 무한 루프가 답답해서 직접 만들었어요!
          </p>
          <div className="bg-white p-2 rounded-lg border border-slate-100 mt-2">
            <p className="font-bold text-slate-700 mb-1">💡 황총무의 솔루션</p>
            <p>
              다들 바빠서 &apos;되는 날&apos; 찾기가 너무 힘들죠?
              <br />
              <b>역발상이 필요합니다!</b>
              <br />
              <b>
                &quot;다들 들어와서{" "}
                <span className="text-red-500 underline">안 되는 날(❌)</span>만
                찍어줘! 남는 날이 우리가 만날 날이야!&quot;
              </b>
            </p>
          </div>
        </div>
      </div>

      {/* 3. 실전 꿀팁 */}
      <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mt-4 mb-10">
        <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center gap-1">
          🍯 약속 잡기 꿀팁
        </h4>

        <ul className="space-y-3">
          <li className="flex gap-2 items-start">
            <div className="text-xs text-gray-700">
              <b>이럴 때 유용해요!</b>
              <br />
              <span className="text-gray-500">
                &quot;이번 달 안에 법카 써야 해! 💳&quot;
                <br />
                기간 내 데드라인이 있는 약속 잡기 딱 좋아요.
              </span>
            </div>
          </li>
          <li className="flex gap-2 items-start">
            <div className="text-xs text-gray-700">
              <b>전원 참석이 힘든가요?</b>
              <br />
              <span className="text-gray-500">
                &apos;불참자 최소&apos; 날짜를 골라보세요. 완벽한 날보단
                함께하는 날이 중요하니까요!
              </span>
            </div>
          </li>
        </ul>
      </div>
      <AdBanner />
    </div>
  );
}
