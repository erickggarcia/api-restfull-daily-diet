import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/app.ts',
    'src/database.ts',
    'src/server.ts',
    'src/@types/knex.d.ts',
    'src/middlewares/check-session-id-exists.ts',
    'src/routes/meals.ts',
    'src/routes/users.ts',
    'src/db/migrations/20230906012341_create-users.ts',
    'src/db/migrations/20230909184244_create-id-session.ts',
    'src/db/migrations/20230911165502_create-meals.ts',
    'src/db/migrations/20230911171147_create-foreign-key-at-meals.ts',
  ],
  outDir: 'build',
  loader: {
    '.db': 'file',
  },
  format: ['cjs'],
  target: 'es2020',
})
