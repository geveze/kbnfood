import fs from 'fs';

// Drizzle schema dosyasını oku
let schema = fs.readFileSync('drizzle/schema.ts', 'utf-8');

// users tablosu tanımını bul ve güncelle
const oldUsers = `export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Manus OAuth için
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth' veya 'local'
  role: mysqlEnum("role", ["user", "admin", "branch_manager", "operations_manager", "region_manager"]).default("user").notNull(),`;

const newUsers = `export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).unique(), // Manus OAuth için
  username: varchar("username", { length: 255 }), // Kullanıcı adı (local login)
  passwordHash: varchar("passwordHash", { length: 255 }), // Şifre hash (bcrypt)
  isActive: tinyint("isActive").default(1), // Kullanıcı aktif mi
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }), // 'oauth' veya 'local'
  role: mysqlEnum("role", ["user", "admin", "branch_manager", "operations_manager", "region_manager"]).default("user").notNull(),`;

schema = schema.replace(oldUsers, newUsers);

// Dosyayı yaz
fs.writeFileSync('drizzle/schema.ts', schema, 'utf-8');

console.log('✓ Drizzle schema.ts güncellendi');
