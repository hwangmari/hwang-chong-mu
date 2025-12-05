interface Props {
  title: string;
}

export default function RoomHeader({ title }: Props) {
  return (
    <div className="text-center mb-6 mt-4">
      <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 flex items-center justify-center gap-2">
        🐰 황총무의 약속 잡기
      </h1>
      <div className="mt-3 bg-white px-4 py-2 rounded-full shadow-sm inline-block border border-gray-200">
        {title}
      </div>
    </div>
  );
}
