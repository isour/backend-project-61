// @ts-check
const objectionUnique = require('objection-unique');
const BaseModel = require('./BaseModel.cjs');

const unique = objectionUnique({ fields: ['name'] });
const Mixin = unique(BaseModel);
module.exports = class TaskStatus extends Mixin {
  static get tableName() {
    return 'task_statuses';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', minLength: 1 },
      },
    };
  }
};
