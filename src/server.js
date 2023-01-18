require('dotenv').config();

const Hapi = require('@hapi/hapi');
const music = require('./api/music');
const ClientError = require('./exceptions/ClientError');
const MusicService = require('./services/postgres/MusicService');
const MusicValidator = require('./validator/music');

const init = async () => {
  const musicService = new MusicService();

  const server = Hapi.server({
    port: process.env.PORT,
    host: process.env.HOST,
    routes: {
      cors: {
        origin: ['*'],
      },
    },
  });

  await server.register({
    plugin: music,
    options: {
      service: musicService,
      validator: MusicValidator,
    },
  });

  server.ext('onPreResponse', (request, h) => {
    const { response } = request;

    if (response instanceof Error) {
      if (response instanceof ClientError) {
        const newResponse = h.response({
          status: 'fail',
          message: response.message,
        });
        newResponse.code(response.statusCode);
        return newResponse;
      }

      if (!response.isServer) {
        return h.continue;
      }

      const newResponse = h.response({
        status: 'fail',
        message: 'Terjadi kegagalan pada server kami',
      });
      newResponse.code(500);
      console.error(response.message);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server berjalan pada ${server.info.uri}`);
};

init();
