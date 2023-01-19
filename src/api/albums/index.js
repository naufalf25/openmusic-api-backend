const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'openMusic',
  version: '1.0.0',
  register: async (server, { service, validator }) => {
    const musicHandler = new AlbumsHandler(service, validator);
    server.route(routes(musicHandler));
  },
};
