import fs from 'fs';
import path from 'path';

// Drizzle schema'sını oku
const schemaPath = '/home/ubuntu/keban_food_performance/drizzle/schema.ts';
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Tüm CREATE TABLE statements'i oluştur
// Drizzle schema'sından SQL oluşturmak için drizzle-kit kullan
console.log('📋 Drizzle schema analiz ediliyor...');

// Tablo tanımlarını çıkar
const tableMatches = schemaContent.match(/export const (\w+) = mysqlTable\("(\w+)"/g);
if (!tableMatches) {
  console.log('❌ Tablo tanımları bulunamadı');
  process.exit(1);
}

console.log(`✓ ${tableMatches.length} tablo bulundu`);

// Drizzle introspect kullan (veritabanından schema al)
console.log('\n📡 Drizzle introspect çalıştırılıyor...');

import { execSync } from 'child_process';

try {
  // Drizzle push kullan (tüm tabloları oluştur)
  console.log('📦 Drizzle push çalıştırılıyor...');
  const result = execSync('cd /home/ubuntu/keban_food_performance && pnpm drizzle-kit push', {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024
  });
  console.log(result);
} catch (e) {
  console.log('⚠️  Drizzle push hatası (bağlantı sorunu olabilir):');
  console.log(e.message.substring(0, 200));
}

