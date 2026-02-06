const API_BASE = '/api';

let currentPlanner = null;
let selectedCells = new Set(); // 선택된 셀들 (hour-day 조합을 문자열로 저장: "hour-day")
let isDragging = false;
let dragStartCell = null;

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
      <div class="selection-hint">💡 셀을 클릭하거나 드래그하여 선택한 후 입력 버튼을 클릭하세요</div>
      
      <div class="week-header">
        <div></div>
  `;
  
  for (let i = 1; i <= 5; i++) {
    html += `<div class="day-label">${days[i]}</div>`;
  }
  
  html += '</div>';
  
  for (const hour of hours) {
    html += '<div class="time-row" data-hour="' + hour + '">';
    html += `<div class="time-label">${String(hour).padStart(2, '0')}:00</div>`;
    
    for (let day = 1; day <= 5; day++) {
      const activity = planner.activities?.find(
        a => a.time_hour === hour && a.day_of_week === day
      );
      
      html += `
        <div 
          class="activity-cell" 
          data-hour="${hour}" 
          data-day="${day}"
          data-cell-key="${hour}-${day}"
        >
          <div class="activity-display">${activity?.activity_text || ''}</div>
        </div>
      `;
    }
    
    html += '</div>';
  }
  
  html += `
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // 드래그 선택 이벤트 설정
  setupDragSelection();
  
  // 선택 해제
  selectedCells.clear();
  updateSelectionUI();
}

// 드래그 선택 기능 설정
function setupDragSelection() {
  const cells = document.querySelectorAll('.activity-cell');
  let mouseDownTime = 0;
  let mouseDownCell = null;
  let hasMoved = false;
  let mouseDownX = 0;
  let mouseDownY = 0;
  
  cells.forEach(cell => {
    // 마우스 다운
    cell.addEventListener('mousedown', (e) => {
      e.preventDefault();
      mouseDownTime = Date.now();
      mouseDownCell = cell;
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
      hasMoved = false;
      isDragging = false;
      dragStartCell = cell;
      
      // Ctrl/Cmd 키가 눌려있지 않으면 기존 선택 초기화
      if (!e.ctrlKey && !e.metaKey) {
        clearAllSelection();
      }
    });
    
    // 마우스 오버 (드래그 중)
    cell.addEventListener('mouseenter', (e) => {
      if (isDragging && dragStartCell) {
        // 드래그 시작 셀부터 현재 셀까지 모든 셀 선택
        selectCellsBetween(dragStartCell, cell, e.ctrlKey || e.metaKey);
        updateSelectionUI();
      }
    });
  });
  
  // 전역 마우스 이동 (드래그 감지)
  document.addEventListener('mousemove', (e) => {
    if (mouseDownCell) {
      const moveDistance = Math.abs(e.clientX - mouseDownX) + Math.abs(e.clientY - mouseDownY);
      if (moveDistance > 5) {
        hasMoved = true;
        isDragging = true;
      }
    }
  });
  
  // 마우스 업 (전역)
  document.addEventListener('mouseup', (e) => {
    const timeDiff = Date.now() - mouseDownTime;
    const wasDragging = isDragging;
    
    // 클릭인 경우 (드래그가 아닌 경우)
    if (mouseDownCell && !hasMoved && timeDiff < 300) {
      if (e.ctrlKey || e.metaKey) {
        // Ctrl/Cmd + 클릭: 토글
        toggleCellSelection(mouseDownCell);
      } else {
        // 일반 클릭: 단일 선택
        if (!mouseDownCell.classList.contains('selected')) {
          toggleCellSelection(mouseDownCell);
        }
      }
      updateSelectionUI();
    }
    
    // 상태 초기화
    isDragging = false;
    dragStartCell = null;
    const savedMouseDownCell = mouseDownCell;
    mouseDownCell = null;
    hasMoved = false;
    
    // 선택이 완료된 후 모달 자동 열기 (상태 초기화 후)
    if (selectedCells.size > 0) {
      checkAndOpenModal();
    }
  });
}

// 모든 선택 해제
function clearAllSelection() {
  selectedCells.clear();
  document.querySelectorAll('.activity-cell.selected').forEach(cell => {
    cell.classList.remove('selected');
  });
}

