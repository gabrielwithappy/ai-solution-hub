import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-start py-8 text-center">
      <section className="max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">AI 기반 콘텐츠 생성 허브</h2>
        <p className="mb-8 text-gray-600">AI를 활용해 다양한 콘텐츠를 쉽고 빠르게 생성하세요.</p>
        
        {/* 기능 카드 */}
        <div className="grid gap-6 md:grid-cols-2">
          <Link href="/english-sentence" 
                className="block p-6 bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow">
            <div className="text-2xl mb-3">📝</div>
            <h3 className="text-lg font-semibold mb-2">영어 문장 생성</h3>
            <p className="text-gray-600 text-sm">
              영어 문장을 입력하면 난이도별로 다양한 예시 문장을 생성합니다.
            </p>
          </Link>

          <div className="p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <div className="text-2xl mb-3">🎉</div>
            <h3 className="text-lg font-semibold mb-2 text-gray-500">축하 문구 생성</h3>
            <p className="text-gray-400 text-sm">
              곧 출시될 예정입니다.
            </p>
          </div>
        </div>

        <div className="mt-8 text-gray-500 text-sm">
          <p>💡 상단 메뉴를 통해서도 기능에 접근할 수 있습니다.</p>
        </div>
      </section>
    </main>
  );
}
