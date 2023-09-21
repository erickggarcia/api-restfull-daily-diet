/* eslint-disable camelcase */
import { FastifyInstance } from "fastify"
import { knex } from "../src/database"
import { randomUUID } from "node:crypto"
import bcrypt from 'bcrypt'
import { z } from "zod"
import { checkSessionIdExists } from '../src/middlewares/check-session-id-exists'

export async function usersRoutes(app: FastifyInstance) {

    app.post('/register', async (request, reply) => {
        try {

            const createUsersBodySchema = z.object({
                name: z.string(),
                lastName: z.string(),
                email: z.string(),
                password: z.string(),
            })

            let { name, lastName, email, password } = createUsersBodySchema.parse(request.body)

            async function checkIfUserExists() {
                const user = await knex('users')
                    .where('email', email)
                    .first()

                return user
            }

            const userexists = await checkIfUserExists()

            if (!userexists) {
                const salt = bcrypt.genSaltSync()
                password = bcrypt.hashSync(password, salt)

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
                password: z.string()
            })

            const { email, password } = loginUserBodySchema.parse(request.body)

            let sessionId = request.cookies.sessionId

            async function checkIfUserExists() {
                const user = await knex('users')
                    .where('email', email)
                    .first()

                return user
            }

            const userExists = await checkIfUserExists()

            if (!userExists) {
                return reply.status(400).send({ message: 'Usuário ou senha inválidos' })
            } else {
                if (!bcrypt.compareSync(password, userExists.password)) {
                    return reply.status(400).send({ message: 'Usuário ou Senha inválidos' })
                } else {
                    if (!sessionId) {
                        sessionId = randomUUID()

                        reply.cookie('sessionId', sessionId, {
                            path: '/',
                            maxAge: 1000 * 60 * 60 * 24 * 7 // 7dias
                        })
                        await knex('users')
                            .where('email', email)
                            .update('session_id', sessionId)

                    } else {
                        sessionId = randomUUID()
                        reply.cookie('sessionId', sessionId, {
                            path: '/',
                            maxAge: 1000 * 60 * 60 * 24 * 7 // 7dias
                        })
                        // atualiza o sessionId da sessão
                        await knex('users')
                            .where('email', email)
                            .update('session_id', sessionId)


                        return reply.status(200).send({ message: 'Usuário logado com sucesso' })
                    }
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

    app.post('/meals', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        try {

            const sessionId = request.cookies.sessionId

            const user = await knex('users')
                .where('session_id', sessionId)
                .select('id')
                .first()

            if (!user) {
                return reply.status(401).send({ message: 'Faça login ou cadastre-se para criar uma refeição' })
            }

            const userId = user.id

            const createMealsBodySchema = z.object({
                meal_name: z.string(),
                description: z.string(),
                inside_diet: z.boolean()
            })

            const { meal_name, description, inside_diet } = createMealsBodySchema.parse(request.body)

            await knex('meals')
                .insert({
                    id: randomUUID(),
                    meal_name,
                    description,
                    inside_diet,
                    created_at: new Date().toISOString(),
                    updated_at: '',
                    user_id: userId
                })

            return reply.status(200).send({ msg: 'Refeição registrada com sucesso' })

        } catch (e) {
            return reply.status(500).send({ msg: 'um erro ocorreu', e })
        }
    })


    app.get('/meals', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        try {
            const sessionId = request.cookies.sessionId

            const user = await knex('users')
                .where('session_id', sessionId)
                .select('id')
                .first()

            if (user) {
                const meals = await knex('meals')
                    .where('user_id', user.id)

                return reply.status(200).send({ message: 'Refeições registradas: ', meals })
            } else {
                return reply.status(500).send({ message: 'Ainda não existem refeições cadastradas' })
            }

        } catch (e) {
            return reply.status(500).send({ msg: 'um erro ocorreu', e })
        }

    })

    app.get('/meals/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        try {
            const sessionId = request.cookies.sessionId

            const user = await knex('users')
                .where('session_id', sessionId)
                .select('id')
                .first()

            const getMealsParamsSchema = z.object({
                id: z.string().uuid(),
            })

            const { id } = getMealsParamsSchema.parse(request.params)

            if (user) {
                const meal = await knex('meals')
                    .where({
                        'user_id': user.id,
                        id
                    }).first()


                if (meal) {
                    return reply.status(200).send({ message: 'Refeição: ', meal })
                } else {
                    return reply.status(500).send({ message: 'A refeição que você procura não existe' })
                }

            } else {
                return reply.status(500).send({ message: 'Faça login ou cadastre-se para visual uma refeição' })
            }

        } catch (e) {
            return reply.status(500).send({ msg: 'um erro ocorreu', e })
        }

    })

    app.put('/meals/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        try {
            const sessionId = request.cookies.sessionId

            const user = await knex('users')
                .where('session_id', sessionId)
                .select('id')
                .first()

            const getMealsParamsSchema = z.object({
                id: z.string().uuid(),
            })

            const updateMealsBodySchema = z.object({
                meal_name: z.string().optional(),
                description: z.string().optional(),
                updated_at: z.string().optional(),
                inside_diet: z.boolean().optional()
            })

            const { id } = getMealsParamsSchema.parse(request.params)
            const { meal_name, description, inside_diet } = updateMealsBodySchema.parse(request.body)

            if (user) {
                const meal = await knex('meals')
                    .where({
                        'user_id': user.id,
                        id
                    })
                    .first()
                    .update({
                        meal_name,
                        description,
                        inside_diet,
                        updated_at: new Date().toISOString()
                    })

                return reply.status(200).send({ message: 'Refeição alterada com sucesso: ', meal })

            } else {
                return reply.status(500).send({ message: 'A refeição que você procura não existe' })
            }

        } catch (e) {
            return reply.status(500).send({ msg: 'um erro ocorreu', e })
        }

    })

    app.delete('/meals/:id', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        try {
            const sessionId = request.cookies.sessionId

            const user = await knex('users')
                .where('session_id', sessionId)
                .select('id')
                .first()

            const getMealsParamsSchema = z.object({
                id: z.string().uuid(),
            })


            const { id } = getMealsParamsSchema.parse(request.params)

            if (user) {
                await knex('meals')
                    .where({
                        'user_id': user.id,
                        id
                    })
                    .first()
                    .delete()

                return reply.status(200).send({ message: 'Refeição deletada com sucesso' })

            } else {
                return reply.status(500).send({ message: 'A refeição que você procura não existe' })
            }

        } catch (e) {
            return reply.status(500).send({ msg: 'um erro ocorreu', e })
        }
    })

    app.get('/meals/summary', { preHandler: [checkSessionIdExists] }, async (request, reply) => {
        try {
            const sessionId = request.cookies.sessionId

            const user = await knex('users')
                .where('session_id', sessionId)
                .select('id')
                .first()


            if (user) {
                const meals = await knex('meals')
                    .where('user_id', user.id)
                    .orderBy('created_at')

                const mealsInsideDiet = meals.filter((meal) => meal.inside_diet === 1)
                const mealsOutsideDiet = meals.filter((meal) => meal.inside_diet === 0)

                let currentSequence: Array<object> = []
                let bestSequence: Array<object> = []

                for (const meal of meals) {
                    if (meal.inside_diet === 1) {
                        currentSequence.push(meal);
                    } else {
                        currentSequence = []
                    }

                    if (currentSequence.length > bestSequence.length) {
                        bestSequence = [...currentSequence]
                    }
                }

                return reply.status(200).send({ totalMeals: meals.length, totalMealsInsideDiet: mealsInsideDiet.length, totalMealsOutSideDiet: mealsOutsideDiet.length, bestSequenceOfMeals: bestSequence })
            } else {
                return reply.status(500).send({ message: 'Ainda não existem refeições cadastradas' })
            }

        } catch (e) {
            return reply.status(500).send({ msg: 'um erro ocorreu', e })
        }

    })
}