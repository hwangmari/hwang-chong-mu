"use client";

import Link from "next/link";
import { experiences } from "@/app/data/experiences"; // 데이터 import

export default function ResumeSection() {
  return (
    <section className="max-w-4xl mx-auto px-6 py-16 animate-fade-in-up delay-100">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-12">
        {/* [왼쪽] Skills (기존과 동일) */}
        <div className="space-y-10">
          <div>
            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
              🛠 Skills
            </h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-sm">
                  Framework & Lib
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["React", "Svelte", "Angular", "Next.js", "TypeScript"].map(
                    (skill) => (
                      <span
                        key={skill}
                        className="px-3 py-1 bg-gray-900 text-white text-xs rounded-lg font-bold"
                      >
                        {skill}
                      </span>
                    )
                  )}
                </div>
              </div>
              {/* ... (나머지 스킬 섹션은 그대로 유지) ... */}
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-sm">
                  Styling & UI
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    "SCSS",
                    "AdorableCSS",
                    "Tailwind CSS",
                    "Cross Browsing",
                    "Responsive Web",
                  ].map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2 text-sm">
                  Collaboration
                </h4>
                <div className="flex flex-wrap gap-2">
                  {["Git", "Jira", "Wiki", "Agile"].map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Education */}
          <div>
            <h3 className="text-2xl font-bold mb-2 flex items-center gap-2">
              🎓 Education
            </h3>
            <div>
              <h4 className="font-bold text-gray-900 text-sm">
                강원대학교 (춘천)
              </h4>
              <p className="text-gray-500 text-xs">미술학과 서양화 전공</p>
              <p className="text-gray-400 text-xs mt-1">2006 - 2010</p>
            </div>
          </div>
        </div>

        {/* [오른쪽] Work Experience (데이터 연동) */}
        <div>
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
            💼 Experience
          </h3>

          <div className="space-y-12 border-l-2 border-gray-100 ml-3 pl-8 relative">
            {/* 데이터 매핑 */}
            {experiences.map((exp) => (
              <div key={exp.id} className="relative group">
                <span
                  className={`absolute -left-[41px] top-1 w-5 h-5 rounded-full ${exp.color} border-4 border-white shadow-sm`}
                ></span>

                {/* 🔗 링크 연결: 클릭 시 상세 페이지로 이동 */}
                <Link
                  href={`/portfolio/experience/${exp.id}`}
                  className="block group-hover:opacity-80 transition-opacity"
                >
                  <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    {exp.company}
                    <span className="text-xs text-gray-400 font-normal border border-gray-200 px-2 py-0.5 rounded-full group-hover:bg-gray-100 transition">
                      상세보기 ↗
                    </span>
                  </h4>
                  <p className="text-gray-700 font-bold text-sm mb-1">
                    {exp.role}
                  </p>
                  <p className="text-gray-400 text-xs mb-4">{exp.period}</p>
                </Link>

                <ul className="list-disc list-outside text-gray-600 text-sm space-y-2 ml-4 leading-relaxed">
                  {exp.summary.map((line, idx) => (
                    <li key={idx}>{line}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
