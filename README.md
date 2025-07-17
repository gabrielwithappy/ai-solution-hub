# AI Solution Hub

AI Solution Hub는 LLM을 활용해 영어 문장과 축하 문구를 생성하는 웹 애플리케이션입니다.

## 기능

- **영어 문장 생성**: 주제를 입력하면 관련 영어 문장을 생성합니다.
- **축하 문구 생성**: 축하 상황을 입력하면 적절한 축하 문구를 생성합니다.

## 환경 설정

### 1. 환경 변수 설정

개발 환경에서 실행하기 전에 환경 변수를 설정해야 합니다.

1. `.env.example` 파일을 복사하여 `.env.local` 파일을 생성합니다:

   ```bash
   cp .env.example .env.local
   ```

2. `.env.local` 파일을 편집하여 실제 API 키를 입력합니다:

   ```bash
   # OpenAI API 설정
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_API_URL=https://api.openai.com/v1/chat/completions
   OPENAI_MODEL=gpt-3.5-turbo
   
   # 애플리케이션 설정
   NEXT_PUBLIC_APP_NAME=AI Solution Hub
   NEXT_PUBLIC_APP_VERSION=1.0.0
   
   # API 설정
   API_RATE_LIMIT=10
   API_TIMEOUT=30000
   ```

3. OpenAI API 키 획득:
   - [OpenAI Platform](https://platform.openai.com/)에 가입
   - API 키 생성 및 복사
   - `.env.local` 파일의 `OPENAI_API_KEY`에 입력

### 2. 의존성 설치 및 개발 서버 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Vercel 배포 설정

1. **GitHub 연동**: GitHub 리포지토리를 Vercel에 연결합니다.

2. **환경 변수 설정**: Vercel 대시보드에서 다음 환경 변수들을 설정합니다:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   OPENAI_API_URL=https://api.openai.com/v1/chat/completions
   OPENAI_MODEL=gpt-3.5-turbo
   NODE_ENV=production
   ```

3. **빌드 설정**: 
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **배포**: 설정 완료 후 Deploy 버튼을 클릭하여 배포합니다.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
