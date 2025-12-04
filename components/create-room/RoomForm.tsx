interface RoomFormProps {
  formData: {
    roomName: string;
    startDate: string;
    endDate: string;
    includeWeekend: boolean;
  };
  loading: boolean;
  isCustomPeriod: boolean; // 🔥 추가됨
  setIsCustomPeriod: (v: boolean) => void; // 🔥 추가됨
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
}

export default function RoomForm({
  formData,
  loading,
  isCustomPeriod,
  setIsCustomPeriod,
  onChange,
  onSubmit,
}: RoomFormProps) {
  return (
    <div className="space-y-6">
      {/* 약속 이름 */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-500 ml-1">
          약속 이름
        </label>
        <input
          type="text"
          placeholder="예: 신년회, 회식"
          value={formData.roomName}
          onChange={(e) => onChange("roomName", e.target.value)}
          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
        />
      </div>

      {/* 🔥 날짜 설정 영역 */}
      <div className="space-y-4">
        {/* 시작 날짜 */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-500 ml-1">
            시작 날짜
            {!isCustomPeriod && (
              <span className="text-indigo-500 font-normal ml-1">
                (자동 3주 설정됨)
              </span>
            )}
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => onChange("startDate", e.target.value)}
            className="block w-[240px] h-[50px] px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* 🔥 종료 날짜 직접 지정 토글 */}
        <div className="flex items-center justify-between px-1 py-1">
          <span
            className="text-sm text-gray-600 font-medium cursor-pointer"
            onClick={() => setIsCustomPeriod(!isCustomPeriod)}
          >
            종료 날짜 직접 지정하기
          </span>
          <button
            onClick={() => setIsCustomPeriod(!isCustomPeriod)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isCustomPeriod ? "bg-indigo-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
                isCustomPeriod ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* 🔥 토글이 켜졌을 때만 나타나는 종료 날짜 입력창 */}
        {isCustomPeriod && (
          <div className="space-y-2 animate-fadeIn">
            {" "}
            {/* 부드럽게 나타나는 효과 */}
            <label className="text-xs font-bold text-gray-500 ml-1">
              종료 날짜
            </label>
            <input
              type="date"
              value={formData.endDate}
              min={formData.startDate} // 시작일 이전은 선택 불가하도록 막음
              onChange={(e) => onChange("endDate", e.target.value)}
              className="block w-[240px]  h-[50px]  px-4 py-3 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>
        )}
      </div>

      {/* 주말 포함 토글 (기존 코드 유지) */}
      <div className="flex items-center justify-between px-1">
        <span className="text-sm text-gray-600 font-medium">주말 포함</span>
        <button
          onClick={() => onChange("includeWeekend", !formData.includeWeekend)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            formData.includeWeekend ? "bg-indigo-500" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition duration-200 ease-in-out ${
              formData.includeWeekend ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* 버튼 */}
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 mt-4 shadow-lg"
      >
        {loading ? "생성 중..." : "방 만들기 🐰"}
      </button>
    </div>
  );
}
