'use strict';

const mock = require('egg-mock');

describe('test/moon-static.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/moon-static-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, moonStatic')
      .expect(200);
  });
});
