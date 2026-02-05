require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 정적 파일 서빙
app.use(express.static(path.join(__dirname, 'public')));

// API 라우트
app.use('/api/daily', require('./routes/daily'));
app.use('/api/evening', require('./routes/evening'));
app.use('/api/pomodoro', require('./routes/pomodoro'));
app.use('/api/dashboard', require('./routes/dashboard'));

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
