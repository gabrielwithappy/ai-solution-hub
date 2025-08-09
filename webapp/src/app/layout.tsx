import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Solution Hub",
  description: "AI 기반 콘텐츠 생성 허브",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="color-scheme" content="light" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      </head>
      <body className="bg-white text-gray-900 min-h-screen">
        <header className="bg-white shadow p-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-700 hover:text-blue-800 transition-colors">
            AI Solution Hub
          </Link>
          <nav className="flex gap-4">
            <Link href="/english-sentence" className="hover:underline">영어 문장 생성</Link>
            <Link href="/english-story" className="hover:underline">영어 스토리 생성</Link>
            <Link href="/celebration-message" className="hover:underline">축하 문구 생성</Link>
          </nav>
        </header>
        <div className="bg-gray-50 min-h-[calc(100vh-80px)]">
          {children}
        </div>
      </body>
    </html>
  );
}
