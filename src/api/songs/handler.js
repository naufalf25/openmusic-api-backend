const autoBind = require('auto-bind');

class SongsHandler {
  constructor(service, validator) {
    this._service = service;
    this._validator = validator;

    autoBind(this);
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

  async getSongsHandler(request) {
    const { title, performer } = request.query;

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

  async putSongByIdHandler(request) {
    this._validator.validateSongPayload(request.payload);
    const { id } = request.params;
    const {
      title,
      year,
      genre,
      performer,
      duration,
      albumId = '-',
    } = request.payload;
    await this._service.editSongById(id, {
      title,
      year,
      genre,
      performer,
      duration,
      albumId,
    });

    return {
      status: 'success',
      message: 'Lagu berhasil diperbarui',
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

module.exports = SongsHandler;
