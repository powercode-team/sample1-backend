require('dotenv').config();

let app;

if ('production' === process.env.APP_ENV) {
  app = require('./build/app');
} else {
  require('babel-register');
  require('babel-polyfill');
  app = require('./src/app');
}

const PORT = process.env.APP_PORT || 3000;
app.listen(PORT);
console.log('Application started on port ' + PORT);
