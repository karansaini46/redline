/* eslint-disable @typescript-eslint/no-require-imports */
require("dotenv").config();
const Redis = require("ioredis");
const redis = new Redis(process.env.UPSTASH_REDIS_URL);
redis
  .flushall()
  .then(() => {
    console.log("Redis flushed!");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
