const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({ name, year }) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT * FROM albums');
    return result.rows;
  }

  async getAlbumById(id) {
    const query = {
      text: 'SELECT id, name, year FROM albums WHERE id=$1',
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
      songs: songResult.rows,
    };
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name=$2, year=$3 WHERE id=$1 RETURNING id',
      values: [id, name, year],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal memperbarui album, Id tidak ditemukan');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id=$1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }
  }
}

module.exports = AlbumsService;
