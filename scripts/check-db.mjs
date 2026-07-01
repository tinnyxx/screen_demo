import { config } from 'dotenv'
import { sql } from '../server/start.js'

config()

async function main() {
  const rows = await sql`SELECT 1 AS ok`
  console.log('Database connection OK:', rows)

  const admins = await sql`
    SELECT username, nickname
    FROM admin_tb
    ORDER BY id
    LIMIT 5
  `
  console.log('admin_tb sample:', admins)
}

main()
  .catch((error) => {
    console.error('Database connection failed:', error.message)
    process.exit(1)
  })
  .finally(async () => {
    await sql.end()
  })
