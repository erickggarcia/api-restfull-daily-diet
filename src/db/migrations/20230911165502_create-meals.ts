import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('meals', (table) => {
    table.uuid('id').primary()
    table.text('meal_name').notNullable()
    table.text('description')
    table.decimal('created_at', 10, 2).notNullable()
    table.decimal('updated_at', 10, 2)
    table.boolean('inside_diet').notNullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('meals')
}
