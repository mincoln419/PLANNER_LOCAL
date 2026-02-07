import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Snackbar from '../components/Snackbar';
import SaveModal from '../components/SaveModal';
import ErrorModal from '../components/ErrorModal';
import './DailyPlanner.css';

const API_BASE = '/api';

function DailyPlanner() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState('');
  const [planner, setPlanner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const autoSaveIntervalRef = useRef(null);
  const savedScrollPositionRef = useRef(null);

  useEffect(() => {
    const dateFromURL = searchParams.get('date');
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const initialDate = dateFromURL || todayStr;
    setCurrentDate(initialDate);
    loadPlanner(initialDate);
    
    // 5분마다 자동 저장
    autoSaveIntervalRef.current = setInterval(() => {
      autoSave();
    }, 5 * 60 * 1000); // 5분 = 300000ms
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [searchParams]);

  // planner 상태 변경 후 스크롤 위치 복원
  useEffect(() => {
    if (savedScrollPositionRef.current !== null && planner) {
      // 여러 프레임에 걸쳐 복원 시도 (React 리렌더링 완료 보장)
      const restoreScroll = () => {
        const scrollPos = savedScrollPositionRef.current;
        if (scrollPos !== null) {
          window.scrollTo({
            top: scrollPos,
            left: 0,
            behavior: 'instant'
          });
          savedScrollPositionRef.current = null;
        }
      };
      
      // 즉시 한 번, 그리고 여러 프레임 후에도 복원 시도
      restoreScroll();
      requestAnimationFrame(() => {
        restoreScroll();
        requestAnimationFrame(() => {
          restoreScroll();
          setTimeout(() => {
            restoreScroll();
          }, 100);
        });
      });
    }
  }, [planner]);

  const createEmptyPlanner = (date) => {
    const hours = Array.from({ length: 19 }, (_, i) => i + 6);
    
    return {
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
  };

  const loadPlanner = async (date) => {
    if (!date) {
      setErrorMessage('날짜를 선택해주세요.');
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/daily/${date}`);
      const data = await response.json();
      
      if (data) {
        setPlanner(data);
      } else {
        setPlanner(createEmptyPlanner(date));
      }
    } catch (error) {
      console.error('Error loading planner:', error);
      setErrorMessage('플래너를 불러오는 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setCurrentDate(newDate);
    navigate(`/daily-planner?date=${newDate}`);
  };

  const handleLoad = () => {
    loadPlanner(currentDate);
  };

  const handleCreateNew = () => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    setCurrentDate(todayStr);
    setPlanner(createEmptyPlanner(todayStr));
    navigate(`/daily-planner?date=${todayStr}`);
  };

  const handleSave = async (isAutoSave = false) => {
    if (!currentDate || !planner) {
      if (!isAutoSave) {
        setErrorMessage('날짜를 선택해주세요.');
        setShowErrorModal(true);
      }
      return;
    }

    // 현재 스크롤 위치 저장
    savedScrollPositionRef.current = window.scrollY || window.pageYOffset;

    const plannerData = {
      date: currentDate,
      goal: planner.goal,
      timelines: planner.timelines,
      todos: planner.todos,
      waters: planner.waters,
      meals: planner.meals
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
        if (!isAutoSave) {
          setShowSaveModal(true);
        } else {
          setShowSnackbar(true);
        }
        // 저장 성공 - 데이터 재로드 불필요 (스크롤 유지)
      } else {
        if (!isAutoSave) {
          setErrorMessage('저장 중 오류가 발생했습니다.');
          setShowErrorModal(true);
        }
      }
    } catch (error) {
      console.error('Error saving planner:', error);
      if (!isAutoSave) {
        setErrorMessage('저장 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    }
  };

  const autoSave = async () => {
    // 자동 저장은 플래너가 있을 때만 실행
    if (planner && currentDate) {
      await handleSave(true);
    }
  };

  const updatePlanner = (updates) => {
    setPlanner(prev => ({ ...prev, ...updates }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isModifierPressed = e.metaKey || e.ctrlKey;
      const isShiftPressed = e.shiftKey;
      
      if (!isModifierPressed) return;
      
      if ((e.key === 's' || e.key === 'S') && isShiftPressed) {
        e.preventDefault();
        handleSave(false);
        return;
      }
      
      if ((e.key === 'l' || e.key === 'L') && isShiftPressed) {
        e.preventDefault();
        handleLoad();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentDate, planner]);

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  if (!planner) {
    return <div className="loading">날짜를 선택하고 불러오기를 클릭하세요</div>;
  }

  const mealLabels = { B: 'B.', L: 'L.', D: 'D.', S: 'S.' };
  const mealPlaceholders = { B: '아침', L: '점심', D: '저녁', S: '간식' };

  return (
    <>
      <header className="page-header">
        <div className="header-controls">
          <div>
            <h2>Daily Planner</h2>
            <p>날짜별로 계획을 세우고 실행하세요</p>
          </div>
          <div className="date-selector">
            <input 
              type="date" 
              value={currentDate}
              onChange={handleDateChange}
            />
            <button className="btn btn-primary" onClick={handleLoad}>불러오기</button>
            <button className="btn btn-primary" onClick={handleCreateNew}>새로 만들기</button>
            <div className="keyboard-hint">
              <span className="hint-text">💡 단축키: <kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> 저장, <kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> 불러오기</span>
            </div>
          </div>
        </div>
      </header>

      <div className="planner-container">
        <div className="planner-page">
          <div className="planner-top">
            <div className="planner-title">DAILY PLANNER <small>(Grid)</small></div>
            <div className="planner-date-display">
              <span>Date :</span>
              <span>{formatDate(planner.date)}</span>
            </div>
          </div>
          
          <div className="section-label">Today's goal</div>
          <input 
            type="text" 
            className="goal-input" 
            placeholder="오늘의 목표를 한 줄로 적어보세요" 
            value={planner.goal || ''}
            onChange={(e) => updatePlanner({ goal: e.target.value })}
          />
          
          <div className="planner-grid">
            {/* 좌측: 타임라인 */}
            <div className="card">
              <div className="card-header">
                <div className="h">Timeline</div>
              </div>
              <table className="timeline-table">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line-strong)' }}>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontSize: '11px', color: 'var(--muted)', fontWeight: 700, borderRight: '1px solid var(--line)' }}>계획</th>
                    <th style={{ textAlign: 'center', padding: '4px 6px', fontSize: '11px', color: 'var(--muted)', fontWeight: 700, borderRight: '1px solid var(--line)' }}>시간</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', fontSize: '11px', color: 'var(--muted)', fontWeight: 700 }}>실제</th>
                  </tr>
                </thead>
                <tbody>
                  {planner.timelines.map((timeline) => (
                    <tr key={timeline.time_hour}>
                      <td className="plan">
                        <input 
                          type="text" 
                          value={timeline.plan_text || ''}
                          onChange={(e) => {
                            const newTimelines = planner.timelines.map(t => 
                              t.time_hour === timeline.time_hour 
                                ? { ...t, plan_text: e.target.value }
                                : t
                            );
                            updatePlanner({ timelines: newTimelines });
                          }}
                        />
                      </td>
                      <td className="time">{String(timeline.time_hour).padStart(2, '0')}:00</td>
                      <td className="actual">
                        <input 
                          type="text" 
                          value={timeline.actual_text || ''}
                          onChange={(e) => {
                            const newTimelines = planner.timelines.map(t => 
                              t.time_hour === timeline.time_hour 
                                ? { ...t, actual_text: e.target.value }
                                : t
                            );
                            updatePlanner({ timelines: newTimelines });
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* 우측: 투두 + 워터 + 식사 */}
            <div>
              <div className="card todo">
                <div className="card-header">
                  <div className="h">To-Do List</div>
                </div>
                {planner.todos.map((todo, index) => (
                  <div key={index} className="todo-row">
                    <div className="idx">{todo.priority}</div>
                    <input 
                      type="text" 
                      placeholder={todo.priority === 0 ? '잡일/즉시 처리' : todo.priority === 1 ? '가장 중요한 일' : ''}
                      value={todo.task_text || ''}
                      onChange={(e) => {
                        const newTodos = [...planner.todos];
                        newTodos[index].task_text = e.target.value;
                        updatePlanner({ todos: newTodos });
                      }}
                    />
                    <input 
                      type="checkbox" 
                      checked={todo.completed || false}
                      onChange={(e) => {
                        const newTodos = [...planner.todos];
                        newTodos[index].completed = e.target.checked;
                        updatePlanner({ todos: newTodos });
                      }}
                    />
                  </div>
                ))}
              </div>
              
              {/* Water */}
              <div className="mini">
                <div className="card-header" style={{ marginBottom: '6px' }}>
                  <div className="h">Water</div>
                </div>
                <div className="water">
                  {planner.waters.map((water) => (
                    <label key={water.cup_number}>
                      <input 
                        type="checkbox" 
                        checked={water.completed || false}
                        onChange={(e) => {
                          const newWaters = planner.waters.map(w => 
                            w.cup_number === water.cup_number 
                              ? { ...w, completed: e.target.checked }
                              : w
                          );
                          updatePlanner({ waters: newWaters });
                        }}
                      />
                      <span className="dot"></span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Meal */}
              <div className="meal">
                <div className="card-header" style={{ marginBottom: '6px' }}>
                  <div className="h">Meal</div>
                </div>
                {planner.meals.map((meal, index) => (
                  <div key={meal.meal_type} className="meal-row">
                    <div className="k">{mealLabels[meal.meal_type]}</div>
                    <input 
                      type="text" 
                      placeholder={mealPlaceholders[meal.meal_type]}
                      value={meal.meal_text || ''}
                      onChange={(e) => {
                        const newMeals = [...planner.meals];
                        newMeals[index].meal_text = e.target.value;
                        updatePlanner({ meals: newMeals });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="save-button">
            <button className="btn btn-primary" onClick={() => handleSave(false)}>저장하기</button>
          </div>
        </div>
      </div>

      <Snackbar 
        message="자동저장되었습니다" 
        show={showSnackbar} 
        onClose={() => setShowSnackbar(false)} 
      />

      <SaveModal 
        show={showSaveModal} 
        onClose={() => setShowSaveModal(false)} 
      />

      <ErrorModal 
        message={errorMessage}
        show={showErrorModal} 
        onClose={() => setShowErrorModal(false)} 
      />
    </>
  );
}

export default DailyPlanner;
