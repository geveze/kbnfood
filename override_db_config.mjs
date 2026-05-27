import fs from 'fs';
import path from 'path';

// Yeni DATABASE_URL
const newDatabaseUrl = 'mysql://2UkMMcfEvYMQNtS.root:pRancyW9vAymmp8c@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/keban_app';

// .env.local dosyasını oluştur (dev server bunu kullanacak)
const envLocalPath = path.join('/home/ubuntu/keban_food_performance', '.env.local');

const envContent = `# Yeni TiDB Cloud Veritabanı Bağlantısı
DATABASE_URL=${newDatabaseUrl}
`;

fs.writeFileSync(envLocalPath, envContent, 'utf-8');
console.log('✅ .env.local dosyası oluşturuldu');
console.log(`📝 DATABASE_URL: ${newDatabaseUrl}`);
console.log(`\n📁 Dosya: ${envLocalPath}`);
console.log('\n⚠️  Dev server'ı restart etmeniz gerekiyor');
