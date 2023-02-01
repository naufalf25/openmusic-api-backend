const AlbumsHandler = require('./handler');
const routes = require('./routes');

module.exports = {
  name: 'openMusic',
  version: '1.0.0',
  register: async (server, { albumsService, storageService, validator }) => {
    const musicHandler = new AlbumsHandler(albumsService, storageService, validator);
    server.route(routes(musicHandler));
  },
};
