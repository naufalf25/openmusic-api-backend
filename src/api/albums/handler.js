const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(albumsService, storageService, validator) {
    this._albumsService = albumsService;
    this._storageService = storageService;
    this._validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this._validator.validateAlbumPayload(request.payload);
    const { name = 'untitled', year } = request.payload;
    const albumId = await this._albumsService.addAlbum({ name, year });

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });
    response.code(201);
    return response;
  }

  async getAlbumsHandler() {
    const albums = await this._albumsService.getAlbums();
    return {
      status: 'success',
      data: {
        albums,
      },
    };
  }

  async getAlbumByIdHandler(request) {
    const { id } = request.params;
    const album = await this._albumsService.getAlbumById(id);
    return {
      status: 'success',
      data: {
        album,
      },
    };
  }

  async putAlbumByIdHandler(request) {
    this._validator.validateAlbumPayload(request.payload);
    const { id } = request.params;
    await this._albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this._albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postUploadCoverHandler(request, h) {
    const { id } = request.params;
    const { cover } = request.payload;
    this._validator.validateImageHeaders(cover.hapi.headers);

    const fileLocation = await this._storageService.writeFile(cover, cover.hapi);

    await this._albumsService.addCoverAlbumById(id, fileLocation);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postLikeAndDislikeAlbumHandler(request, h) {
    const { id } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this._albumsService.verifyAlbumById(id);

    const { rowCount } = await this._albumsService.verifyLikeAlbum(credentialId, id);

    let response;
    if (rowCount) {
      await this._albumsService.unlikingAlbumById(credentialId, id);

      response = h.response({
        status: 'success',
        message: 'Membatalkan menyukai album berhasil',
      });
    } else {
      await this._albumsService.likingAlbumById(credentialId, id);

      response = h.response({
        status: 'success',
        message: 'Menyukai album berhasil',
      });
    }
    response.code(201);
    return response;
  }

  async getAlbumLikeCountHandler(request, h) {
    const { id } = request.params;
    const likes = await this._albumsService.getAlbumLikeCount(id);

    const response = h.response({
      status: 'success',
      data: {
        likes: likes.rowCount,
      },
    });

    if (likes.cache) {
      response.header('X-Data-Source', 'cache');
    }
    return response;
  }
}

module.exports = AlbumsHandler;