// 셀 선택 토글
function toggleCellSelection(cell) {
  const key = cell.dataset.cellKey;
  if (selectedCells.has(key)) {
    selectedCells.delete(key);
    cell.classList.remove('selected');
  } else {
    selectedCells.add(key);
    cell.classList.add('selected');
  }
}

// 두 셀 사이의 모든 셀 선택
function selectCellsBetween(startCell, endCell, addToSelection = false) {
  // Ctrl/Cmd 키가 눌려있지 않으면 기존 선택 초기화
  if (!addToSelection) {
    clearAllSelection();
  }
  
  const startHour = parseInt(startCell.dataset.hour);
  const startDay = parseInt(startCell.dataset.day);
  const endHour = parseInt(endCell.dataset.hour);
  const endDay = parseInt(endCell.dataset.day);
  
  const minHour = Math.min(startHour, endHour);
  const maxHour = Math.max(startHour, endHour);
  const minDay = Math.min(startDay, endDay);
  const maxDay = Math.max(startDay, endDay);
  
  for (let hour = minHour; hour <= maxHour; hour++) {
    for (let day = minDay; day <= maxDay; day++) {
      const cell = document.querySelector(`.activity-cell[data-hour="${hour}"][data-day="${day}"]`);
      if (cell) {
        const key = cell.dataset.cellKey;
        selectedCells.add(key);
        cell.classList.add('selected');
      }
    }
  }
}

// 선택 해제
function clearSelection() {
  clearAllSelection();
  updateSelectionUI();
}

// 선택 UI 업데이트
function updateSelectionUI() {
  const actionsDiv = document.getElementById('selection-actions');
  const countSpan = document.getElementById('selected-count');
  
  if (selectedCells.size > 0) {
    actionsDiv.style.display = 'flex';
    countSpan.textContent = selectedCells.size;
  } else {
    actionsDiv.style.display = 'none';
  }
}

// 선택 완료 시 모달 자동 열기
function checkAndOpenModal() {
  // 선택이 있으면 모달 자동 열기
  if (selectedCells.size > 0) {
    // 약간의 지연을 두어 이벤트 처리가 완료된 후 모달 열기
    setTimeout(() => {
      if (selectedCells.size > 0) {
        // 모달이 이미 열려있지 않은 경우에만 열기
        const modal = document.getElementById('input-modal');
        if (modal && modal.style.display !== 'block') {
          openInputModal();
        }
      }
    }, 150);
  }
}

// 입력 모달 열기
function openInputModal() {
  if (selectedCells.size === 0) {
    alert('셀을 선택해주세요.');
    return;
  }
  
  // 선택된 셀들의 기존 값 확인 (모두 같으면 표시)
  const values = Array.from(selectedCells).map(key => {
    const cell = document.querySelector(`.activity-cell[data-cell-key="${key}"]`);
    if (cell) {
      const display = cell.querySelector('.activity-display');
      return display.textContent.trim();
    }
    return '';
  });
  
  const uniqueValues = [...new Set(values.filter(v => v))];
  const initialValue = uniqueValues.length === 1 ? uniqueValues[0] : '';
  
  const modal = document.getElementById('input-modal');
  const input = document.getElementById('activity-input-modal');
  const countSpan = document.getElementById('modal-selected-count');
  
  countSpan.textContent = selectedCells.size;
  input.value = initialValue;
  modal.style.display = 'block';
  input.focus();
  input.select();
}

// 입력 모달 닫기
function closeInputModal() {
  document.getElementById('input-modal').style.display = 'none';
  document.getElementById('activity-input-modal').value = '';
}

// 입력 모달 닫기 및 선택 해제
function closeInputModalAndClear() {
  closeInputModal();
  clearSelection();
}

