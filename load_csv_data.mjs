import mysql from 'mysql2/promise';
import fs from 'fs';
import csv from 'csv-parser';

async function loadCsvData() {
  let conn;
  try {
    console.log('📡 keban_app veritabanına bağlanıyor...\n');
    
    conn = await mysql.createConnection({
      host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
      port: 4000,
      user: '2UkMMcfEvYMQNtS.root',
      password: 'pRancyW9vAymmp8c',
      database: 'keban_app',
      ssl: { rejectUnauthorized: false, minVersion: 'TLSv1.2' }
    });
    
    console.log('✓ Bağlantı başarılı\n');
    
    // 1. Branches yükle
    console.log('📥 Branches yükleniyor...');
    const branches = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('/home/ubuntu/upload/branches_20260424_064439.csv')
        .pipe(csv())
        .on('data', (row) => branches.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`✓ ${branches.length} branch okundu`);
    
    // Branches tablosunu temizle
    await conn.execute('DELETE FROM branches');
    
    // Branches ekle
    let branchInserted = 0;
    for (const branch of branches) {
      try {
        await conn.execute(
          'INSERT INTO branches (id, name, code, region, manager, regionManagerId, address, phone, evaluationPeriod, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            branch.id,
            branch.name,
            branch.code,
            branch.region || null,
            branch.manager || null,
            branch.regionManagerId || null,
            branch.address || null,
            branch.phone || null,
            branch.evaluationPeriod || null,
            branch.status || 'active',
            branch.createdAt,
            branch.updatedAt
          ]
        );
        branchInserted++;
      } catch (e) {
        // Hata olsa da devam et
      }
    }
    console.log(`📊 ${branchInserted} branch eklendi\n`);
    
    // 2. Users yükle
    console.log('📥 Users yükleniyor...');
    const users = [];
    await new Promise((resolve, reject) => {
      fs.createReadStream('/home/ubuntu/upload/users_20260424_064429.csv')
        .pipe(csv())
        .on('data', (row) => users.push(row))
        .on('end', resolve)
        .on('error', reject);
    });
    
    console.log(`✓ ${users.length} user okundu`);
    
    // Users tablosunu temizle
    await conn.execute('DELETE FROM users');
    
    // Users ekle
    let userInserted = 0;
    for (const user of users) {
      try {
        await conn.execute(
          'INSERT INTO users (id, openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn, branchManager) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            user.id,
            user.openId || null,
            user.name || null,
            user.email || null,
            user.loginMethod || null,
            user.role || 'user',
            user.createdAt,
            user.updatedAt,
            user.lastSignedIn,
            user.branchManager || null
          ]
        );
        userInserted++;
      } catch (e) {
        // Hata olsa da devam et
      }
    }
    console.log(`📊 ${userInserted} user eklendi\n`);
    
    // Doğrulama
    const [[b]] = await conn.execute('SELECT COUNT(*) as cnt FROM branches');
    const [[u]] = await conn.execute('SELECT COUNT(*) as cnt FROM users');
    
    console.log('✅ Yükleme Tamamlandı!');
    console.log(`📊 Branches: ${b.cnt}`);
    console.log(`📊 Users: ${u.cnt}`);
    
    await conn.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ HATA:', error.message);
    if (conn) await conn.end();
    process.exit(1);
  }
}

loadCsvData();
