import express from 'express';
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const youtube = google.youtube('v3');
const SCOPES = ['https://www.googleapis.com/auth/youtube.force-ssl'];
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

// 세션 설정
app.use(session({
  secret: 'youtube-subscribe-secret',
  resave: false,
  saveUninitialized: true
}));

// EJS 템플릿 엔진 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 정적 파일 제공
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function getChannelId(input) {
  try {
    const auth = await authorize();
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
    throw error;
  }
}

async function subscribeToChannel(channelId) {
  try {
    const auth = await authorize();
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
    throw error;
  }
}

// 라우트 설정
app.get('/', (req, res) => {
  res.render('index', { message: null, error: null });
});

app.post('/subscribe', async (req, res) => {
  try {
    const { channelInput } = req.body;
    const channelId = await getChannelId(channelInput);
    const result = await subscribeToChannel(channelId);
    res.render('index', { 
      message: `성공적으로 ${result.channelTitle} 채널에 구독했습니다!`,
      error: null
    });
  } catch (error) {
    res.render('index', { 
      message: null,
      error: error.message
    });
  }
});

// 서버 시작
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
}); 