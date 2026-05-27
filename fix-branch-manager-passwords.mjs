import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// DATABASE_URL format: mysql://user:password@host:port/database
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// URL parse et
const url = new URL(dbUrl);

// SSL sertifikasını indir (TiDB Cloud için gerekli)
const connection = await mysql.createConnection({
  host: url.hostname,
  port: url.port || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1),
  ssl: {
    rejectUnauthorized: false,
  },
});

console.log('🔧 Şube yöneticilerinin şifreleri düzeltiliyor...\n');

// Tüm şube yöneticilerini çek
const [branchManagers] = await connection.execute(
  'SELECT id, username FROM users WHERE role = ?',
  ['branch_manager']
);

console.log(`📝 ${branchManagers.length} şube yöneticisi bulundu\n`);

// Standart şifre
const standardPassword = '123456';

let updatedCount = 0;

// Her şube yöneticisinin şifresi hash'le ve güncelle
for (const manager of branchManagers) {
  try {
    // Şifre hash'le (bcrypt 10 rounds)
    const passwordHash = await bcrypt.hash(standardPassword, 10);
    
    // Veritabanında güncelle
    await connection.execute(
      'UPDATE users SET passwordHash = ? WHERE id = ?',
      [passwordHash, manager.id]
    );
    
    console.log(`✅ ${manager.username} - Şifre güncellendi`);
    updatedCount++;
  } catch (error) {
    console.error(`❌ ${manager.username} - Hata: ${error.message}`);
  }
}

console.log(`\n📊 Özet:`);
console.log(`   ✅ Güncellenen: ${updatedCount}`);
console.log(`   📝 Standart Şifre: ${standardPassword}`);

await connection.end();
console.log('\n✨ İşlem tamamlandı!');
console.log('\n💡 Tüm şube yöneticileri şimdi 123456 şifresi ile giriş yapabilir.');
