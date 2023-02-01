const Joi = require('joi');

const CollabrationPayloadSchema = Joi.object({
  playlistId: Joi.string().required(),
  userId: Joi.string().required(),
});

module.exports = { CollabrationPayloadSchema };
