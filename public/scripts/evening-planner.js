const API_BASE = '/api';

let currentPlanner = null;

// Evening Planner 불러오기
async function loadPlanner() {
  try {
    const response = await fetch(`${API_BASE}/evening`);
    const planner = await response.json();
    
    if (planner) {
      currentPlanner = planner;
      renderPlanner(planner);
    } else {
      createEmptyPlanner();
    }
  } catch (error) {
    console.error('Error loading evening planner:', error);
    createEmptyPlanner();
  }
}

// 빈 플래너 생성
function createEmptyPlanner() {
  const planner = {
    id: null,
    activities: []
  };
  
  currentPlanner = planner;
  renderPlanner(planner);
}

// 플래너 렌더링
function renderPlanner(planner) {
  const container = document.getElementById('planner-container');
  
  const days = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
  const hours = [17, 18, 19, 20, 21, 22, 23, 24];
  
  let html = `
    <div class="planner-box">
      <div class="planner-title">EVENING PLANNER</div>
      <div class="time-table-label">Time table</div>
      
      <div class="week-header">
        <div></div>
  `;
  
  for (let i = 1; i <= 5; i++) {
    html += `<div class="day-label">${days[i]}</div>`;
  }
  
  html += '</div>';
  
  for (const hour of hours) {
    html += '<div class="time-row">';
    html += `<div class="time-label">${String(hour).padStart(2, '0')}:00</div>`;
    
    for (let day = 1; day <= 5; day++) {
      const activity = planner.activities?.find(
        a => a.time_hour === hour && a.day_of_week === day
      );
      
      html += `
        <div class="activity-cell">
          <input 
            type="text" 
            data-hour="${hour}" 
            data-day="${day}" 
            placeholder="" 
            value="${activity?.activity_text || ''}"
          />
        </div>
      `;
    }
    
    html += '</div>';
  }
  
  html += '</div>';
  
  container.innerHTML = html;
}

// 플래너 저장
async function savePlanner() {
  const activities = [];
  
  document.querySelectorAll('.activity-cell input').forEach(input => {
    const hour = parseInt(input.dataset.hour);
    const day = parseInt(input.dataset.day);
    const text = input.value.trim();
    
    activities.push({
      time_hour: hour,
      day_of_week: day,
      activity_text: text
    });
  });
  
  try {
    const response = await fetch(`${API_BASE}/evening`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activities })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('저장되었습니다!');
      loadPlanner(); // 다시 불러오기
    } else {
      alert('저장 중 오류가 발생했습니다.');
    }
  } catch (error) {
    console.error('Error saving evening planner:', error);
    alert('저장 중 오류가 발생했습니다.');
  }
}

// 이력 보기
async function showHistory() {
  const modal = document.getElementById('history-modal');
  const historyList = document.getElementById('history-list');
  
  modal.style.display = 'block';
  historyList.innerHTML = '<div class="loading">로딩 중...</div>';
  
  try {
    const response = await fetch(`${API_BASE}/evening/history`);
    const history = await response.json();
    
    if (history.length === 0) {
      historyList.innerHTML = '<div class="loading">이력이 없습니다.</div>';
      return;
    }
    
    historyList.innerHTML = history.map(item => {
      const date = new Date(item.created_at);
      const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      
      return `
        <div class="history-item" onclick="loadHistoryItem(${item.id})">
          <div class="history-item-header">
            <div class="history-date">${dateStr}</div>
          </div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error fetching history:', error);
    historyList.innerHTML = '<div class="loading">이력을 불러오는 중 오류가 발생했습니다.</div>';
  }
}

// 이력 닫기
function closeHistory() {
  document.getElementById('history-modal').style.display = 'none';
}

// 특정 이력 불러오기
async function loadHistoryItem(historyId) {
  try {
    const response = await fetch(`${API_BASE}/evening/history/${historyId}`);
    const historyItem = await response.json();
    
    const activities = JSON.parse(historyItem.snapshot_data);
    const planner = {
      id: historyItem.evening_planner_id,
      activities: activities
    };
    
    currentPlanner = planner;
    renderPlanner(planner);
    closeHistory();
  } catch (error) {
    console.error('Error loading history item:', error);
    alert('이력을 불러오는 중 오류가 발생했습니다.');
  }
}

// 모달 외부 클릭 시 닫기
window.onclick = function(event) {
  const modal = document.getElementById('history-modal');
  if (event.target === modal) {
    closeHistory();
  }
};

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadPlanner);
