import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './electron/main/db/schema.ts',
  out: './resources/migrations',
  dialect: 'sqlite'
})
