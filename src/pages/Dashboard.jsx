import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

const API_BASE = '/api';

function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [eveningPlanner, setEveningPlanner] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_BASE}/dashboard`);
      const data = await response.json();
      setDashboardData(data);
      
      if (data.evening_planner) {
        const eveningResponse = await fetch(`${API_BASE}/evening`);
        const eveningData = await eveningResponse.json();
        setEveningPlanner(eveningData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  const handlePlannerClick = (date) => {
    navigate(`/daily-planner?date=${date}`);
  };

  if (loading) {
    return <div className="loading">로딩 중...</div>;
  }

  const stats = dashboardData?.stats || {};
  const dailyPlanners = dashboardData?.daily_planners || [];

  const todoCompletion = stats.total_todos > 0 
    ? Math.round((stats.completed_todos / stats.total_todos) * 100)
    : 0;
  
  const waterCompletion = stats.total_waters > 0
    ? Math.round((stats.completed_waters / stats.total_waters) * 100)
    : 0;

  const days = ['', 'MON', 'TUE', 'WED', 'THU', 'FRI'];
  const hours = [17, 18, 19, 20, 21, 22, 23, 24];

  return (
    <>
      <header className="page-header">
        <h2>대시보드</h2>
        <p>Daily Planner 계획과 결과를 한눈에 확인하세요</p>
      </header>

      {/* 통계 카드 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.total_planners || 0}</div>
            <div className="stat-label">총 플래너</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <div className="stat-value">{todoCompletion}%</div>
            <div className="stat-label">Todo 완료율</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💧</div>
          <div className="stat-info">
            <div className="stat-value">{waterCompletion}%</div>
            <div className="stat-label">물 마시기 완료율</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🍅</div>
          <div className="stat-info">
            <div className="stat-value">{stats.pomodoro?.completed || 0}</div>
            <div className="stat-label">완료된 포모도로</div>
          </div>
        </div>
      </div>

      {/* 최근 Daily Planner 목록 */}
      <section className="section">
        <div className="section-header">
          <h3>최근 Daily Planner</h3>
          <Link to="/daily-planner" className="btn-link">전체 보기 →</Link>
        </div>
        <div className="planner-list">
          {dailyPlanners.length === 0 ? (
            <div className="loading">플래너가 없습니다. 새로 만들어보세요!</div>
          ) : (
            dailyPlanners.map((planner) => (
              <div 
                key={planner.date} 
                className="planner-card"
                onClick={() => handlePlannerClick(planner.date)}
              >
                <div className="planner-card-header">
                  <div className="planner-date">{formatDate(planner.date)}</div>
                </div>
                <div className="planner-goal">{planner.goal || '목표가 설정되지 않았습니다.'}</div>
                <div className="planner-stats">
                  <span>📅 {formatDate(planner.date)}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Evening Planner 미리보기 */}
      <section className="section">
        <div className="section-header">
          <h3>Evening Planner</h3>
          <Link to="/evening-planner" className="btn-link">수정하기 →</Link>
        </div>
        <div className="evening-preview">
          {!eveningPlanner || !eveningPlanner.activities || eveningPlanner.activities.length === 0 ? (
            <div className="loading">Evening Planner가 설정되지 않았습니다.</div>
          ) : (
            <>
              <div className="evening-preview-header">
                <div></div>
                {days.slice(1).map((day) => (
                  <div key={day} className="evening-preview-day">{day}</div>
                ))}
              </div>
              {hours.map((hour) => (
                <div key={hour} className="evening-preview-grid">
                  <div className="evening-preview-time">{String(hour).padStart(2, '0')}:00</div>
                  {[1, 2, 3, 4, 5].map((day) => {
                    const activity = eveningPlanner.activities.find(
                      a => a.time_hour === hour && a.day_of_week === day
                    );
                    return (
                      <div key={day} className="evening-preview-cell">
                        {activity?.activity_text || ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </>
          )}
        </div>
      </section>
    </>
  );
}

export default Dashboard;
