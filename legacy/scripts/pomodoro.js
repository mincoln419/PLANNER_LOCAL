const API_BASE = '/api';

let timerInterval = null;
let timeLeft = 25 * 60; // 25분을 초로 변환
let isRunning = false;
let currentSessionId = null;
let duration = 25;

// 타이머 표시 업데이트
function updateDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  document.getElementById('timer-display').textContent = 
    `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// 시간 설정
function setDuration(minutes) {
  if (isRunning) {
    if (!confirm('타이머가 실행 중입니다. 정말 변경하시겠습니까?')) {
      return;
    }
    pauseTimer();
  }
  
  duration = minutes;
  timeLeft = minutes * 60;
  updateDisplay();
}

// 타이머 시작
async function startTimer() {
  if (isRunning) return;
  
  if (timeLeft === duration * 60 && !currentSessionId) {
    // 새 세션 생성
    const taskName = document.getElementById('task-input').value || '';
    
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
      currentSessionId = session.id;
    } catch (error) {
      console.error('Error creating session:', error);
    }
  }
  
  isRunning = true;
  document.getElementById('start-btn').style.display = 'none';
  document.getElementById('pause-btn').style.display = 'inline-block';
  
  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();
    
    if (timeLeft <= 0) {
      completeTimer();
    }
  }, 1000);
}

// 타이머 일시정지
function pauseTimer() {
  if (!isRunning) return;
  
  isRunning = false;
  clearInterval(timerInterval);
  document.getElementById('start-btn').style.display = 'inline-block';
  document.getElementById('pause-btn').style.display = 'none';
}

// 타이머 리셋
function resetTimer() {
  if (isRunning) {
    pauseTimer();
  }
  
  timeLeft = duration * 60;
  updateDisplay();
  currentSessionId = null;
  document.getElementById('task-input').value = '';
}

// 타이머 완료
async function completeTimer() {
  pauseTimer();
  
  if (currentSessionId) {
    try {
      await fetch(`${API_BASE}/pomodoro/${currentSessionId}/complete`, {
        method: 'PUT'
      });
    } catch (error) {
      console.error('Error completing session:', error);
    }
    
    currentSessionId = null;
  }
  
  alert('시간이 완료되었습니다! 🎉');
  resetTimer();
  loadSessions();
}

// 세션 목록 불러오기
async function loadSessions() {
  try {
    const response = await fetch(`${API_BASE}/pomodoro`);
    const sessions = await response.json();
    
    const sessionList = document.getElementById('session-list');
    
    if (sessions.length === 0) {
      sessionList.innerHTML = '<div class="loading">세션이 없습니다.</div>';
      return;
    }
    
    sessionList.innerHTML = sessions.map(session => {
      const date = new Date(session.created_at);
      const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      return `
        <div class="session-item">
          <div class="session-item-header">
            <div class="session-task">${session.task_name || '작업 없음'}</div>
            ${session.completed ? '<span class="session-completed">✓ 완료</span>' : ''}
          </div>
          <div class="session-duration">${session.duration_minutes}분</div>
          <div class="session-date">${dateStr}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading sessions:', error);
  }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  updateDisplay();
  loadSessions();
});
