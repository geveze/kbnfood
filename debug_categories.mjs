import mysql from 'mysql2/promise';
import XLSX from 'xlsx';

async function debug() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    // Veritabanındaki kategorileri göster
    console.log('📂 Veritabanındaki Kategoriler:');
    const [dbCategories] = await conn.execute(
      'SELECT id, name FROM field_inspection_categories'
    );
    for (const cat of dbCategories) {
      console.log(`   [${cat.id}] "${cat.name}"`);
    }
    
    // Excel'deki kategorileri göster
    console.log('\n📋 Excel\'deki Kategoriler:');
    const workbook = XLSX.readFile('/home/ubuntu/upload/Sorulistesi.xlsx');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    const excelCategories = new Set();
    for (const row of data) {
      const cat = row['Kategori'] || row['Category'] || '';
      if (cat) excelCategories.add(cat);
    }
    
    for (const cat of Array.from(excelCategories).sort()) {
      console.log(`   "${cat}"`);
    }
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

debug();
