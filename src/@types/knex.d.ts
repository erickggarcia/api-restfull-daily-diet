import { Knex } from "knex"

declare module 'knex/types/tables' {
    export interface Tables {
        users: {
            id: string
            name: string
            lastName: string
            email: string
            password: string
            created_at: string
            session_id: string
        },
        meals: {
            id: string
            meal_name: string
            description: string
            created_at: string
            updated_at?: string
            inside_diet: any
            user_id: string
        }
    }
}