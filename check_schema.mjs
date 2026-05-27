import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  user: '2UkMMcfEvYMQNtS.root',
  password: 'pRancyW9vAymmp8c',
  database: 'keban_app',
  port: 4000,
  ssl: { rejectUnauthorized: false },
});

console.log('[Schema] Veritabanı tablo yapıları...\n');

// field_inspections şemasını kontrol et
console.log('field_inspections:');
try {
  const [columns] = await connection.execute(`DESCRIBE field_inspections`);
  columns.forEach((col) => {
    console.log(`  - ${col.Field}: ${col.Type}`);
  });
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// open_pif_evaluations şemasını kontrol et
console.log('\nopenPifEvaluations:');
try {
  const [columns] = await connection.execute(`DESCRIBE openPifEvaluations`);
  columns.forEach((col) => {
    console.log(`  - ${col.Field}: ${col.Type}`);
  });
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// weekly_plans şemasını kontrol et
console.log('\nweekly_plans:');
try {
  const [columns] = await connection.execute(`DESCRIBE weekly_plans`);
  columns.forEach((col) => {
    console.log(`  - ${col.Field}: ${col.Type}`);
  });
} catch (error) {
  console.error(`Error: ${error.message}`);
}

await connection.end();
console.log('\n[Done] Kontrol tamamlandı');
