import { config } from 'dotenv'
import postgres from 'postgres'
config()
export const sql = postgres({
  host:     process.env.PG_HOST,
  port:     Number(process.env.PG_PORT || 5432),
  database: process.env.PG_DATABASE,
  username: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  max:      10,
})