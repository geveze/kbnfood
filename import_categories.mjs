import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: 'Amazon RDS',
  authPlugins: {
    mysql_clear_password: () => () => process.env.DB_PASSWORD
  }
});

const categories = [
  { name: '1.IZGARA  / PİŞİRME', weight: 20.00, description: 'ÜRÜN STANDARTI' },
  { name: '2.KASA -  PAKET / PAZARYERİ', weight: 20.00, description: '' },
  { name: '3.RESTORAN TEMİZLİK VE DÜZEN', weight: 20.00, description: '' },
  { name: '4.EKİPMAN BAKIMLARI, GEREKLİ  EVRAKLAR  VE GIDA GÜVENLİĞİ', weight: 20.00, description: '' },
  { name: '5.RESTORAN HİZMET VE KALİTE STANDARTLARI', weight: 20.00, description: '' }
];

async function importCategories() {
  const conn = await pool.getConnection();
  try {
    // Delete existing categories
    await conn.query('DELETE FROM position_categories WHERE weight IS NOT NULL');
    
    // Insert new categories
    for (const cat of categories) {
      await conn.query(
        'INSERT INTO position_categories (name, weight, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
        [cat.name, cat.weight, cat.description]
      );
      console.log(`✅ Imported: ${cat.name} (${cat.weight}%)`);
    }
    
    console.log('\n✅ Tüm kategoriler başarıyla yüklendi!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await conn.release();
    await pool.end();
  }
}

importCategories();
