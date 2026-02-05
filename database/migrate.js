require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'planner_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✅ 데이터베이스 마이그레이션이 완료되었습니다.');
  } catch (error) {
    console.error('❌ 마이그레이션 오류:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
