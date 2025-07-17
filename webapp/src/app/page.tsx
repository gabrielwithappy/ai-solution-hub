export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center h-[60vh] text-center">
      <section>
        <h2 className="text-2xl font-bold mb-4">AI 기반 콘텐츠 생성 허브</h2>
        <p className="mb-2">원하는 기능을 상단 메뉴에서 선택하세요.</p>
        <ul className="text-gray-700 text-left mt-4">
          <li>• 영어 문장 예시 생성</li>
          <li>• 상황별 축하문구 생성</li>
        </ul>
      </section>
    </main>
  );
}
