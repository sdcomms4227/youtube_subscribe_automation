# YouTube 구독 자동화 웹 애플리케이션

YouTube 채널 구독을 자동화하는 웹 애플리케이션입니다. Google OAuth2를 사용하여 사용자 인증을 처리하고, YouTube Data API를 통해 채널 구독을 관리합니다.

## 주요 기능

- 웹 기반 인터페이스로 쉽게 사용 가능
- Google OAuth2를 통한 안전한 인증
- 채널 URL을 통한 구독 관리
- 구독 상태 실시간 확인

## 설치 방법

1. 저장소 클론:
```bash
git clone [저장소 URL]
cd youtube_subscribe_automation
```

2. 의존성 설치:
```bash
npm install
```

3. Google Cloud Console 설정:
   - [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
   - YouTube Data API v3 활성화
   - OAuth 2.0 클라이언트 ID 생성
   - `credentials.json` 파일을 프로젝트 루트 디렉토리에 저장

## 사용 방법

1. 애플리케이션 실행:
```bash
npm start
```

2. 웹 브라우저에서 `http://localhost:3000` 접속

3. Google 계정으로 로그인

4. 구독하고 싶은 채널의 URL을 입력하고 구독 버튼 클릭

## 프로젝트 구조

```
youtube_subscribe_automation/
├── src/
│   ├── index.js          # 메인 애플리케이션 파일
│   └── views/
│       └── index.ejs     # 메인 웹 페이지 템플릿
├── credentials.json      # Google OAuth 인증 정보
├── token.json           # OAuth 토큰 저장
├── package.json         # 프로젝트 의존성 및 스크립트
└── README.md           # 프로젝트 설명
```

## 보안 주의사항

- `credentials.json`과 `token.json` 파일은 절대 공개 저장소에 커밋하지 마세요
- `.gitignore` 파일에 인증 관련 파일들이 포함되어 있습니다
- OAuth 토큰은 주기적으로 갱신되어야 합니다

## 기술 스택

- Node.js
- Express.js
- EJS (템플릿 엔진)
- Google OAuth2
- YouTube Data API v3

## 라이선스

MIT License 