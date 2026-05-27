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

console.log('📥 Şubeler çekiliyor...');

// Tüm şubeleri çek
const [branches] = await connection.execute('SELECT id, name, code FROM branches ORDER BY id');

console.log(`✅ ${branches.length} şube bulundu\n`);

// Standart şifre
const standardPassword = '123456';
const passwordHash = await bcrypt.hash(standardPassword, 10);

let createdCount = 0;
let skippedCount = 0;

// Her şube için kullanıcı oluştur
for (const branch of branches) {
  const username = `by${branch.code}`.toLowerCase();
  
  try {
    // Kullanıcı zaten var mı kontrol et
    const [existing] = await connection.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );
    
    if (existing.length > 0) {
      console.log(`⏭️  ${username} - Zaten mevcut (Atlandı)`);
      skippedCount++;
      continue;
    }
    
    // Yeni kullanıcı oluştur
    await connection.execute(
      `INSERT INTO users (username, passwordHash, name, email, loginMethod, role, branchId, isActive)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        username,                                    // username
        passwordHash,                                // passwordHash
        `${branch.name} Yöneticisi`,                // name
        `${username}@kebanfood.com`,                // email
        'local',                                     // loginMethod
        'branch_manager',                            // role
        branch.id,                                   // branchId
        true                                         // isActive
      ]
    );
    
    console.log(`✅ ${username} - Oluşturuldu (Şube: ${branch.name})`);
    createdCount++;
  } catch (error) {
    console.error(`❌ ${username} - Hata: ${error.message}`);
  }
}

console.log(`\n📊 Özet:`);
console.log(`   ✅ Oluşturulan: ${createdCount}`);
console.log(`   ⏭️  Atlanan: ${skippedCount}`);
console.log(`   📝 Standart Şifre: ${standardPassword}`);

await connection.end();
console.log('\n✨ İşlem tamamlandı!');
