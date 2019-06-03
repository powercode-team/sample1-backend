import serve from 'koa-static';
import mount from 'koa-mount';
import log from 'koa-logger';
import cors from '@koa/cors';
import {routes as AuthRoutes} from './routes/auth';
import {routes as I18nRoutes} from './routes/i18n';

import errorMiddleware from './middlewares/error';
import i18nMiddleware from './middlewares/i18n';
import QueueListener from './listeners/QueueListener';

const Koa = require('koa');
const helmet = require('koa-helmet');
const koaBody = require('koa-body');
const koaQueryString = require('koa-qs');
const app = new Koa();

app.use(helmet());
app.use(helmet.noCache());

app.use(errorMiddleware);
app.use(i18nMiddleware);

const headers = ['authorization', 'accept', 'application-id', 'application-language', 'content-type'];
app.use(
  cors({
    exposeHeaders: headers,
    allowHeaders: headers,
    credentials: true,
    keepHeadersOnError: false,
  }),
);

if (process.env.APP_ENV !== 'production') {
  app.use(log());
}

koaQueryString(app, 'extended');
app.use(
  koaBody({
    multipart: true,
  }),
);

app.use(mount('/docs/', serve('./docs')));

app.use(I18nRoutes());

app.use(ReportsRoutes());
app.use(AuthRoutes());

(async function() {
  try {
    await new QueueListener().run();
  } catch (e) {
    console.log('Processing of queue not working :(');
  }
})();

module.exports = app;
