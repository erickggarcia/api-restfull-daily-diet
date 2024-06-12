import { knex as setupKnex, Knex } from 'knex'
import { env } from './env'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not found')
}

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection:
    env.DATABASE_CLIENT !== 'sqlite'
      ? env.DATABASE_URL
      : {
          filename: env.DATABASE_URL,
        },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './src/db/migrations',
  },
}

export const knex = setupKnex(config)
