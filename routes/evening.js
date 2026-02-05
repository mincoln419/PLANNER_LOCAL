const express = require('express');
const router = express.Router();
const pool = require('../database/db');

// 현재 활성화된 Evening Planner 조회
router.get('/', async (req, res) => {
  try {
    const plannerResult = await pool.query(
      'SELECT * FROM evening_planners WHERE is_active = TRUE LIMIT 1'
    );
    
    if (plannerResult.rows.length === 0) {
      return res.json(null);
    }
    
    const planner = plannerResult.rows[0];
    
    // Activities 조회
    const activitiesResult = await pool.query(
      'SELECT * FROM evening_activities WHERE evening_planner_id = $1 ORDER BY time_hour, day_of_week',
      [planner.id]
    );
    
    res.json({
      ...planner,
      activities: activitiesResult.rows
    });
  } catch (error) {
    console.error('Error fetching evening planner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Evening Planner 생성 또는 업데이트
router.post('/', async (req, res) => {
  try {
    const { activities } = req.body;
    
    await pool.query('BEGIN');
    
    // 기존 활성화된 플래너 비활성화 (active_key를 NULL로 설정)
    await pool.query(
      'UPDATE evening_planners SET is_active = FALSE, active_key = NULL WHERE is_active = TRUE'
    );
    
    // 새 플래너 생성 (active_key = 1로 설정하여 UNIQUE 제약조건 활용)
    const plannerResult = await pool.query(
      'INSERT INTO evening_planners (is_active, active_key) VALUES (TRUE, 1) RETURNING id',
      []
    );
    
    const plannerId = plannerResult.rows[0].id;
    
    // Activities 저장
    if (activities && Array.isArray(activities)) {
      for (const activity of activities) {
        if (activity.activity_text && activity.activity_text.trim()) {
          await pool.query(
            `INSERT INTO evening_activities (evening_planner_id, time_hour, day_of_week, activity_text)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (evening_planner_id, time_hour, day_of_week)
             DO UPDATE SET activity_text = $4`,
            [plannerId, activity.time_hour, activity.day_of_week, activity.activity_text]
          );
        } else {
          // 빈 활동은 삭제
          await pool.query(
            'DELETE FROM evening_activities WHERE evening_planner_id = $1 AND time_hour = $2 AND day_of_week = $3',
            [plannerId, activity.time_hour, activity.day_of_week]
          );
        }
      }
    }
    
    // 이력 저장
    const snapshotResult = await pool.query(
      'SELECT * FROM evening_activities WHERE evening_planner_id = $1',
      [plannerId]
    );
    
    await pool.query(
      'INSERT INTO evening_planner_history (evening_planner_id, snapshot_data) VALUES ($1, $2)',
      [plannerId, JSON.stringify(snapshotResult.rows)]
    );
    
    await pool.query('COMMIT');
    res.json({ success: true, id: plannerId });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving evening planner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Evening Planner 이력 조회
router.get('/history', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT h.*, p.created_at as planner_created_at
       FROM evening_planner_history h
       JOIN evening_planners p ON h.evening_planner_id = p.id
       ORDER BY h.created_at DESC
       LIMIT 50`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching evening planner history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 이력 조회
router.get('/history/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM evening_planner_history WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'History not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching evening planner history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
