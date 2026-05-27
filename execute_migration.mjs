import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const url = new URL(connectionString);
const config = {
  host: url.hostname,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(config);

async function executeMigration() {
  const conn = await pool.getConnection();
  try {
    const sql = `ALTER TABLE \`field_inspections\` ADD COLUMN \`restaurantManagerName\` varchar(255) AFTER \`inspectorEmail\``;
    
    console.log('Executing:', sql);
    await conn.query(sql);
    console.log('✅ restaurantManagerName column added successfully');
    
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('✅ Column already exists');
    } else {
      console.error('❌ Error:', err.message);
    }
  } finally {
    await conn.release();
    await pool.end();
  }
}

executeMigration();
