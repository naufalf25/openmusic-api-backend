const config = {
  server: {
    host: process.env.HOST,
    port: process.env.PORT,
  },
  token: {
    accessTokenKey: process.env.ACCESS_TOKEN_KEY,
    refreshTokenKey: process.env.REFRESH_TOKEN_KEY,
    accessTokenAge: process.env.ACCESS_TOKEN_AGE,
  },
  rabbitMq: {
    server: process.env.RABBITMQ_SERVER,
  },
  S3: {
    bucketName: process.env.AWS_BUCKET_NAME,
  },
  redis: {
    server: process.env.REDIS_SERVER,
  },
};

module.exports = config;
