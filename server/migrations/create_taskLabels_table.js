// @ts-check

export const up = (knex) => (
  knex.schema.createTable('task_labels', (table) => {
    table.increments('id').primary();
    table.integer('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.integer('label_id').references('id').inTable('labels').onDelete('CASCADE');
    table.unique(['task_id', 'label_id']);
  })
);

export const down = (knex) => knex.schema.dropTable('task_labels');
