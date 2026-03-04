const BaseModel = require('./BaseModel.cjs');

module.exports = class Label extends BaseModel {
  static get tableName() {
    return 'labels';
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

  static get relationMappings() {
    return {
      tasks: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: () => require('./Task.cjs'),
        join: {
          from: 'labels.id',
          through: {
            from: 'task_labels.label_id',
            to: 'task_labels.task_id',
          },
          to: 'tasks.id',
        },
      },
    };
  }
};
