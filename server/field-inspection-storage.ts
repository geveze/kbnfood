import { storagePut } from "./storage";
import { randomBytes } from "crypto";
import sharp from "sharp";

/**
 * Base64 string'i Buffer'a çevir
 */
function base64ToBuffer(base64String: string): Buffer {
  // data:image/jpeg;base64, formatını kaldır
  const base64Data = base64String.split(",")[1] || base64String;
  console.log(`[DEBUG] Base64 string uzunluğu: ${base64String.length}`);
  console.log(`[DEBUG] Base64 data uzunluğu: ${base64Data.length}`);
  console.log(`[DEBUG] Base64 başlangıcı: ${base64String.substring(0, 50)}...`);
  const buffer = Buffer.from(base64Data, "base64");
  console.log(`[DEBUG] Buffer boyutu: ${buffer.length} bytes`);
  return buffer;
}

/**
 * Resimin beyaz olup olmadığını kontrol et
 */
async function isImageWhite(photoBuffer: Buffer): Promise<boolean> {
  try {
    // Resimi küçült ve analiz et
    const { data, info } = await sharp(photoBuffer)
      .resize(100, 100, { fit: 'cover' })
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Beyaz piksel sayısını hesapla (R, G, B > 240)
    let whitePixels = 0;
    for (let i = 0; i < data.length; i += 3) {
      if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
        whitePixels++;
      }
    }

    const totalPixels = (100 * 100);
    const whitePercentage = (whitePixels / totalPixels) * 100;
    
    console.log(`[DEBUG] Beyaz piksel yüzdesi: ${whitePercentage.toFixed(2)}%`);
    
    // %50'den fazla beyaz piksel varsa beyaz resim olarak işaretle
    return whitePercentage > 50;
  } catch (error) {
    console.error("Resim analizi hatası:", error);
    return false;
  }
}

/**
 * Base64 string'den MIME type'ını çıkar
 */
function getMimeTypeFromBase64(base64String: string): string {
  const match = base64String.match(/^data:([^;]+);base64,/);
  return match ? match[1] : "image/jpeg";
}

/**
 * Denetim fotoğrafını S3'e yükle
 * @param base64Photo Base64 formatında fotoğraf
 * @param inspectionId Denetim ID'si
 * @param questionId Soru ID'si
 * @param photoIndex Fotoğraf indeksi (1-4)
 * @returns Yüklenen fotoğrafın URL'si
 */
export async function uploadInspectionPhoto(
  base64Photo: string,
  inspectionId: number,
  questionId: number,
  photoIndex: number
): Promise<string> {
  try {
    console.log(`[DEBUG] Resim yükleme başladı - inspectionId: ${inspectionId}, questionId: ${questionId}, photoIndex: ${photoIndex}`);
    console.log(`[DEBUG] Base64 string uzunluğu: ${base64Photo.length}`);
    console.log(`[DEBUG] Base64 string başlangıcı: ${base64Photo.substring(0, 100)}...`);
    
    // Fotoğrafı Buffer'a çevir
    const photoBuffer = base64ToBuffer(base64Photo);
    console.log(`[DEBUG] Buffer boyutu: ${photoBuffer.length} bytes`);
    
    // MIME type'ını belirle
    const mimeType = getMimeTypeFromBase64(base64Photo);
    console.log(`[DEBUG] MIME type: ${mimeType}`);
    
    // Beyaz resim doğrulaması devre dışı bırakıldı - tüm resimleri kabul et
    // const isWhite = await isImageWhite(photoBuffer);
    // if (isWhite) {
    //   console.warn(`[WARN] Beyaz resim algılandı - yükleme iptal edildi`);
    //   throw new Error("Fotoğraf çekilmemiş veya çok açık. Lütfen daha iyi bir fotoğraf çekiniz.");
    // }
    
    // Dosya adını oluştur (random suffix ile)
    const randomSuffix = randomBytes(8).toString("hex");
    const fileKey = `field-inspections/${inspectionId}/question-${questionId}/photo-${photoIndex}-${randomSuffix}.jpg`;
    
    // S3'e yükle
    const { url } = await storagePut(fileKey, photoBuffer, mimeType);
    console.log(`[DEBUG] S3'e yüklendi - URL: ${url}`);
    
    return url;
  } catch (error) {
    console.error("Fotoğraf S3'e yüklenirken hata oluştu:", error);
    throw new Error("Fotoğraf yüklenirken hata oluştu");
  }
}

/**
 * Denetim fotoğraflarını toplu olarak S3'e yükle
 * @param photos Base64 formatında fotoğraflar
 * @param inspectionId Denetim ID'si
 * @param questionId Soru ID'si
 * @returns Yüklenen fotoğrafların URL'leri
 */
export async function uploadInspectionPhotos(
  photos: string[],
  inspectionId: number,
  questionId: number
): Promise<string[]> {
  const uploadedUrls: string[] = [];
  
  for (let i = 0; i < photos.length && i < 3; i++) {
    try {
      const url = await uploadInspectionPhoto(photos[i], inspectionId, questionId, i + 1);
      uploadedUrls.push(url);
    } catch (error) {
      console.error(`Fotoğraf ${i + 1} yüklenirken hata oluştu:`, error);
      // Hata olsa da devam et, diğer fotoğrafları yükle
    }
  }
  
  return uploadedUrls;
}