// 선택된 셀에 입력 저장 (실제 DB 저장)
async function saveSelectedCells() {
  const input = document.getElementById('activity-input-modal');
  const text = input.value.trim();
  const saveBtn = document.getElementById('save-modal-btn');
  const saveBtnText = document.getElementById('save-btn-text');
  const saveBtnLoading = document.getElementById('save-btn-loading');
  
  if (!text) {
    alert('활동을 입력해주세요.');
    return;
  }
  
  // 저장 버튼 비활성화 및 로딩 표시
  saveBtn.disabled = true;
  saveBtnText.style.display = 'none';
  saveBtnLoading.style.display = 'inline';
  
  // 선택된 셀들의 활동 데이터 생성
  const activities = [];
  selectedCells.forEach(key => {
    const [hour, day] = key.split('-');
    activities.push({
      time_hour: parseInt(hour),
      day_of_week: parseInt(day),
      activity_text: text
    });
  });
  
  try {
    // 현재 플래너의 모든 활동 가져오기
    const allActivities = [];
    document.querySelectorAll('.activity-cell').forEach(cell => {
      const hour = parseInt(cell.dataset.hour);
      const day = parseInt(cell.dataset.day);
      const display = cell.querySelector('.activity-display');
      const existingText = display.textContent.trim();
      
      // 선택된 셀이 아니고 기존 값이 있으면 유지
      const key = cell.dataset.cellKey;
      if (!selectedCells.has(key) && existingText) {
        allActivities.push({
          time_hour: hour,
          day_of_week: day,
          activity_text: existingText
        });
      }
    });
    
    // 새로 입력한 활동 추가
    allActivities.push(...activities);
    
    // API 호출하여 저장
    const response = await fetch(`${API_BASE}/evening`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ activities: allActivities })
    });
    
    const result = await response.json();
    
    if (result.success) {
      closeInputModal();
      clearSelection();
      
      // 플래너 다시 불러오기 (최신 상태 유지)
      await loadPlanner();
    } else {
      alert('저장 중 오류가 발생했습니다.');
      // 버튼 복원
      saveBtn.disabled = false;
      saveBtnText.style.display = 'inline';
      saveBtnLoading.style.display = 'none';
    }
  } catch (error) {
    console.error('Error saving activities:', error);
    alert('저장 중 오류가 발생했습니다.');
    // 버튼 복원
    saveBtn.disabled = false;
    saveBtnText.style.display = 'inline';
    saveBtnLoading.style.display = 'none';
  }
}

// 플래너 저장
async function savePlanner() {
  const activities = [];
  
  // 모든 셀에서 활동 수집
  document.querySelectorAll('.activity-cell').forEach(cell => {
    const hour = parseInt(cell.dataset.hour);
    const day = parseInt(cell.dataset.day);
    const display = cell.querySelector('.activity-display');
    const text = display.textContent.trim();
    
    if (text) {
      activities.push({
        time_hour: hour,
        day_of_week: day,
        activity_text: text
      });
    }
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
  const historyModal = document.getElementById('history-modal');
  const inputModal = document.getElementById('input-modal');
  
  if (event.target === historyModal) {
    closeHistory();
  }
  
  if (event.target === inputModal) {
    closeInputModal();
  }
};

// 키보드 단축키 핸들러
document.addEventListener('keydown', (e) => {
  // ESC 키: 모달 닫기
  if (e.key === 'Escape' || e.key === 'Esc') {
    const inputModal = document.getElementById('input-modal');
    const historyModal = document.getElementById('history-modal');
    
    if (inputModal && inputModal.style.display === 'block') {
      e.preventDefault();
      closeInputModalAndClear();
      return;
    }
    
    if (historyModal && historyModal.style.display === 'block') {
      e.preventDefault();
      closeHistory();
      return;
    }
  }
  
  // Mac: Cmd, Windows: Ctrl
  const isModifierPressed = e.metaKey || e.ctrlKey;
  const isShiftPressed = e.shiftKey;
  
  if (!isModifierPressed) return;
  
  // 모달이 열려있으면 다른 단축키 비활성화
  const inputModal = document.getElementById('input-modal');
  const historyModal = document.getElementById('history-modal');
  if ((inputModal && inputModal.style.display === 'block') || 
      (historyModal && historyModal.style.display === 'block')) {
    return;
  }
  
  // Cmd/Ctrl + Shift + S: 저장 (브라우저 기본 저장과 겹치지 않음)
  if ((e.key === 's' || e.key === 'S') && isShiftPressed) {
    e.preventDefault();
    savePlanner();
    return;
  }
  
  // Cmd/Ctrl + Shift + L: 불러오기 (Load의 L, 브라우저 기본 단축키와 겹치지 않음)
  if ((e.key === 'l' || e.key === 'L') && isShiftPressed) {
    e.preventDefault();
    loadPlanner();
    return;
  }
});

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', loadPlanner);
