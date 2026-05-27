import { getDb } from "./server/db.js";

const db = await getDb();
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.name, 'Byesenler')
});

console.log('Byesenler User:', JSON.stringify(user, null, 2));
