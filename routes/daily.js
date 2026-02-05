const express = require('express');
const router = express.Router();
const pool = require('../database/db');

// 모든 Daily Planner 조회
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM daily_planners ORDER BY date DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily planners:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 특정 날짜의 Daily Planner 조회
router.get('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Daily Planner 기본 정보
    const plannerResult = await pool.query(
      'SELECT * FROM daily_planners WHERE date = $1',
      [date]
    );
    
    if (plannerResult.rows.length === 0) {
      return res.json(null);
    }
    
    const planner = plannerResult.rows[0];
    
    // Timeline 조회
    const timelineResult = await pool.query(
      'SELECT * FROM daily_timelines WHERE daily_planner_id = $1 ORDER BY time_hour',
      [planner.id]
    );
    
    // Todo 조회
    const todoResult = await pool.query(
      'SELECT * FROM daily_todos WHERE daily_planner_id = $1 ORDER BY priority, order_index',
      [planner.id]
    );
    
    // Water 조회
    const waterResult = await pool.query(
      'SELECT * FROM daily_waters WHERE daily_planner_id = $1 ORDER BY cup_number',
      [planner.id]
    );
    
    // Meal 조회
    const mealResult = await pool.query(
      'SELECT * FROM daily_meals WHERE daily_planner_id = $1',
      [planner.id]
    );
    
    res.json({
      ...planner,
      timelines: timelineResult.rows,
      todos: todoResult.rows,
      waters: waterResult.rows,
      meals: mealResult.rows
    });
  } catch (error) {
    console.error('Error fetching daily planner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Daily Planner 생성 또는 업데이트
router.post('/', async (req, res) => {
  try {
    const { date, goal, timelines, todos, waters, meals } = req.body;
    
    await pool.query('BEGIN');
    
    // Daily Planner 생성 또는 업데이트
    const plannerResult = await pool.query(
      `INSERT INTO daily_planners (date, goal, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (date) 
       DO UPDATE SET goal = $2, updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [date, goal]
    );
    
    const plannerId = plannerResult.rows[0].id;
    
    // Timeline 업데이트
    if (timelines && Array.isArray(timelines)) {
      await pool.query(
        'DELETE FROM daily_timelines WHERE daily_planner_id = $1',
        [plannerId]
      );
      
      for (const timeline of timelines) {
        await pool.query(
          `INSERT INTO daily_timelines (daily_planner_id, time_hour, plan_text, actual_text)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (daily_planner_id, time_hour)
           DO UPDATE SET plan_text = $3, actual_text = $4`,
          [plannerId, timeline.time_hour, timeline.plan_text || '', timeline.actual_text || '']
        );
      }
    }
    
    // Todo 업데이트
    if (todos && Array.isArray(todos)) {
      await pool.query(
        'DELETE FROM daily_todos WHERE daily_planner_id = $1',
        [plannerId]
      );
      
      for (const todo of todos) {
        await pool.query(
          `INSERT INTO daily_todos (daily_planner_id, priority, task_text, completed, order_index)
           VALUES ($1, $2, $3, $4, $5)`,
          [plannerId, todo.priority, todo.task_text || '', todo.completed || false, todo.order_index || 0]
        );
      }
    }
    
    // Water 업데이트
    if (waters && Array.isArray(waters)) {
      await pool.query(
        'DELETE FROM daily_waters WHERE daily_planner_id = $1',
        [plannerId]
      );
      
      for (const water of waters) {
        await pool.query(
          `INSERT INTO daily_waters (daily_planner_id, cup_number, completed)
           VALUES ($1, $2, $3)
           ON CONFLICT (daily_planner_id, cup_number)
           DO UPDATE SET completed = $3`,
          [plannerId, water.cup_number, water.completed || false]
        );
      }
    }
    
    // Meal 업데이트
    if (meals && Array.isArray(meals)) {
      await pool.query(
        'DELETE FROM daily_meals WHERE daily_planner_id = $1',
        [plannerId]
      );
      
      for (const meal of meals) {
        await pool.query(
          `INSERT INTO daily_meals (daily_planner_id, meal_type, meal_text)
           VALUES ($1, $2, $3)
           ON CONFLICT (daily_planner_id, meal_type)
           DO UPDATE SET meal_text = $3`,
          [plannerId, meal.meal_type, meal.meal_text || '']
        );
      }
    }
    
    await pool.query('COMMIT');
    res.json({ success: true, id: plannerId });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error saving daily planner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Daily Planner 삭제
router.delete('/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    await pool.query('DELETE FROM daily_planners WHERE date = $1', [date]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting daily planner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
