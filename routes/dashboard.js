import express from 'express';
import pool from '../database/db.js';

const router = express.Router();

// 대시보드 데이터 조회
router.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 최근 Daily Planner 조회
    let dailyPlannersQuery = 'SELECT * FROM daily_planners ORDER BY date DESC LIMIT 7';
    let dailyPlannersParams = [];
    
    if (startDate && endDate) {
      dailyPlannersQuery = 'SELECT * FROM daily_planners WHERE date BETWEEN $1 AND $2 ORDER BY date DESC';
      dailyPlannersParams = [startDate, endDate];
    }
    
    const dailyPlannersResult = await pool.query(dailyPlannersQuery, dailyPlannersParams);
    
    // 통계 계산
    const stats = {
      total_planners: dailyPlannersResult.rows.length,
      completed_todos: 0,
      total_todos: 0,
      completed_waters: 0,
      total_waters: 0
    };
    
    for (const planner of dailyPlannersResult.rows) {
      const todosResult = await pool.query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed FROM daily_todos WHERE daily_planner_id = $1',
        [planner.id]
      );
      
      const watersResult = await pool.query(
        'SELECT COUNT(*) as total, SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed FROM daily_waters WHERE daily_planner_id = $1',
        [planner.id]
      );
      
      if (todosResult.rows[0]) {
        stats.total_todos += parseInt(todosResult.rows[0].total) || 0;
        stats.completed_todos += parseInt(todosResult.rows[0].completed) || 0;
      }
      
      if (watersResult.rows[0]) {
        stats.total_waters += parseInt(watersResult.rows[0].total) || 0;
        stats.completed_waters += parseInt(watersResult.rows[0].completed) || 0;
      }
    }
    
    // Evening Planner 조회
    const eveningPlannerResult = await pool.query(
      'SELECT * FROM evening_planners WHERE is_active = TRUE LIMIT 1'
    );
    
    // 포모도로 세션 통계
    const pomodoroStatsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_sessions,
        SUM(CASE WHEN completed THEN 1 ELSE 0 END) as completed_sessions
       FROM pomodoro_sessions
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    
    res.json({
      daily_planners: dailyPlannersResult.rows,
      evening_planner: eveningPlannerResult.rows[0] || null,
      stats: {
        ...stats,
        pomodoro: {
          total: parseInt(pomodoroStatsResult.rows[0]?.total_sessions) || 0,
          completed: parseInt(pomodoroStatsResult.rows[0]?.completed_sessions) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
