const API_BASE = '/api';

let currentDate = null;
let currentPlanner = null;

// URL에서 날짜 파라미터 읽기
function getDateFromURL() {
  const params = new URLSearchParams(window.location.search);
  const date = params.get('date');
  if (date) {
    document.getElementById('date-input').value = date;
    return date;
  }
  return null;
}

// 오늘 날짜로 설정
function setTodayDate() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  document.getElementById('date-input').value = dateStr;
  return dateStr;
}

// Daily Planner 불러오기
async function loadPlanner() {
  const dateInput = document.getElementById('date-input');
  const date = dateInput.value;
  
  if (!date) {
    alert('날짜를 선택해주세요.');
    return;
  }
  
  currentDate = date;
  
  try {
    const response = await fetch(`${API_BASE}/daily/${date}`);
    const planner = await response.json();
    
    if (planner) {
      currentPlanner = planner;
      renderPlanner(planner);
    } else {
      // 새 플래너 생성
      createEmptyPlanner(date);
    }
  } catch (error) {
    console.error('Error loading planner:', error);
    alert('플래너를 불러오는 중 오류가 발생했습니다.');
  }
}

// 빈 플래너 생성
function createEmptyPlanner(date) {
  const hours = Array.from({ length: 19 }, (_, i) => i + 6); // 6시부터 24시까지
  
  const planner = {
    date: date,
    goal: '',
    timelines: hours.map(hour => ({
      time_hour: hour,
      plan_text: '',
      actual_text: ''
    })),
    todos: [
      ...Array.from({ length: 6 }, (_, i) => ({
        priority: i + 1,
        task_text: '',
        completed: false,
        order_index: i
      })),
      ...Array.from({ length: 2 }, (_, i) => ({
        priority: 0,
        task_text: '',
        completed: false,
        order_index: i
      }))
    ],
    waters: Array.from({ length: 8 }, (_, i) => ({
      cup_number: i + 1,
      completed: false
    })),
    meals: [
      { meal_type: 'B', meal_text: '' },
      { meal_type: 'L', meal_text: '' },
      { meal_type: 'D', meal_text: '' },
      { meal_type: 'S', meal_text: '' }
    ]
  };
  
  currentPlanner = planner;
  renderPlanner(planner);
}

// 새 플래너 만들기
function createNewPlanner() {
  const date = setTodayDate();
  createEmptyPlanner(date);
}

