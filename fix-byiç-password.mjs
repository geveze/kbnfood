import bcrypt from "bcrypt";
import mysql from "mysql2/promise";

const username = "byi̇aç";
const password = "123456";

async function fixPassword() {
  console.log(`Fixing password for user: ${username}`);

  // Hash şifreyi
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log(`Hashed password: ${hashedPassword}`);

  // Veritabanı bağlantısı
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "keban",
  });

  // Veritabanında güncelle
  const [result] = await connection.execute(
    "UPDATE users SET password = ? WHERE username = ?",
    [hashedPassword, username]
  );

  console.log(`Updated ${result.affectedRows} user(s)`);
  await connection.end();
}

fixPassword().catch(console.error);
