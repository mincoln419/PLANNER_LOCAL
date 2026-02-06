import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

function Layout({ children }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>⏰ 플래너</h1>
        </div>
        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
            <span className="nav-icon">📊</span>
            <span className="nav-text">대시보드</span>
          </Link>
          <Link 
            to="/daily-planner" 
            className={`nav-item ${isActive('/daily-planner') ? 'active' : ''}`}
          >
            <span className="nav-icon">📅</span>
            <span className="nav-text">Daily Planner</span>
          </Link>
          <Link 
            to="/evening-planner" 
            className={`nav-item ${isActive('/evening-planner') ? 'active' : ''}`}
          >
            <span className="nav-icon">🌙</span>
            <span className="nav-text">Evening Planner</span>
          </Link>
          <Link 
            to="/pomodoro" 
            className={`nav-item ${isActive('/pomodoro') ? 'active' : ''}`}
          >
            <span className="nav-icon">🍅</span>
            <span className="nav-text">포모도로 타이머</span>
          </Link>
        </nav>
      </aside>

      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;
