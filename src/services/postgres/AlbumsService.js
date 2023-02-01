const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const { rows } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return rows[0].id;
  }

  async getAlbums() {
    const { rows } = await this._pool.query('SELECT * FROM albums');
    return rows;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id=$1',
      values: [id],
    };
    const resultQuery = await this._pool.query(query);

    const songQuery = {
      text: 'SELECT * FROM songs WHERE album_id=$1',
      values: [id],
    };
    const songResult = await this._pool.query(songQuery);

    if (!resultQuery.rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }

    const result = resultQuery.rows[0];

    return {
      id: result.id,
      name: result.name,
      year: result.year,
      coverUrl: result.cover ? result.cover : null,
      songs: songResult.rows,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name=$2, year=$3 WHERE id=$1 RETURNING id',
      values: [id, name, year],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal memperbarui album, Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id=$1 RETURNING id',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }

  async addCoverAlbumById(id, fileLocation) {
    const query = {
      text: 'UPDATE albums SET cover=$2 WHERE id=$1 RETURNING id',
      values: [id, fileLocation],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Gagal menambahkan cover, Id tidak ditemukan');
    }
  }

  async likingAlbumById(userId, albumId) {
    const id = `likes-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const { rows } = await this._pool.query(query);

    if (!rows[0].id) {
      throw new InvariantError('Gagal menyukai album');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async unlikingAlbumById(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id=$1 AND album_id=$2 RETURNING id',
      values: [userId, albumId],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Batal menyukai album gagal, Id tidak ditemukan');
    }

    await this._cacheService.delete(`likes:${albumId}`);
  }

  async verifyLikeAlbum(userId, albumId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id=$1 AND album_id=$2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);

    return result;
  }

  async verifyAlbumById(id) {
    const query = {
      text: 'SELECT * FROM albums WHERE id=$1',
      values: [id],
    };

    const { rowCount } = await this._pool.query(query);

    if (!rowCount) {
      throw new NotFoundError('Album tidak ditemukan');
    }
  }

  async getAlbumLikeCount(id) {
    try {
      const result = await this._cacheService.get(`likes:${id}`);
      const rowCount = JSON.parse(result);

      return {
        rowCount,
        cache: true,
      };
    } catch (error) {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id=$1',
        values: [id],
      };

      const { rowCount } = await this._pool.query(query);

      await this._cacheService.set(`likes:${id}`, JSON.stringify(rowCount));
      return {
        rowCount,
      };
    }
  }
}

module.exports = AlbumsService;
