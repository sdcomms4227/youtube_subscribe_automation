import express from 'express';
import { google } from 'googleapis';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import dotenv from 'dotenv';

// 환경 변수 로드
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const youtube = google.youtube('v3');
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.force-ssl',
  'https://www.googleapis.com/auth/youtube'
];

// OAuth2 클라이언트 설정
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// 세션 설정
app.use(session({
  secret: process.env.SESSION_SECRET || 'youtube-subscribe-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24시간
  },
  proxy: process.env.NODE_ENV === 'production' // Vercel은 프록시 환경
}));

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1); // Vercel에서 필요

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// 인증 미들웨어
function checkAuth(req, res, next) {
  if (!req.session.tokens) {
    return res.redirect('/auth');
  }
  next();
}

async function getAuthenticatedClient(tokens) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  
  auth.setCredentials(tokens);
  return auth;
}

async function getChannelId(input, auth) {
  try {
    google.options({ auth });

    try {
      const url = new URL(input);
      if (url.hostname.includes('youtube.com')) {
        if (url.pathname.startsWith('/channel/')) {
          return url.pathname.split('/')[2];
        } else if (url.pathname.startsWith('/@')) {
          const username = url.pathname.split('/')[1].substring(1);
          const response = await youtube.search.list({
            part: ['snippet'],
            q: username,
            type: ['channel'],
            maxResults: 1,
          });
          if (!response.data.items || response.data.items.length === 0) {
            throw new Error('채널을 찾을 수 없습니다.');
          }
          return response.data.items[0].snippet.channelId;
        } else if (url.pathname.startsWith('/c/') || url.pathname.startsWith('/user/')) {
          const customUrl = url.pathname.split('/')[2];
          const response = await youtube.search.list({
            part: ['snippet'],
            q: customUrl,
            type: ['channel'],
            maxResults: 1,
          });
          if (!response.data.items || response.data.items.length === 0) {
            throw new Error('채널을 찾을 수 없습니다.');
          }
          return response.data.items[0].snippet.channelId;
        }
      }
    } catch (e) {
      const response = await youtube.search.list({
        part: ['snippet'],
        q: input,
        type: ['channel'],
        maxResults: 1,
      });
      if (!response.data.items || response.data.items.length === 0) {
        throw new Error('채널을 찾을 수 없습니다.');
      }
      return response.data.items[0].snippet.channelId;
    }
  } catch (error) {
    console.error('채널 ID 검색 에러:', error);
    throw error;
  }
}

async function subscribeToChannel(channelId, auth) {
  try {
    google.options({ auth });

    const channelResponse = await youtube.channels.list({
      part: ['snippet'],
      id: [channelId],
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      throw new Error('해당 채널이 존재하지 않습니다.');
    }

    const response = await youtube.subscriptions.insert({
      part: ['snippet'],
      requestBody: {
        snippet: {
          resourceId: {
            kind: 'youtube#channel',
            channelId: channelId,
          },
        },
      },
    });

    return {
      success: true,
      channelTitle: channelResponse.data.items[0].snippet.title
    };
  } catch (error) {
    console.error('구독 에러:', error);
    throw error;
  }
}

// 라우트 설정
app.get('/', (req, res) => {
  res.render('index', { 
    message: null, 
    error: null,
    isAuthenticated: !!req.session.tokens
  });
});

// 인증 라우트
app.get('/auth', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    include_granted_scopes: true,
    prompt: 'consent'
  });
  console.log('Auth URL:', authUrl);
  res.redirect(authUrl);
});

// OAuth2 콜백 라우트
app.get('/auth/google/callback', async (req, res) => {
  try {
    console.log('Callback received:', req.query); // 디버깅을 위한 로그
    const { code } = req.query;
    if (!code) {
      throw new Error('인증 코드가 없습니다.');
    }
    const { tokens } = await oauth2Client.getToken(code);
    console.log('Tokens received:', { 
      access_token: tokens.access_token ? 'exists' : 'missing',
      refresh_token: tokens.refresh_token ? 'exists' : 'missing',
      expiry_date: tokens.expiry_date
    }); // 디버깅을 위한 로그
    req.session.tokens = tokens;
    res.redirect('/');
  } catch (error) {
    console.error('OAuth2 콜백 에러:', error);
    res.render('index', { 
      message: null, 
      error: '인증에 실패했습니다. 다시 시도해주세요. 오류: ' + error.message,
      isAuthenticated: false
    });
  }
});

// 로그아웃 라우트
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.post('/subscribe', checkAuth, async (req, res) => {
  try {
    const { channelInput } = req.body;
    const auth = await getAuthenticatedClient(req.session.tokens);
    const channelId = await getChannelId(channelInput, auth);
    const result = await subscribeToChannel(channelId, auth);
    res.render('index', { 
      message: `성공적으로 ${result.channelTitle} 채널에 구독했습니다!`,
      error: null,
      isAuthenticated: true
    });
  } catch (error) {
    console.error('구독 처리 에러:', error);
    res.render('index', { 
      message: null,
      error: error.message,
      isAuthenticated: true
    });
  }
});

// 개인정보처리방침 라우트
app.get('/privacy', (req, res) => {
  res.render('privacy');
});

// 서비스 약관 라우트
app.get('/terms', (req, res) => {
  res.render('terms');
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
}); 