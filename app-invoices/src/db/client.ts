import { drizzle } from "drizzle-orm/node-postgres";

export const db = drizzle(process.env.DaTABASE_URL, {
  casing: 'snake_case',
})