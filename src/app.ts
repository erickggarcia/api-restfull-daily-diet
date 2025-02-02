import fastify from 'fastify'
import cookie from '@fastify/cookie'
import { usersRoutes } from './routes/user'
import { mealsRoutes } from './routes/meal'

export const app = fastify()
app.register(cookie)

app.register(usersRoutes, {
  prefix: 'user',
})

app.register(mealsRoutes, {
  prefix: 'meal',
})
