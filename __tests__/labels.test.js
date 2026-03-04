import fastify from 'fastify';
import init from '../server/plugin.js';
import { getTestData, prepareData } from './helpers/index.js';

describe('test labels CRUD', () => {
  let app;
  let knex;
  let models;
  let cookies;
  const testData = getTestData();

  beforeAll(async () => {
    app = fastify({
      exposeHeadRoutes: false,
      logger: { target: 'pino-pretty' },
    });
    await init(app);
    knex = app.objection.knex;
    models = app.objection.models;

    await knex.migrate.latest();
    await prepareData(app);

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/session',
      payload: {
        data: {
          email: testData.users.existing.email,
          password: testData.users.existing.password,
        },
      },
    });
    cookies = loginResponse.headers['set-cookie'];
  });

  const randomLabelName = () => `Label-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

  it('index', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/labels',
      headers: { cookie: cookies },
    });
    expect(response.statusCode).toBe(200);
  });

  it('new', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/labels/new',
      headers: { cookie: cookies },
    });
    expect(response.statusCode).toBe(200);
  });

  it('create', async () => {
    const newLabel = { name: randomLabelName() };
    const response = await app.inject({
      method: 'POST',
      url: '/labels',
      headers: { cookie: cookies },
      payload: { data: newLabel },
    });
    expect(response.statusCode).toBe(302);
    const addedLabel = await models.label.query().findOne({ name: newLabel.name });
    expect(addedLabel).toMatchObject(newLabel);
  });

  it('update', async () => {
    const existingLabel = await models.label.query().first();
    const updatedName = randomLabelName();
    const response = await app.inject({
      method: 'PATCH',
      url: `/labels/${existingLabel.id}`,
      headers: { cookie: cookies },
      payload: { data: { name: updatedName } },
    });
    expect(response.statusCode).toBe(302);
    const updatedLabel = await models.label.query().findById(existingLabel.id);
    expect(updatedLabel.name).toBe(updatedName);
  });

  it('delete without authentication should redirect', async () => {
    const existingLabel = await models.label.query().first();
    const response = await app.inject({
      method: 'DELETE',
      url: `/labels/${existingLabel.id}`,
    });
    expect(response.statusCode).toBe(302);
    const labelAfter = await models.label.query().findById(existingLabel.id);
    expect(labelAfter).toBeTruthy();
  });

  it('delete with authentication should succeed', async () => {
    const existingLabel = await models.label.query().first();
    const response = await app.inject({
      method: 'DELETE',
      url: `/labels/${existingLabel.id}`,
      headers: { cookie: cookies },
    });
    expect(response.statusCode).toBe(302);
    const deletedLabel = await models.label.query().findById(existingLabel.id);
    expect(deletedLabel).toBeFalsy();
  });

  it('should not delete label attached to a task', async () => {
    const status = await models.taskStatus.query().insert({ name: 'Test status' });
    const anyUser = await models.user.query().first();
    const label = await models.label.query().insert({ name: randomLabelName() });

    const task = await models.task.query().insert({
      name: 'Test task',
      statusId: status.id,
      creatorId: anyUser.id,
      executorId: anyUser.id,
    });
    await task.$relatedQuery('labels').relate(label.id);

    const response = await app.inject({
      method: 'DELETE',
      url: `/labels/${label.id}`,
      headers: { cookie: cookies },
    });
    expect(response.statusCode).toBe(302);
    const labelAfter = await models.label.query().findById(label.id);
    expect(labelAfter).toBeDefined();
  });

  afterAll(async () => {
    await app.close();
  });
});
