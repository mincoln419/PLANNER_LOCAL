const API_BASE = '/api';

async function fetchDashboardData() {
  try {
    const response = await fetch(`${API_BASE}/dashboard`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

function updateStats(stats) {
  document.getElementById('total-planners').textContent = stats.total_planners || 0;
  
  const todoCompletion = stats.total_todos > 0 
    ? Math.round((stats.completed_todos / stats.total_todos) * 100)
    : 0;
  document.getElementById('todo-completion').textContent = `${todoCompletion}%`;
  
  const waterCompletion = stats.total_waters > 0
    ? Math.round((stats.completed_waters / stats.total_waters) * 100)
    : 0;
  document.getElementById('water-completion').textContent = `${waterCompletion}%`;
  
  document.getElementById('pomodoro-completion').textContent = stats.pomodoro?.completed || 0;
}

function renderRecentPlanners(planners) {
  const container = document.getElementById('recent-planners');
  
  if (!planners || planners.length === 0) {
    container.innerHTML = '<div class="loading">플래너가 없습니다. 새로 만들어보세요!</div>';
    return;
  }
  
  container.innerHTML = planners.map(planner => {
    const date = new Date(planner.date);
    const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
    
    return `
      <div class="planner-card" onclick="location.href='/daily-planner.html?date=${planner.date}'">
        <div class="planner-card-header">
          <div class="planner-date">${dateStr}</div>
        </div>
        <div class="planner-goal">${planner.goal || '목표가 설정되지 않았습니다.'}</div>
        <div class="planner-stats">
          <span>📅 ${dateStr}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderEveningPreview(planner) {
  const container = document.getElementById('evening-preview');
  
  if (!planner || !planner.activities || planner.activities.length === 0) {
    container.innerHTML = '<div class="loading">Evening Planner가 설정되지 않았습니다.</div>';
    return;
  }
  
  const days = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
  const hours = [17, 18, 19, 20, 21, 22, 23, 24];
  
  let html = '<div class="evening-preview-header">';
  html += '<div></div>';
  for (let i = 1; i <= 5; i++) {
    html += `<div class="evening-preview-day">${days[i]}</div>`;
  }
  html += '</div>';
  
  for (const hour of hours) {
    html += '<div class="evening-preview-grid">';
    html += `<div class="evening-preview-time">${String(hour).padStart(2, '0')}:00</div>`;
    
    for (let day = 1; day <= 5; day++) {
      const activity = planner.activities.find(
        a => a.time_hour === hour && a.day_of_week === day
      );
      html += `<div class="evening-preview-cell">${activity?.activity_text || ''}</div>`;
    }
    
    html += '</div>';
  }
  
  container.innerHTML = html;
}

async function initDashboard() {
  const data = await fetchDashboardData();
  
  if (data) {
    updateStats(data.stats);
    renderRecentPlanners(data.daily_planners);
    
    if (data.evening_planner) {
      const eveningResponse = await fetch(`${API_BASE}/evening`);
      const eveningData = await eveningResponse.json();
      renderEveningPreview(eveningData);
    } else {
      renderEveningPreview(null);
    }
  }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', initDashboard);
