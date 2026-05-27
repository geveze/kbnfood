import fetch from 'node-fetch';

async function updateDatabaseUrl() {
  try {
    console.log('🔧 Manus API üzerinden DATABASE_URL güncellemesi yapılıyor...');
    
    const newDatabaseUrl = 'mysql://2UkMMcfEvYMQNtS.root:pRancyW9vAymmp8c@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/keban_app';
    
    // Manus Forge API endpoint (sistem secrets'i güncellemek için)
    const forgeApiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const forgeApiKey = process.env.BUILT_IN_FORGE_API_KEY;
    
    if (!forgeApiUrl || !forgeApiKey) {
      console.log('⚠️  Forge API credentials bulunamadı');
      console.log('\n📝 Manuel olarak DATABASE_URL güncellemesi gerekiyor:');
      console.log(`   DATABASE_URL=${newDatabaseUrl}`);
      process.exit(1);
    }
    
    console.log('✓ Forge API credentials bulundu');
    console.log(`📝 Yeni DATABASE_URL: ${newDatabaseUrl}`);
    
    // API çağrısı yapılabilir, ancak sistem secrets'i güncellemek için admin yetkisi gerekli
    console.log('\n⚠️  Sistem secrets'i güncellemek için admin yetkisi gerekli');
    console.log('📝 Lütfen Management UI üzerinden DATABASE_URL'yi güncelleyin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
}

updateDatabaseUrl();
