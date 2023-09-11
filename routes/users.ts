import { FastifyInstance } from "fastify"
import { knex } from "../src/database"
import { randomUUID } from "node:crypto"
import bcrypt from 'bcrypt'
import { z } from "zod"

export async function usersRoutes(app: FastifyInstance) {

    app.post('/register', async (request, reply) => {
        try {

            const createUsersBodySchema = z.object({
                name: z.string(),
                lastName: z.string(),
                email: z.string(),
                passwordRequest: z.string(),
            })

            const { name, lastName, email, passwordRequest } = createUsersBodySchema.parse(request.body)

            async function checkIfUserExists() {
                const user = await knex('users')
                    .where('email', email)
                    .first()

                return user
            }

            const userexists = await checkIfUserExists()

            if (!userexists) {
                const salt = bcrypt.genSaltSync()
                const password = bcrypt.hashSync(passwordRequest, salt)

                await knex('users')
                    .insert({
                        id: randomUUID(),
                        name,
                        lastName,
                        email,
                        password,
                        created_at: new Date().toISOString()
                    })

                return reply.status(201).send({ message: 'usuário criado com sucesso' })
            } else {
                return reply.status(400).send({ message: 'usuário já cadastrado' })
            }
        } catch (e) {
            return reply.status(500).send({ message: 'Erro interno', e })
        }
    })

    app.post('/login', async (request, reply) => {

        try {

            const loginUserBodySchema = z.object({
                email: z.string(),
                passwordRequest: z.string()
            })

            const { email, passwordRequest } = loginUserBodySchema.parse(request.body)

            let sessionId = request.cookies.sessionId

            if (!sessionId) {
                sessionId = randomUUID()

                reply.cookie('sessionId', sessionId, {
                    path: '/login',
                    maxAge: 1000 * 60 * 60 * 24 * 7 // 7dias
                })
            }

            async function checkIfUserExists() {
                const user = await knex('users')
                    .where('email', email)
                    .first()

                return user
            }

            // atualiza o sessionId da sessão
            await knex('users')
                .where('email', email)
                .update('session_id', sessionId)


            const userExists = await checkIfUserExists()
            console.log(userExists)

            if (!userExists) {
                return reply.status(400).send({ message: 'Usuário ou senha inválidos' })
            } else {
                if (!bcrypt.compareSync(passwordRequest, userExists.password)) {
                    return reply.status(400).send({ message: 'Usuário ou Senha inválidos' })
                } else {
                    return reply.status(200).send({ message: 'Usuário logado com sucesso' })
                }
            }
        } catch (e) {
            return reply.status(500).send({ message: 'Erro interno', e })
        }
    })

    app.post('/logout', async (request, reply) => {
        try {
            reply.clearCookie('session_id', { path: '/login' })

            return reply.status(200).send({ message: 'Logout bem-sucedido' })
        } catch (e) {
            return reply.status(500).send({ message: 'Erro interno', e })
        }
    })

    app.get('/meals', async (request, reply) => {
        return 'meals'
    })

    app.post('/meals', async (request, reply) => {
        return 'meals'
    })
}