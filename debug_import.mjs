import XLSX from 'xlsx';

// Excel dosyasını oku
const workbook = XLSX.readFile('/home/ubuntu/upload/ordunovada.xlsx');
const sheet = workbook.Sheets['Sayfa1'];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('Toplam satır:', data.length);
console.log('\nİlk satır:');
console.log(data[0]);

console.log('\nSütun adları:');
console.log(Object.keys(data[0]));

console.log('\nDönem değerleri:');
data.forEach((row, idx) => {
  console.log(`${idx}: "${row['Değerlendirme Dönemi']}" (type: ${typeof row['Değerlendirme Dönemi']})`);
});
