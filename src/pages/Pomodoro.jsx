import React, { useState, useEffect, useRef } from 'react';
import './Pomodoro.css';

const API_BASE = '/api';

function Pomodoro() {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(25);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [taskName, setTaskName] = useState('');
  const [sessions, setSessions] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            completeTimer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleSetDuration = (minutes) => {
    if (isRunning) {
      if (!window.confirm('타이머가 실행 중입니다. 정말 변경하시겠습니까?')) {
        return;
      }
      pauseTimer();
    }
    
    setDuration(minutes);
    setTimeLeft(minutes * 60);
  };

  const startTimer = async () => {
    if (isRunning) return;
    
    if (timeLeft === duration * 60 && !currentSessionId) {
      try {
        const response = await fetch(`${API_BASE}/pomodoro`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            task_name: taskName,
            duration_minutes: duration
          })
        });
        
        const session = await response.json();
        setCurrentSessionId(session.id);
      } catch (error) {
        console.error('Error creating session:', error);
      }
    }
    
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(duration * 60);
    setCurrentSessionId(null);
    setTaskName('');
  };

  const completeTimer = async () => {
    setIsRunning(false);
    
    if (currentSessionId) {
      try {
        await fetch(`${API_BASE}/pomodoro/${currentSessionId}/complete`, {
          method: 'PUT'
        });
      } catch (error) {
        console.error('Error completing session:', error);
      }
      
      setCurrentSessionId(null);
    }
    
    alert('시간이 완료되었습니다! 🎉');
    resetTimer();
    loadSessions();
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/pomodoro`);
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h2>포모도로 타이머</h2>
          <p>집중력을 높이는 시간 관리 기법</p>
        </div>
      </header>

      <div className="pomodoro-container">
        <div className="pomodoro-timer">
          <div className="timer-display">{formatTime(timeLeft)}</div>
          <div className="timer-controls">
            <button className="btn btn-secondary" onClick={() => handleSetDuration(45)}>45분</button>
            <button className="btn btn-secondary" onClick={() => handleSetDuration(25)}>25분</button>
            <button className="btn btn-secondary" onClick={() => handleSetDuration(15)}>15분</button>
            <button className="btn btn-secondary" onClick={() => handleSetDuration(5)}>5분</button>
          </div>
          <div className="task-input">
            <input
              type="text"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="할 일을 입력하세요..."
            />
          </div>
          <div className="timer-buttons">
            {!isRunning ? (
              <button className="btn btn-primary" onClick={startTimer}>시작</button>
            ) : (
              <button className="btn btn-secondary" onClick={pauseTimer}>일시정지</button>
            )}
            <button className="btn btn-secondary" onClick={resetTimer}>리셋</button>
          </div>
        </div>

        <div className="pomodoro-stats">
          <h3>최근 세션</h3>
          <div className="session-list">
            {sessions.length === 0 ? (
              <div className="loading">세션이 없습니다.</div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="session-item">
                  <div className="session-item-header">
                    <div className="session-task">{session.task_name || '작업 없음'}</div>
                    {session.completed && <span className="session-completed">✓ 완료</span>}
                  </div>
                  <div className="session-duration">{session.duration_minutes}분</div>
                  <div className="session-date">{formatDate(session.created_at)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Pomodoro;
