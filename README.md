# 시간관리 플래너 웹 애플리케이션

Daily Planner와 Evening Planner를 포함한 종합 시간관리 웹 애플리케이션입니다.

## 주요 기능

- **Daily Planner**: 날짜별로 일일 계획을 세우고 실행 결과를 기록
  - 타임라인 (계획/실제)
  - Todo 리스트
  - 물 마시기 체크
  - 식사 기록

- **Evening Planner**: 저녁 시간대 루틴 계획 (요일별)
  - 드래그 선택으로 여러 셀 동시 입력
  - 이력 관리 기능

- **포모도로 타이머**: 집중력 향상을 위한 타이머
  - 25분, 15분, 5분 설정 가능
  - 세션 기록

- **대시보드**: Daily Planner 통계 및 최근 플래너 확인

## 기술 스택

- **Frontend**: React 18 + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: PostgreSQL

## 설치 및 실행

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 다음 내용을 입력하세요:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=planner_db
DB_USER=postgres
DB_PASSWORD=your_password

PORT=3000
NODE_ENV=development
```

### 3. 데이터베이스 설정

PostgreSQL 데이터베이스를 생성하고 마이그레이션을 실행하세요:

```bash
# PostgreSQL에 데이터베이스 생성
createdb planner_db

# 마이그레이션 실행
npm run migrate
```

### 4. 개발 모드 실행

```bash
# 백엔드 서버(3000) + React 개발 서버(5173) 동시 실행
npm run dev
```

- 백엔드 API: `http://localhost:3000`
- React 개발 서버: `http://localhost:5173` (프록시로 API 호출)

### 5. 프로덕션 빌드 및 실행

```bash
# React 빌드
npm run build

# 프로덕션 서버 실행 (빌드 파일 포함)
npm run build:start

# 또는
npm start
```

프로덕션 모드에서는 Express 서버가 React 빌드 파일을 서빙합니다.

## 프로젝트 구조

```
PLANNER_LOCAL/
├── src/                    # React 소스 코드
│   ├── components/         # 공통 컴포넌트
│   ├── pages/              # 페이지 컴포넌트
│   ├── App.jsx             # 메인 앱 컴포넌트
│   └── main.jsx             # React 진입점
├── database/
│   ├── schema.sql          # 데이터베이스 스키마
│   ├── migrate.js          # 마이그레이션 스크립트
│   └── db.js               # 데이터베이스 연결
├── routes/                 # Express API 라우트
├── public/                 # 정적 파일 (favicon 등)
├── dist/                   # React 빌드 출력 (프로덕션)
├── server.js               # Express 서버
├── vite.config.js          # Vite 설정
└── package.json
```

## API 엔드포인트

### Daily Planner
- `GET /api/daily` - 모든 Daily Planner 조회
- `GET /api/daily/:date` - 특정 날짜의 Daily Planner 조회
- `POST /api/daily` - Daily Planner 생성/업데이트
- `DELETE /api/daily/:date` - Daily Planner 삭제

### Evening Planner
- `GET /api/evening` - 현재 활성화된 Evening Planner 조회
- `POST /api/evening` - Evening Planner 생성/업데이트
- `GET /api/evening/history` - Evening Planner 이력 조회
- `GET /api/evening/history/:id` - 특정 이력 조회

### 포모도로 타이머
- `GET /api/pomodoro` - 모든 포모도로 세션 조회
- `POST /api/pomodoro` - 포모도로 세션 생성
- `PUT /api/pomodoro/:id/complete` - 포모도로 세션 완료
- `DELETE /api/pomodoro/:id` - 포모도로 세션 삭제

### 대시보드
- `GET /api/dashboard` - 대시보드 데이터 조회

## 개발 모드 vs 프로덕션 모드

### 개발 모드 (`npm run dev`)
- Express 서버: `localhost:3000` (API만)
- Vite 개발 서버: `localhost:5173` (React 앱)
- Hot Module Replacement (HMR) 지원
- API 요청은 Vite 프록시를 통해 Express로 전달

### 프로덕션 모드 (`npm start`)
- Express 서버: `localhost:3000` (API + React 빌드 파일)
- React 앱이 빌드되어 `dist/` 폴더에 생성
- 모든 요청이 Express 서버로 처리
- SPA 라우팅 지원 (모든 경로가 `index.html`로 리다이렉트)

## 키보드 단축키

- `Cmd/Ctrl + Shift + S`: 저장
- `Cmd/Ctrl + Shift + L`: 불러오기
- `ESC`: 모달 닫기

## 라이선스

ISC
