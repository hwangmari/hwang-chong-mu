import Link from "next/link";

export default function PortfolioInfo() {
  return (
    <>
      <header className="max-w-4xl mx-auto px-6 py-20 animate-fade-in-up">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <span className="inline-block bg-gray-900 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
              Frontend Developer
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              사용자의 불편함을 <br className="hidden md:block" />
              <span className="text-blue-600">기술로 해결하는</span>{" "}
              황혜경입니다.
            </h1>
            <p className="text-gray-500 text-lg max-w-xl leading-relaxed">
              복잡한 문제를 단순하게 정의하고, <br />
              주도적으로 서비스를 만들어가는 것을 좋아합니다.
              <br />
              운동과 기록을 즐기며, 끊임없이 성장하는 개발자입니다.
            </p>
          </div>
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 rounded-full flex items-center justify-center text-4xl border border-gray-200 shadow-inner flex-shrink-0">
            👩‍💻
          </div>
        </div>

        {/* 연락처 및 링크 */}
        <div className="flex gap-4 text-sm font-bold text-gray-600">
          <Link
            href="https://github.com/hwangmari/"
            target="_blank"
            className="hover:text-black hover:underline underline-offset-4 transition"
          >
            GitHub ↗
          </Link>
          <Link
            href="https://blog.naver.com/hwangmari"
            target="_blank"
            className="hover:text-black hover:underline underline-offset-4 transition"
          >
            Blog ↗
          </Link>
          <span className="text-gray-300">|</span>
          <a
            href="mailto:hwangmari@naver.com"
            className="hover:text-black hover:underline underline-offset-4 transition"
          >
            Email
          </a>
        </div>
      </header>
    </>
  );
}
