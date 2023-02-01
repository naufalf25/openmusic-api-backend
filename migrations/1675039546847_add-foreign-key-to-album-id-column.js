exports.up = (pgm) => {
  pgm.sql("UPDATE songs SET album_id = 'old_albums' WHERE album_id IS NULL");

  pgm.addConstraint('songs', 'fk_songs.album_songs.id', 'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  pgm.dropConstraint('songs', 'fk_songs.album_songs.id');

  pgm.sql("UPDATE songs SET album_id = NULL WHERE album_id = 'old_albums'");
};
