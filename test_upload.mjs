import fs from 'fs';
import sharp from 'sharp';

// Test resim base64'ü oku
const base64Full = fs.readFileSync('/tmp/test_image_base64.txt', 'utf-8');
const base64Data = base64Full.split(',')[1];

console.log('[DEBUG] Base64 string uzunluğu:', base64Full.length);
console.log('[DEBUG] Base64 data uzunluğu:', base64Data.length);

// Buffer'a çevir
const buffer = Buffer.from(base64Data, 'base64');
console.log('[DEBUG] Buffer boyutu:', buffer.length, 'bytes');

// Sharp ile resmi analiz et
const { data, info } = await sharp(buffer)
  .resize(100, 100, { fit: 'cover' })
  .raw()
  .toBuffer({ resolveWithObject: true });

console.log('[DEBUG] Resim boyutu (100x100):', info.width, 'x', info.height);

// Beyaz piksel sayısını hesapla
let whitePixels = 0;
for (let i = 0; i < data.length; i += 3) {
  if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
    whitePixels++;
  }
}

const totalPixels = 100 * 100;
const whitePercentage = (whitePixels / totalPixels) * 100;

console.log('[DEBUG] Beyaz piksel yüzdesi:', whitePercentage.toFixed(2) + '%');
console.log('[DEBUG] Resim sonucu:', whitePercentage > 50 ? 'BEYAZ RESİM (REDDEDİLDİ)' : 'GERÇEK RESİM (KABUL EDİLDİ)');
