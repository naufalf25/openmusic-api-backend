const routes = (handler) => [
  {
    method: 'POST',
    path: '/export/playlists/{playlistId}',
    handler: handler.postExportSongsHandler,
    options: {
      auth: 'playlist_jwt',
    },
  },
];

module.exports = routes;
