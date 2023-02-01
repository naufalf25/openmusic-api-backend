const { nanoid } = require('nanoid');
const { Pool } = require('pg');
const AuthorizationError = require('../../exceptions/AuthorizationError');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistsService {
  constructor(collaborationService) {
    this._pool = new Pool();
    this._collaborationService = collaborationService;
  }

  async addPlaylist(name, owner) {
    const id = `playlist-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlists VALUES($1, $2, $3) RETURNING id',
      values: [id, name, owner],
    };

    const result = await this._pool.query(query);
    if (!result.rows[0].id) {
      throw new InvariantError('Playlist gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getPlaylists(owner) {
    const query = {
      text: `SELECT playlists.* FROM playlists
      LEFT JOIN collaborations ON collaborations.playlist_id=playlists.id
      WHERE owner=$1 OR collaborations.user_id=$1
      GROUP BY playlists.id`,
      values: [owner],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async getPlaylistById(id) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id=$1',
      values: [id],
    };

    const result = await this._pool.query(query);
    const playlists = result.rows[0];

    const { username } = await this.getUsernameOwner(playlists.owner);

    return {
      id: playlists.id,
      name: playlists.name,
      username,
    };
  }

  async getUsernameOwner(id) {
    const query = {
      text: 'SELECT username FROM users WHERE id=$1',
      values: [id],
    };
    const result = await this._pool.query(query);

    return result.rows[0];
  }

  async deletePlaylistById(id) {
    const query = {
      text: 'DELETE FROM playlists WHERE id=$1 RETURNING id',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist gagal dihapus, Id tidak ditemukan');
    }
  }

  async verifyPlaylistOwner(id, owner) {
    const query = {
      text: 'SELECT * FROM playlists WHERE id=$1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Playlist tidak ditemukan');
    }

    const playlist = result.rows[0];
    if (playlist.owner !== owner) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }
  }

  async addSongIntoPlaylistId(playlistId, songId) {
    const id = nanoid(16);

    const query = {
      text: 'INSERT INTO playlist_songs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Lagu gagal ditambahkan ke dalam playlist');
    }
  }

  async verifySongById(id) {
    const query = {
      text: 'SELECT * FROM songs WHERE id=$1',
      values: [id],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Gagal menambahkan lagu, Id lagu tidak ditemukan');
    }
  }

  async getSongFromPlaylistId(playlistId) {
    const query = {
      text: 'SELECT song_id FROM playlist_songs WHERE playlist_id=$1',
      values: [playlistId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu tidak ditemukan');
    }

    const songId = [];
    result.rows.forEach((id) => {
      // eslint-disable-next-line camelcase
      const { song_id } = id;
      songId.push(song_id);
    });

    const songQuery = {
      text: 'SELECT id, title, performer FROM songs WHERE id = ANY($1)',
      values: [songId],
    };
    const songResult = await this._pool.query(songQuery);

    return songResult.rows;
  }

  async deleteSongFromPlaylistId(songId) {
    const query = {
      text: 'DELETE FROM playlist_songs WHERE song_id=$1 RETURNING id',
      values: [songId],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('Lagu gagal dihapus, Id tidak ditemukan');
    }
  }

  async verifyPlaylistAccess(playlistId, userId) {
    try {
      await this.verifyPlaylistOwner(playlistId, userId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }

      try {
        await this._collaborationService.verifyCollaborator(playlistId, userId);
      } catch {
        throw error;
      }
    }
  }

  async addPlaylistActivity(playlistId, songId, userId, action) {
    const id = `activity-${nanoid(16)}`;

    const query = {
      text: 'INSERT INTO playlist_song_activities VALUES($1, $2, $3, $4, $5, $6) RETURNING id',
      values: [id, playlistId, songId, userId, action, 'NOW()'],
    };
    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new InvariantError('Gagal mengupdate aktivitas');
    }
  }

  async getPlaylistActivity() {
    const results = await this._pool.query('SELECT * FROM playlist_song_activities');

    const resultMap = results.rows.map(async (result) => {
      const usernameQuery = await this._pool.query(`SELECT username FROM users WHERE id = '${result.user_id}'`);
      const songQuery = await this._pool.query(`SELECT title FROM songs WHERE id = '${result.song_id}'`);

      const { username } = usernameQuery.rows[0];
      const { title } = songQuery.rows[0];

      return {
        username,
        title,
        action: result.action,
        time: result.time,
      };
    });

    const resolvedResult = await Promise.all(resultMap);
    return resolvedResult;
  }
}

module.exports = PlaylistsService;
