import { drizzle } from 'drizzle-orm/mysql2/promise';
import mysql from 'mysql2/promise';
import * as schema from './drizzle/schema.ts';

const connection = await mysql.createConnection({
  host: 'gateway04.us-east-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: '46m8FvVm7HSsc1z.root',
  password: 'Ae0Ii72ep2Bkl3oN6VNj',
  database: '6XmnMHSGkmqmcvGw6sxZ3M',
  ssl: { rejectUnauthorized: false },
});

const db = drizzle(connection, { schema });

try {
  const categories = await db.select().from(schema.fieldInspectionCategories);
  console.log('Categories:', categories.length);
  console.log('First category:', categories[0]);
} catch (error) {
  console.error('Error:', error.message);
}

process.exit(0);
