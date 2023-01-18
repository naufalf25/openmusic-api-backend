const autoBind = require('auto-bind');

class MusicHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name = 'untitled', year } = request.payload;
    const albumId = await this._service.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async postSongHandler(request, h) {
    this._validator.validateSongPayload(request.payload);
    const {
      title = 'untitled',
      year,
      genre,
      performer,
      duration,
      albumId = '-',
    } = request.payload;
    const songId = await this._service.addSong({
      title,
      year,
      performer,
      genre,
      duration,
      albumId,
    });

    const response = h.response({
      status: 'success',
      data: {
        songId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler() {
    const albums = await this._service.getAlbums();
    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getSongsHandler(request) {
    const { title, performer } = request.query;
    console.log(title, performer);

    const Allsong = await this._service.getSongs();

    if (title && performer) {
      const filteredSongs = Allsong.filter((song) => {
        const titleSong = song.title.toLowerCase();
        const performerSong = song.performer.toLowerCase();
        const titleSearch = title.toLowerCase();
        const performerSearch = performer.toLowerCase();

        return titleSong.includes(titleSearch) && performerSong.includes(performerSearch);
      });

      return {
        status: 'success',
        data: {
          songs: filteredSongs.map((song) => ({
            id: song.id,
            title: song.title,
            performer: song.performer,
          })),
        },
      };
    }

    if (title) {
      const filteredSongs = Allsong.filter((song) => {
        const titleSong = song.title.toLowerCase();
        const titleSearch = title.toLowerCase();

        return titleSong.includes(titleSearch);
      });

      return {
        status: 'success',
        data: {
          songs: filteredSongs.map((song) => ({
            id: song.id,
            title: song.title,
            performer: song.performer,
          })),
        },
      };
    }

    if (performer) {
      const filteredSongs = Allsong.filter((song) => {
        const performerSong = song.performer.toLowerCase();
        const performerSearch = performer.toLowerCase();

        return performerSong.includes(performerSearch);
      });

      return {
        status: 'success',
        data: {
          songs: filteredSongs.map((song) => ({
            id: song.id,
            title: song.title,
            performer: song.performer,
          })),
        },
      };
    }

    return {
      status: 'success',
      data: {
        songs: Allsong.map((song) => ({
          id: song.id,
          title: song.title,
          performer: song.performer,
        })),
      },
    };
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._service.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async getSongByIdHandler(request) {
    const { id } = request.params;
    const song = await this._service.getSongById(id);
    return {
      status: 'success',
      data: {
        song,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    await this._service.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async putSongByIdHandler(request) {
    this._validator.validateSongPayload(request.payload);
    const { id } = request.params;
    await this._service.editSongById(id, request.payload);

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async deleteSongByIdHandler(request) {
    const { id } = request.params;
    await this._service.deleteSongById(id);

    return {
      status: 'success',
      message: 'Lagu berhasil dihapus',
    };
  }
}

module.exports = MusicHandler;
