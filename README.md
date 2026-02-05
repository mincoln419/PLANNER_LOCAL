# 시간관리 플래너 웹 애플리케이션

Daily Planner와 Evening Planner를 포함한 종합 시간관리 웹 애플리케이션입니다.

## 주요 기능

- **Daily Planner**: 날짜별로 일일 계획을 세우고 실행 결과를 기록
  - 타임라인 (계획/실제)
  - Todo 리스트
  - 물 마시기 체크
  - 식사 기록

- **Evening Planner**: 저녁 시간대 루틴 계획 (요일별)
  - 이력 관리 기능

- **포모도로 타이머**: 집중력 향상을 위한 타이머
  - 25분, 15분, 5분 설정 가능
  - 세션 기록

- **대시보드**: Daily Planner 통계 및 최근 플래너 확인

## 기술 스택

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Frontend**: HTML, CSS, JavaScript (Vanilla)

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

### 4. 서버 실행

```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

서버가 실행되면 `http://localhost:3000`에서 접속할 수 있습니다.

## 프로젝트 구조

```
PLANNER_LOCAL/
├── database/
│   ├── schema.sql          # 데이터베이스 스키마
│   ├── migrate.js          # 마이그레이션 스크립트
│   └── db.js               # 데이터베이스 연결
├── routes/
│   ├── daily.js            # Daily Planner API
│   ├── evening.js          # Evening Planner API
│   ├── pomodoro.js         # 포모도로 타이머 API
│   └── dashboard.js        # 대시보드 API
├── public/
│   ├── index.html          # 대시보드
│   ├── daily-planner.html  # Daily Planner 페이지
│   ├── evening-planner.html # Evening Planner 페이지
│   ├── pomodoro.html       # 포모도로 타이머 페이지
│   ├── styles/             # CSS 파일
│   └── scripts/            # JavaScript 파일
├── server.js               # Express 서버
├── package.json
└── README.md
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

## 사용 방법

1. **Daily Planner 사용**
   - Daily Planner 메뉴로 이동
   - 날짜를 선택하고 "불러오기" 클릭
   - 계획을 입력하고 "저장하기" 클릭

2. **Evening Planner 사용**
   - Evening Planner 메뉴로 이동
   - 요일별 시간대에 활동을 입력
   - "저장하기" 클릭
   - "이력 보기"로 과거 이력 확인 가능

3. **포모도로 타이머 사용**
   - 포모도로 타이머 메뉴로 이동
   - 할 일을 입력하고 시간을 선택
   - "시작" 버튼 클릭

## 라이선스

ISC
