import { FastifyInstance } from 'fastify'
import z from 'zod'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import { knex } from '../database'
import { randomUUID } from 'crypto'

export async function mealsRoutes(app: FastifyInstance) {
  app.post(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      try {
        const sessionId = request.cookies.sessionId

        const user = await knex('users')
          .where('session_id', sessionId)
          .select('id')
          .first()

        if (!user) {
          return reply.code(401).send({
            message: 'Faça login ou cadastre-se para criar uma refeição',
          })
        }

        const userId = user.id

        const createMealsBodySchema = z.object({
          mealName: z.string(),
          description: z.string(),
          insideDiet: z.boolean(),
        })

        const { mealName, description, insideDiet } =
          createMealsBodySchema.parse(request.body)

        await knex('meals').insert({
          id: randomUUID(),
          meal_name: mealName,
          description,
          inside_diet: insideDiet,
          created_at: new Date().toISOString(),
          updated_at: '',
          user_id: userId,
        })

        return reply.code(201).send({ msg: 'Refeição registrada com sucesso' })
      } catch (e) {
        return reply.code(401).send({ msg: 'um erro ocorreu', e })
      }
    },
  )

  app.get(
    '/',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      try {
        const sessionId = request.cookies.sessionId

        const user = await knex('users')
          .where('session_id', sessionId)
          .select('id')
          .first()

        if (user) {
          const meals = await knex('meals').where('user_id', user.id)

          if (meals.length > 0) {
            return reply
              .code(201)
              .send({ message: 'Refeições registradas: ', meals })
          } else {
            return reply
              .code(401)
              .send({ message: 'Ainda não existem refeições cadastradas' })
          }
        } else {
          return reply.code(401).send({ message: 'Usuário não encontrado' })
        }
      } catch (e) {
        return reply.code(401).send({ msg: 'um erro ocorreu', e })
      }
    },
  )

  app.get(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
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
              user_id: user.id,
              id,
            })
            .first()

          if (meal) {
            return reply.code(201).send({ message: 'Refeição: ', meal })
          } else {
            return reply
              .code(401)
              .send({ message: 'A refeição que você procura não existe' })
          }
        } else {
          return reply.code(401).send({
            message: 'Faça login ou cadastre-se para visual uma refeição',
          })
        }
      } catch (e) {
        return reply.code(401).send({ msg: 'um erro ocorreu', e })
      }
    },
  )

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
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
          mealName: z.string().optional(),
          description: z.string().optional(),
          updated_at: z.string().optional(),
          insideDiet: z.boolean().optional(),
        })

        const { id } = getMealsParamsSchema.parse(request.params)
        const { mealName, description, insideDiet } =
          updateMealsBodySchema.parse(request.body)

        if (user) {
          const meal = await knex('meals')
            .where({
              user_id: user.id,
              id,
            })
            .first()
            .update({
              meal_name: mealName,
              description,
              inside_diet: insideDiet,
              updated_at: new Date().toISOString(),
            })

          return reply
            .code(201)
            .send({ message: 'Refeição alterada com sucesso: ', meal })
        } else {
          return reply
            .code(401)
            .send({ message: 'A refeição que você procura não existe' })
        }
      } catch (e) {
        return reply.code(401).send({ msg: 'um erro ocorreu', e })
      }
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
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
              user_id: user.id,
              id,
            })
            .first()
            .delete()

          return reply
            .code(201)
            .send({ message: 'Refeição deletada com sucesso' })
        } else {
          return reply
            .code(401)
            .send({ message: 'A refeição que você procura não existe' })
        }
      } catch (e) {
        return reply.code(401).send({ msg: 'um erro ocorreu', e })
      }
    },
  )

  app.get(
    '//summary',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
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
          const mealsOutsideDiet = meals.filter(
            (meal) => meal.inside_diet === 0,
          )

          let currentSequence: Array<object> = []
          let bestSequence: Array<object> = []

          for (const meal of meals) {
            if (meal.inside_diet === 1) {
              currentSequence.push(meal)
            } else {
              currentSequence = []
            }

            if (currentSequence.length > bestSequence.length) {
              bestSequence = [...currentSequence]
            }
          }

          return reply.code(201).send({
            totalMeals: meals.length,
            totalMealsInsideDiet: mealsInsideDiet.length,
            totalMealsOutSideDiet: mealsOutsideDiet.length,
            bestSequenceOfMeals: bestSequence,
          })
        } else {
          return reply
            .code(401)
            .send({ message: 'Ainda não existem refeições cadastradas' })
        }
      } catch (e) {
        return reply.code(401).send({ msg: 'um erro ocorreu', e })
      }
    },
  )
}
