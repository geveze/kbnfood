/**
 * Manual Database Configuration
 * 
 * Bu dosya, Manus sistem tarafından yönetilen DATABASE_URL yerine,
 * manuel olarak veritabanı bağlantı bilgilerini belirtmek için kullanılır.
 * 
 * Kullanım:
 * 1. ENABLE_MANUAL_DB_CONFIG değerini true olarak ayarla
 * 2. Veritabanı bilgilerini gir (host, user, password, database)
 * 3. Dev server'ı restart et
 */

export interface ManualDbConfig {
  enabled: boolean;
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: {
    rejectUnauthorized: boolean;
    minVersion?: string;
  };
}

/**
 * MANUEL VERİTABANI BAĞLANTISI
 * 
 * Yeni TiDB Cloud veritabanı bilgilerini buraya girin:
 */
export const manualDbConfig: ManualDbConfig = {
  // true: Manuel bağlantı kullan | false: Sistem DATABASE_URL'yi kullan
  enabled: true,

  // Yeni TiDB Cloud Bilgileri
  host: 'gateway01.eu-central-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '2UkMMcfEvYMQNtS.root',
  password: 'J7XCavsp0B0TpoZe',
  database: 'keban_app',

  // SSL Ayarları (TiDB Cloud için gerekli)
  ssl: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
};

/**
 * Manuel bağlantı URL'sini oluştur
 */
export function buildManualConnectionString(): string {
  if (!manualDbConfig.enabled) {
    throw new Error('Manual DB config is not enabled');
  }

  const { host, port, user, password, database, ssl } = manualDbConfig;
  const sslParam = ssl ? `?ssl={"rejectUnauthorized":${ssl.rejectUnauthorized}}` : '';
  
  return `mysql://${user}:${password}@${host}:${port}/${database}${sslParam}`;
}

/**
 * Manuel bağlantı bilgilerini doğrula
 */
export function validateManualDbConfig(): boolean {
  if (!manualDbConfig.enabled) {
    return false;
  }

  const required = ['host', 'port', 'user', 'password', 'database'];
  for (const field of required) {
    if (!manualDbConfig[field as keyof ManualDbConfig]) {
      console.error(`[DB Config] Missing required field: ${field}`);
      return false;
    }
  }

  return true;
}
