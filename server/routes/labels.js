import i18next from 'i18next';

export default (app) => {
  app
    .get('/labels', { name: 'labels' }, async (req, reply) => {
      const labels = await app.objection.models.label.query();
      return reply.render('labels/index', { labels, currentUser: req.user });
    })
    .get('/labels/new', { name: 'newLabel', preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
      return reply.render('labels/new', { label });
    })
    .post('/labels', { preValidation: app.authenticate }, async (req, reply) => {
      const label = new app.objection.models.label();
      label.$set(req.body.data);
      try {
        const validLabel = await app.objection.models.label.fromJson(req.body.data);
        await app.objection.models.label.query().insert(validLabel);
        req.flash('info', i18next.t('flash.labels.create.success'));
        return reply.redirect(app.reverse('labels'));
      } catch (err) {
        req.flash('error', i18next.t('flash.labels.create.error'));
        return reply.render('labels/new', { label: req.body.data, errors: err.data || {} });
      }
    })
    .get('/labels/:id/edit', { name: 'editLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const label = await app.objection.models.label.query().findById(id);
      if (!label) {
        return reply.status(404).send('Status not found');
      }
      return reply.render('labels/edit', { label });
    })
    .patch('/labels/:id', { name: 'updateLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const label = await app.objection.models.label.query().findById(id);
      if (!label) {
        return reply.status(404).send('label not found');
      }
      const updateData = { ...req.body.data };
      try {
        await label.$query().patch(updateData);
        req.flash('info', i18next.t('flash.labels.update.success'));
        return reply.redirect(app.reverse('labels'));
      } catch (err) {
        console.error(err);
        req.flash('error', i18next.t('flash.labels.update.error'));
        const errors = err.data || {};
        const labelWithId = { ...req.body.data, id };
        return reply.render('labels/edit', { label: labelWithId, errors });
      }
    })
    .delete('/labels/:id', { name: 'deleteLabel', preValidation: app.authenticate }, async (req, reply) => {
      const { id } = req.params;
      const label = await app.objection.models.label.query().findById(id);
      const labelsWithTasks = await label.$relatedQuery('tasks').resultSize();
      if (!label) {
        return reply.status(404).send('Status not found');
      }
      if (labelsWithTasks > 0) {
        req.flash('error', i18next.t('flash.labels.delete.taskError'));
        return reply.redirect(app.reverse('labels'));
      }
      try {
        await label.$query().delete();
        req.flash('success', i18next.t('flash.labels.delete.success'));
        return reply.redirect(app.reverse('labels'));
      } catch (err) {
        console.error(err);
        req.flash('error', i18next.t('flash.labels.delete.error'));
        return reply.redirect(app.reverse('labels'));
      }
    });
};
