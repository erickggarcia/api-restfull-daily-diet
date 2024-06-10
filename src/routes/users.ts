import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import { z } from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function usersRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    try {
      const createUsersBodySchema = z.object({
        name: z.string(),
        lastName: z.string(),
        email: z.string(),
        password: z.string(),
      })

      let { name, lastName, email, password } = createUsersBodySchema.parse(
        request.body,
      )

      async function checkIfUserExists() {
        const user = await knex('users').where('email', email).first()

        return user
      }

      const userexists = await checkIfUserExists()

      if (!userexists) {
        const salt = bcrypt.genSaltSync()
        password = bcrypt.hashSync(password, salt)

        await knex('users').insert({
          id: randomUUID(),
          name,
          lastName,
          email,
          password,
          created_at: new Date().toISOString(),
        })

        return reply.code(201).send({ message: 'usuário criado com sucesso' })
      } else {
        return reply.code(401).send({ message: 'usuário já cadastrado' })
      }
    } catch (e) {
      return reply.code(401).send({ message: 'Erro interno', e })
    }
  })

  app.post('/login', async (request, reply) => {
    try {
      const loginUserBodySchema = z.object({
        email: z.string(),
        password: z.string(),
      })

      const { email, password } = loginUserBodySchema.parse(request.body)

      let sessionId = request.cookies.sessionId

      async function checkIfUserExists() {
        const user = await knex('users').where('email', email).first()

        return user
      }

      const userExists = await checkIfUserExists()

      if (!userExists) {
        return reply.code(401).send({ message: 'Usuário ou senha inválidos' })
      } else {
        if (!bcrypt.compareSync(password, userExists.password)) {
          return reply.code(401).send({ message: 'Usuário ou Senha inválidos' })
        } else {
          sessionId = randomUUID()

          reply.cookie('sessionId', sessionId, {
            path: '/',
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7dias
          })
          await knex('users')
            .where('email', email)
            .update('session_id', sessionId)
          // atualiza o sessionId da sessão

          return reply.code(200).send({ message: 'Usuário logado com sucesso' })
        }
      }
    } catch (e) {
      return reply.code(401).send({ message: 'Erro interno', e })
    }
  })

  app.post(
    '/logout',
    { preHandler: checkSessionIdExists },
    async (_, reply) => {
      try {
        reply.clearCookie('session_id', { path: '/login' })

        return reply.code(200).send({ message: 'Logout bem-sucedido' })
      } catch (e) {
        return reply.code(401).send({ message: 'Erro interno', e })
      }
    },
  )
}
