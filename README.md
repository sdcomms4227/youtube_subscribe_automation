# YouTube 구독 자동화

YouTube 채널을 쉽게 구독할 수 있는 웹 애플리케이션입니다. Google OAuth2.0을 사용하여 사용자 인증을 처리하고, YouTube Data API v3를 통해 채널 구독 기능을 제공합니다.

## 주요 기능

- Google 계정을 통한 OAuth 2.0 인증
- YouTube 채널 URL 또는 이름으로 채널 검색
- 원클릭으로 채널 구독
- 세션 기반 사용자 인증 관리

## 기술 스택

- Node.js
- Express.js
- EJS 템플릿 엔진
- Google OAuth 2.0
- YouTube Data API v3
- Vercel (배포)

## 설치 방법

1. 저장소 클론:
```bash
git clone https://github.com/sdcomms4227/youtube_subscribe_automation.git
cd youtube_subscribe_automation
```

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
`.env` 파일을 생성하고 다음 변수들을 설정:
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
REDIRECT_URI=http://localhost:3000/auth/google/callback
SESSION_SECRET=your_session_secret
NODE_ENV=development
```

## Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성

2. OAuth 동의 화면 설정:
   - API 및 서비스 > OAuth 동의 화면
   - 앱 이름, 사용자 지원 이메일 등 기본 정보 입력
   - 개인정보처리방침 및 서비스 약관 URL 추가

3. 사용자 인증 정보 설정:
   - API 및 서비스 > 사용자 인증 정보
   - OAuth 2.0 클라이언트 ID 생성
   - 승인된 리디렉션 URI 설정

4. API 활성화:
   - YouTube Data API v3 활성화

## 로컬 개발 환경 실행

```bash
npm start
```
서버가 http://localhost:3000 에서 실행됩니다.

## Vercel 배포

1. Vercel CLI 설치:
```bash
npm install -g vercel
```

2. 배포:
```bash
vercel
```

3. 프로덕션 배포:
```bash
vercel --prod
```

## 환경 변수 설정 (Vercel)

Vercel 대시보드에서 다음 환경 변수들을 설정:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `REDIRECT_URI`
- `SESSION_SECRET`
- `NODE_ENV=production`

## API 엔드포인트

- `GET /`: 메인 페이지
- `GET /auth`: Google OAuth 인증 시작
- `GET /auth/google/callback`: OAuth 콜백 처리
- `POST /subscribe`: 채널 구독 처리
- `GET /privacy`: 개인정보처리방침
- `GET /terms`: 서비스 약관

## 보안 및 개인정보

- 사용자 데이터는 세션에만 저장되며 24시간 후 자동 삭제
- HTTPS를 통한 안전한 데이터 전송
- 필요한 최소한의 권한만 요청

## 라이선스

MIT License

## 문의

- 이메일: sdcomms4227@gmail.com
- 웹사이트: https://youtube-subscribe-automation.vercel.app 