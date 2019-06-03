require('dotenv').config();

const config = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || 0,
};

if (process.env.REDIS_PASS) {
  config.password = process.env.REDIS_PASS;
}

export default config;