// 플래너 렌더링
function renderPlanner(planner) {
  const container = document.getElementById('planner-container');
  
  const date = new Date(planner.date);
  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  
  let html = `
    <div class="planner-page">
      <div class="planner-top">
        <div class="planner-title">DAILY PLANNER <small>(Grid)</small></div>
        <div class="planner-date-display">
          <span>Date :</span>
          <span>${dateStr}</span>
        </div>
      </div>
      
      <div class="section-label">Today's goal</div>
      <input type="text" class="goal-input" id="goal-input" placeholder="오늘의 목표를 한 줄로 적어보세요" value="${planner.goal || ''}" />
      
      <div class="planner-grid">
        <!-- 좌측: 타임라인 -->
        <div class="card">
          <div class="card-header">
            <div class="h">Timeline</div>
          </div>
          <table class="timeline-table">
            <thead>
              <tr style="border-bottom: 1px solid var(--line-strong);">
                <th style="text-align:left; padding:4px 6px; font-size:11px; color:var(--muted); font-weight:700; border-right: 1px solid var(--line);">계획</th>
                <th style="text-align:center; padding:4px 6px; font-size:11px; color:var(--muted); font-weight:700; border-right: 1px solid var(--line);">시간</th>
                <th style="text-align:left; padding:4px 6px; font-size:11px; color:var(--muted); font-weight:700;">실제</th>
              </tr>
            </thead>
            <tbody id="timeline-body">
  `;
  
  // Timeline 렌더링
  planner.timelines.forEach(timeline => {
    html += `
      <tr>
        <td class="plan">
          <input type="text" data-time="${timeline.time_hour}" data-type="plan" value="${timeline.plan_text || ''}" />
        </td>
        <td class="time">${String(timeline.time_hour).padStart(2, '0')}:00</td>
        <td class="actual">
          <input type="text" data-time="${timeline.time_hour}" data-type="actual" value="${timeline.actual_text || ''}" />
        </td>
      </tr>
    `;
  });
  
  html += `
            </tbody>
          </table>
        </div>
        
        <!-- 우측: 투두 + 워터 + 식사 -->
        <div>
          <div class="card todo">
            <div class="card-header">
              <div class="h">To-Do List</div>
            </div>
            <div id="todo-list">
  `;
  
  // Todo 렌더링
  planner.todos.forEach((todo, index) => {
    html += `
      <div class="todo-row">
        <div class="idx">${todo.priority}</div>
        <input type="text" data-todo-id="${todo.id || index}" data-priority="${todo.priority}" placeholder="${todo.priority === 0 ? '잡일/즉시 처리' : todo.priority === 1 ? '가장 중요한 일' : ''}" value="${todo.task_text || ''}" />
        <input type="checkbox" data-todo-id="${todo.id || index}" ${todo.completed ? 'checked' : ''} />
      </div>
    `;
  });
  
  html += `
            </div>
          </div>
          
          <!-- Water -->
          <div class="mini">
            <div class="card-header" style="margin-bottom:6px;">
              <div class="h">Water</div>
            </div>
            <div class="water" id="water-list">
  `;
  
  // Water 렌더링
  planner.waters.forEach(water => {
    html += `
      <label>
        <input type="checkbox" data-cup="${water.cup_number}" ${water.completed ? 'checked' : ''} />
        <span class="dot"></span>
      </label>
    `;
  });
  
  html += `
            </div>
          </div>
          
          <!-- Meal -->
          <div class="meal">
            <div class="card-header" style="margin-bottom:6px;">
              <div class="h">Meal</div>
            </div>
            <div id="meal-list">
  `;
  
  // Meal 렌더링
  const mealLabels = { B: 'B.', L: 'L.', D: 'D.', S: 'S.' };
  const mealPlaceholders = { B: '아침', L: '점심', D: '저녁', S: '간식' };
  
  planner.meals.forEach(meal => {
    html += `
      <div class="meal-row">
        <div class="k">${mealLabels[meal.meal_type]}</div>
        <input type="text" data-meal-type="${meal.meal_type}" placeholder="${mealPlaceholders[meal.meal_type]}" value="${meal.meal_text || ''}" />
      </div>
    `;
  });
  
  html += `
            </div>
          </div>
        </div>
      </div>
      
      <div class="save-button">
        <button class="btn btn-primary" onclick="savePlanner()">저장하기</button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
}

// 플래너 저장
async function savePlanner() {
  if (!currentDate) {
    alert('날짜를 선택해주세요.');
    return;
  }
  
  const goal = document.getElementById('goal-input').value;
  
  // Timeline 수집
  const timelines = [];
  document.querySelectorAll('#timeline-body input[data-type="plan"]').forEach(input => {
    const timeHour = parseInt(input.dataset.time);
    const planText = input.value;
    const actualInput = document.querySelector(`input[data-time="${timeHour}"][data-type="actual"]`);
    const actualText = actualInput ? actualInput.value : '';
    
    timelines.push({
      time_hour: timeHour,
      plan_text: planText,
      actual_text: actualText
    });
  });
  
  // Todo 수집
  const todos = [];
  document.querySelectorAll('#todo-list .todo-row').forEach((row, index) => {
    const textInput = row.querySelector('input[type="text"]');
    const checkbox = row.querySelector('input[type="checkbox"]');
    const priority = parseInt(textInput.dataset.priority);
    
    todos.push({
      priority: priority,
      task_text: textInput.value,
      completed: checkbox.checked,
      order_index: index
    });
  });
  
  // Water 수집
  const waters = [];
  document.querySelectorAll('#water-list input[type="checkbox"]').forEach(checkbox => {
    waters.push({
      cup_number: parseInt(checkbox.dataset.cup),
      completed: checkbox.checked
    });
  });
  
  // Meal 수집
  const meals = [];
  document.querySelectorAll('#meal-list input[type="text"]').forEach(input => {
    meals.push({
      meal_type: input.dataset.mealType,
      meal_text: input.value
    });
  });
  
  const plannerData = {
    date: currentDate,
    goal: goal,
    timelines: timelines,
    todos: todos,
    waters: waters,
    meals: meals
  };
  
  try {
    const response = await fetch(`${API_BASE}/daily`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(plannerData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('저장되었습니다!');
      loadPlanner(); // 다시 불러오기
    } else {
      alert('저장 중 오류가 발생했습니다.');
    }
  } catch (error) {
    console.error('Error saving planner:', error);
    alert('저장 중 오류가 발생했습니다.');
  }
}

// 페이지 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  const date = getDateFromURL() || setTodayDate();
  if (date) {
    loadPlanner();
  }
});
