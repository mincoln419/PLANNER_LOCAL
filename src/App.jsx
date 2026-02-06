import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DailyPlanner from './pages/DailyPlanner';
import EveningPlanner from './pages/EveningPlanner';
import Pomodoro from './pages/Pomodoro';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/daily-planner" element={<DailyPlanner />} />
        <Route path="/evening-planner" element={<EveningPlanner />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
      </Routes>
    </Layout>
  );
}

export default App;
