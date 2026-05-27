import mysql from 'mysql2/promise';
import * as fs from 'fs';

const DATABASE_URL = process.env.DATABASE_URL;

async function runMigration() {
  let connection;
  try {
    // Parse DATABASE_URL
    const url = new URL(DATABASE_URL.replace('mysql://', 'mysql2://'));
    
    connection = await mysql.createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
      ssl: {
        rejectUnauthorized: false
      }
    });

    const sql = fs.readFileSync('./drizzle/migrations/0009_weekly_plans.sql', 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    
    console.log('✓ Migration başarıyla uygulandı');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('✓ Tablo zaten var');
      process.exit(0);
    } else {
      console.error('✗ Hata:', error.message);
      process.exit(1);
    }
  } finally {
    if (connection) await connection.end();
  }
}

runMigration();
