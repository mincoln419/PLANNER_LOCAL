import express from 'express';
import pool from '../database/db.js';

const router = express.Router();

// 모든 포모도로 세션 조회
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pomodoro_sessions ORDER BY created_at DESC LIMIT 50'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching pomodoro sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 포모도로 세션 생성
router.post('/', async (req, res) => {
  try {
    const { task_name, duration_minutes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO pomodoro_sessions (task_name, duration_minutes, started_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING *`,
      [task_name || '', duration_minutes || 25]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error creating pomodoro session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 포모도로 세션 완료
router.put('/:id/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `UPDATE pomodoro_sessions
       SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error completing pomodoro session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 포모도로 세션 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM pomodoro_sessions WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pomodoro session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
