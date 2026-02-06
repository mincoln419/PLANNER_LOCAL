-- Daily Planner 테이블
CREATE TABLE IF NOT EXISTS daily_planners (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    goal TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Daily Planner Timeline 테이블
CREATE TABLE IF NOT EXISTS daily_timelines (
    id SERIAL PRIMARY KEY,
    daily_planner_id INTEGER NOT NULL REFERENCES daily_planners(id) ON DELETE CASCADE,
    time_hour INTEGER NOT NULL CHECK (time_hour >= 6 AND time_hour <= 24),
    plan_text TEXT,
    actual_text TEXT,
    UNIQUE(daily_planner_id, time_hour)
);

-- Daily Planner Todo 테이블
CREATE TABLE IF NOT EXISTS daily_todos (
    id SERIAL PRIMARY KEY,
    daily_planner_id INTEGER NOT NULL REFERENCES daily_planners(id) ON DELETE CASCADE,
    priority INTEGER NOT NULL CHECK (priority >= 0 AND priority <= 6),
    task_text TEXT,
    completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER
);

-- Daily Planner Water 테이블
CREATE TABLE IF NOT EXISTS daily_waters (
    id SERIAL PRIMARY KEY,
    daily_planner_id INTEGER NOT NULL REFERENCES daily_planners(id) ON DELETE CASCADE,
    cup_number INTEGER NOT NULL CHECK (cup_number >= 1 AND cup_number <= 8),
    completed BOOLEAN DEFAULT FALSE,
    UNIQUE(daily_planner_id, cup_number)
);

-- Daily Planner Meal 테이블
CREATE TABLE IF NOT EXISTS daily_meals (
    id SERIAL PRIMARY KEY,
    daily_planner_id INTEGER NOT NULL REFERENCES daily_planners(id) ON DELETE CASCADE,
    meal_type VARCHAR(10) NOT NULL CHECK (meal_type IN ('B', 'L', 'D', 'S')),
    meal_text TEXT,
    UNIQUE(daily_planner_id, meal_type)
);

-- Evening Planner 테이블 (현재 활성화된 하나만)
-- is_active = TRUE인 경우에만 active_key = 1로 설정하여 UNIQUE 제약조건으로 하나만 존재하도록 보장
CREATE TABLE IF NOT EXISTS evening_planners (
    id SERIAL PRIMARY KEY,
    is_active BOOLEAN DEFAULT TRUE,
    active_key INTEGER DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_active_key CHECK (
        (is_active = TRUE AND active_key = 1) OR 
        (is_active = FALSE AND active_key IS NULL)
    )
);

-- Evening Planner Activities 테이블
-- 각 시간대/요일 조합에 여러 활동을 저장할 수 있도록 UNIQUE 제약조건 제거
CREATE TABLE IF NOT EXISTS evening_activities (
    id SERIAL PRIMARY KEY,
    evening_planner_id INTEGER NOT NULL REFERENCES evening_planners(id) ON DELETE CASCADE,
    time_hour INTEGER NOT NULL CHECK (time_hour >= 17 AND time_hour <= 24),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 5), -- 1: MON, 2: TUE, ..., 5: FRI
    activity_text TEXT
);

-- Evening Planner History 테이블 (이력 관리)
CREATE TABLE IF NOT EXISTS evening_planner_history (
    id SERIAL PRIMARY KEY,
    evening_planner_id INTEGER NOT NULL REFERENCES evening_planners(id) ON DELETE CASCADE,
    snapshot_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 포모도로 타이머 세션 테이블
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id SERIAL PRIMARY KEY,
    task_name TEXT,
    duration_minutes INTEGER DEFAULT 25,
    completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_planners_date ON daily_planners(date);
CREATE INDEX IF NOT EXISTS idx_daily_timelines_planner_id ON daily_timelines(daily_planner_id);
CREATE INDEX IF NOT EXISTS idx_daily_todos_planner_id ON daily_todos(daily_planner_id);
CREATE INDEX IF NOT EXISTS idx_evening_activities_planner_id ON evening_activities(evening_planner_id);
CREATE INDEX IF NOT EXISTS idx_evening_planner_history_planner_id ON evening_planner_history(evening_planner_id);

-- Evening Planner: 활성화된 플래너가 하나만 존재하도록 보장하는 UNIQUE 인덱스
-- active_key = 1인 경우에만 UNIQUE 제약조건 적용
CREATE UNIQUE INDEX IF NOT EXISTS idx_evening_planners_one_active 
ON evening_planners(active_key) 
WHERE active_key = 1;
