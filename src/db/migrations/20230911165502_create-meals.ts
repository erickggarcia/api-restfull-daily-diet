import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable('meals', (table) => {
        table.uuid('id').primary()
        table.text('meal_name').notNullable()
        table.text('description')
        table.timestamp('created_at').defaultTo(knex.fn.now).notNullable()
        table.timestamp('updated_at').defaultTo(knex.fn.now)
        table.boolean('inside_diet').notNullable()
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTable('meals')
}

