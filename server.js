import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// API 라우트
import dailyRouter from './routes/daily.js';
import eveningRouter from './routes/evening.js';
import pomodoroRouter from './routes/pomodoro.js';
import dashboardRouter from './routes/dashboard.js';

app.use('/api/daily', dailyRouter);
app.use('/api/evening', eveningRouter);
app.use('/api/pomodoro', pomodoroRouter);
app.use('/api/dashboard', dashboardRouter);

// 프로덕션 모드: React 빌드 파일 서빙
if (NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // SPA 라우팅: 모든 경로를 index.html로 리다이렉트
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // 개발 모드: 기존 public 폴더 서빙 (Vite가 별도로 실행됨)
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  if (NODE_ENV === 'development') {
    console.log(`📱 React 개발 서버는 http://localhost:5173 에서 실행됩니다.`);
  }
});
