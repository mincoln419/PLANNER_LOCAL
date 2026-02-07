import React, { useState, useEffect, useRef } from 'react';
import Snackbar from '../components/Snackbar';
import SaveModal from '../components/SaveModal';
import ErrorModal from '../components/ErrorModal';
import './EveningPlanner.css';

const API_BASE = '/api';

function EveningPlanner() {
  const [planner, setPlanner] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartCell, setDragStartCell] = useState(null);
  const [showInputModal, setShowInputModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const autoSaveIntervalRef = useRef(null);
  const savedScrollPositionRef = useRef(null);
  
  const mouseDownCellRef = useRef(null);
  const mouseDownTimeRef = useRef(0);
  const hasMovedRef = useRef(false);
  const mouseDownXRef = useRef(0);
  const mouseDownYRef = useRef(0);

  useEffect(() => {
    loadPlanner();
    setupDragSelection();
    
    // 5분마다 자동 저장
    autoSaveIntervalRef.current = setInterval(() => {
      autoSave();
    }, 5 * 60 * 1000); // 5분 = 300000ms
    
    return () => {
      // Cleanup
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

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

  useEffect(() => {
    if (selectedCells.size > 0 && !isDragging) {
      const timer = setTimeout(() => {
        if (selectedCells.size > 0) {
          openInputModal();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [selectedCells, isDragging]);

  const loadPlanner = async () => {
    try {
      const response = await fetch(`${API_BASE}/evening`);
      const data = await response.json();
      
      if (data) {
        setPlanner(data);
      } else {
        setPlanner({ id: null, activities: [] });
      }
    } catch (error) {
      console.error('Error loading evening planner:', error);
      setPlanner({ id: null, activities: [] });
    }
  };

  const setupDragSelection = () => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (mouseDownCellRef.current) {
      const moveDistance = Math.abs(e.clientX - mouseDownXRef.current) + Math.abs(e.clientY - mouseDownYRef.current);
      if (moveDistance > 5) {
        hasMovedRef.current = true;
        setIsDragging(true);
      }
    }
  };

  const handleMouseUp = (e) => {
    const timeDiff = Date.now() - mouseDownTimeRef.current;
    
    if (mouseDownCellRef.current && !hasMovedRef.current && timeDiff < 300) {
      // 클릭
      const cell = mouseDownCellRef.current;
      if (e.ctrlKey || e.metaKey) {
        toggleCellSelection(cell);
      } else {
        if (!cell.classList.contains('selected')) {
          setSelectedCells(new Set());
          document.querySelectorAll('.activity-cell.selected').forEach(c => {
            c.classList.remove('selected');
          });
          toggleCellSelection(cell);
        }
      }
    }
    
    setIsDragging(false);
    setDragStartCell(null);
    mouseDownCellRef.current = null;
    hasMovedRef.current = false;
  };

  const handleCellMouseDown = (e, hour, day) => {
    e.preventDefault();
    const cell = e.currentTarget;
    mouseDownTimeRef.current = Date.now();
    mouseDownCellRef.current = cell;
    mouseDownXRef.current = e.clientX;
    mouseDownYRef.current = e.clientY;
    hasMovedRef.current = false;
    setIsDragging(false);
    setDragStartCell(cell);
    
    if (!e.ctrlKey && !e.metaKey) {
      clearAllSelection();
    }
    
    toggleCellSelection(cell);
  };

  const handleCellMouseEnter = (e, hour, day) => {
    if (isDragging && dragStartCell) {
      selectCellsBetween(dragStartCell, e.currentTarget, e.ctrlKey || e.metaKey);
    }
  };

  const toggleCellSelection = (cell) => {
    const key = cell.dataset.cellKey;
    setSelectedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
        cell.classList.remove('selected');
      } else {
        newSet.add(key);
        cell.classList.add('selected');
      }
      return newSet;
    });
  };

  const selectCellsBetween = (startCell, endCell, addToSelection = false) => {
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
    
    const newSelected = new Set(selectedCells);
    
    for (let hour = minHour; hour <= maxHour; hour++) {
      for (let day = minDay; day <= maxDay; day++) {
        const cell = document.querySelector(`.activity-cell[data-hour="${hour}"][data-day="${day}"]`);
        if (cell) {
          const key = cell.dataset.cellKey;
          newSelected.add(key);
          cell.classList.add('selected');
        }
      }
    }
    
    setSelectedCells(newSelected);
  };

  const clearAllSelection = () => {
    setSelectedCells(new Set());
    document.querySelectorAll('.activity-cell.selected').forEach(cell => {
      cell.classList.remove('selected');
    });
  };

  const openInputModal = () => {
    if (selectedCells.size === 0) return;
    
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
    
    setInputValue(initialValue);
    setShowInputModal(true);
  };

  const closeInputModal = () => {
    setShowInputModal(false);
    setInputValue('');
    clearAllSelection();
  };

  const saveSelectedCells = async () => {
    const text = inputValue.trim();
    
    if (!text) {
      setErrorMessage('활동을 입력해주세요.');
      setShowErrorModal(true);
      return;
    }
    
    // 현재 스크롤 위치 저장
    savedScrollPositionRef.current = window.scrollY || window.pageYOffset;
    
    setSaving(true);
    
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
      const allActivities = [];
      document.querySelectorAll('.activity-cell').forEach(cell => {
        const hour = parseInt(cell.dataset.hour);
        const day = parseInt(cell.dataset.day);
        const display = cell.querySelector('.activity-display');
        const existingText = display.textContent.trim();
        
        const key = cell.dataset.cellKey;
        if (!selectedCells.has(key) && existingText) {
          allActivities.push({
            time_hour: hour,
            day_of_week: day,
            activity_text: existingText
          });
        }
      });
      
      allActivities.push(...activities);
      
      const response = await fetch(`${API_BASE}/evening`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activities: allActivities })
      });
      
      const result = await response.json();
      
      if (result.success) {
        selectedCells.forEach(key => {
          const [hour, day] = key.split('-');
          const cell = document.querySelector(`.activity-cell[data-cell-key="${key}"]`);
          if (cell) {
            const display = cell.querySelector('.activity-display');
            display.textContent = text;
          }
        });
        
        closeInputModal();
        setShowSaveModal(true);
        // 저장 성공 - 데이터 재로드 불필요 (스크롤 유지)
      } else {
        setErrorMessage('저장 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error('Error saving activities:', error);
      setErrorMessage('저장 중 오류가 발생했습니다.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const savePlanner = async (isAutoSave = false) => {
    // 현재 스크롤 위치 저장
    savedScrollPositionRef.current = window.scrollY || window.pageYOffset;
    
    const activities = [];
    
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
      console.error('Error saving evening planner:', error);
      if (!isAutoSave) {
        setErrorMessage('저장 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    }
  };

  const autoSave = async () => {
    // 자동 저장은 모달이 열려있지 않을 때만 실행
    if (!showInputModal && !showHistoryModal && planner) {
      await savePlanner(true);
    }
  };

  const showHistory = async () => {
    setShowHistoryModal(true);
    try {
      const response = await fetch(`${API_BASE}/evening/history`);
      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const loadHistoryItem = async (historyId) => {
    try {
      const response = await fetch(`${API_BASE}/evening/history/${historyId}`);
      const historyItem = await response.json();
      
      const activities = JSON.parse(historyItem.snapshot_data);
      setPlanner({
        id: historyItem.evening_planner_id,
        activities: activities
      });
      setShowHistoryModal(false);
      } catch (error) {
        console.error('Error loading history item:', error);
        setErrorMessage('이력을 불러오는 중 오류가 발생했습니다.');
        setShowErrorModal(true);
      }
    };

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        if (showInputModal) {
          e.preventDefault();
          closeInputModal();
          return;
        }
        if (showHistoryModal) {
          e.preventDefault();
          setShowHistoryModal(false);
          return;
        }
      }
      
      const isModifierPressed = e.metaKey || e.ctrlKey;
      const isShiftPressed = e.shiftKey;
      
      if (!isModifierPressed) return;
      
      if ((showInputModal || showHistoryModal)) {
        return;
      }
      
      if ((e.key === 's' || e.key === 'S') && isShiftPressed) {
        e.preventDefault();
        savePlanner(false);
        return;
      }
      
      if ((e.key === 'l' || e.key === 'L') && isShiftPressed) {
        e.preventDefault();
        loadPlanner();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showInputModal, showHistoryModal]);

  if (!planner) {
    return <div className="loading">로딩 중...</div>;
  }

  const days = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
  const hours = [17, 18, 19, 20, 21, 22, 23, 24];

  return (
    <>
      <header className="page-header">
        <div className="header-controls">
          <div>
            <h2>Evening Planner</h2>
            <p>저녁 시간대 루틴을 계획하세요</p>
          </div>
          <div>
            <button className="btn btn-secondary" onClick={showHistory}>이력 보기</button>
            <button className="btn btn-primary" onClick={() => savePlanner(false)}>저장하기</button>
            <div className="keyboard-hint">
              <span className="hint-text">💡 단축키: <kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd> 저장, <kbd>⌘/Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd> 불러오기</span>
            </div>
          </div>
        </div>
      </header>

      <div className="planner-container">
        <div className="planner-box">
          <div className="planner-title">EVENING PLANNER</div>
          <div className="time-table-label">Time table</div>
          <div className="selection-hint">💡 셀을 클릭하거나 드래그하여 선택하세요</div>
          
          <div className="week-header">
            <div></div>
            {days.slice(1).map((day, idx) => (
              <div key={idx} className="day-label">{day}</div>
            ))}
          </div>
          
          {hours.map((hour) => (
            <div key={hour} className="time-row">
              <div className="time-label">{String(hour).padStart(2, '0')}:00</div>
              {[1, 2, 3, 4, 5].map((day) => {
                const activity = planner.activities?.find(
                  a => a.time_hour === hour && a.day_of_week === day
                );
                const cellKey = `${hour}-${day}`;
                
                return (
                  <div
                    key={day}
                    className="activity-cell"
                    data-hour={hour}
                    data-day={day}
                    data-cell-key={cellKey}
                    onMouseDown={(e) => handleCellMouseDown(e, hour, day)}
                    onMouseEnter={(e) => handleCellMouseEnter(e, hour, day)}
                  >
                    <div className="activity-display">{activity?.activity_text || ''}</div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 입력 모달 */}
      {showInputModal && (
        <div className="modal" onClick={(e) => e.target.className === 'modal' && closeInputModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>활동 입력</h3>
              <span className="modal-close" onClick={closeInputModal}>&times;</span>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '16px', color: 'var(--muted)', fontSize: '14px' }}>
                선택된 <span>{selectedCells.size}</span>개의 셀에 동일한 활동이 저장됩니다.
              </p>
              <input
                type="text"
                className="activity-input-modal"
                placeholder="활동을 입력하세요..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && saveSelectedCells()}
                autoFocus
              />
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={closeInputModal}>취소</button>
                <button 
                  className="btn btn-primary" 
                  onClick={saveSelectedCells}
                  disabled={saving}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 이력 모달 */}
      {showHistoryModal && (
        <div className="modal" onClick={(e) => e.target.className === 'modal' && setShowHistoryModal(false)}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Evening Planner 이력</h3>
              <span className="modal-close" onClick={() => setShowHistoryModal(false)}>&times;</span>
            </div>
            <div className="modal-body">
              {history.length === 0 ? (
                <div className="loading">이력이 없습니다.</div>
              ) : (
                history.map((item) => {
                  const date = new Date(item.created_at);
                  const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                  
                  return (
                    <div 
                      key={item.id} 
                      className="history-item" 
                      onClick={() => loadHistoryItem(item.id)}
                    >
                      <div className="history-item-header">
                        <div className="history-date">{dateStr}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

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

export default EveningPlanner;
