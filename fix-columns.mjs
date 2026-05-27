import mysql from 'mysql2/promise';
import { URL } from 'url';

async function fixColumns() {
  const dbUrl = new URL(process.env.DATABASE_URL);
  const connection = await mysql.createConnection({
    host: dbUrl.hostname,
    user: dbUrl.username,
    password: dbUrl.password,
    database: dbUrl.pathname.slice(1),
    port: parseInt(dbUrl.port) || 3306,
    ssl: { rejectUnauthorized: true },
  });

  console.log('Checking current column names...');
  const [columns] = await connection.execute('DESCRIBE positions');
  columns.forEach(col => console.log(`  ${col.Field} (${col.Type})`));

  // Rename displayName to display_name and isActive to is_active
  console.log('\nRenaming columns to snake_case...');
  
  try {
    await connection.execute('ALTER TABLE positions CHANGE COLUMN `displayName` `display_name` varchar(255)');
    console.log('✓ Renamed displayName -> display_name');
  } catch (e) {
    console.log('  displayName rename failed:', e.message);
    // Try if already snake_case
    try {
      await connection.execute('ALTER TABLE positions CHANGE COLUMN `display_name` `display_name` varchar(255)');
      console.log('  display_name already exists');
    } catch (e2) {
      console.log('  Both failed, trying to add column...');
    }
  }

  try {
    await connection.execute('ALTER TABLE positions CHANGE COLUMN `isActive` `is_active` boolean DEFAULT true');
    console.log('✓ Renamed isActive -> is_active');
  } catch (e) {
    console.log('  isActive rename failed:', e.message);
  }

  console.log('\nVerifying...');
  const [newColumns] = await connection.execute('DESCRIBE positions');
  newColumns.forEach(col => console.log(`  ${col.Field} (${col.Type})`));

  const [data] = await connection.execute('SELECT * FROM positions LIMIT 2');
  console.log('\nData check:');
  data.forEach(row => console.log(row));

  await connection.end();
}

fixColumns().catch(console.error);
