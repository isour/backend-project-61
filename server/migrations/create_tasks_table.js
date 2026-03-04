// @ts-check

export const up = (knex) => (
  knex.schema.createTable('tasks', (table) => {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.integer('status_id').notNullable().references('id').inTable('task_statuses');
    table.string('description');
    table.integer('creator_id').notNullable().references('id').inTable('users');
    table.integer('executor_id').nullable().references('id').inTable('users');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  })
);

export const down = (knex) => knex.schema.dropTable('tasks');
