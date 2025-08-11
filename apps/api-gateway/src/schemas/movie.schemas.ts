import Joi from 'joi';

/**
 * Schema for movie search query parameters
 */
export const searchSchema = Joi.object({
  title: Joi.string().trim().max(100),
  city: Joi.string().trim().max(50),
  date: Joi.date().iso(),
  language: Joi.string().trim().max(30),
  certificate: Joi.string().trim().max(10),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
}).min(1);

/**
 * Schema for movie details response
 */
export const movieSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  name: Joi.string().required(),
  languages: Joi.array().items(Joi.string()).required(),
  certificate: Joi.string().required(),
  rating: Joi.string(),
  dates: Joi.array().items(Joi.date().iso()).required(),
  poster: Joi.string().allow(null, '')
});

/**
 * Schema for creating a new movie (admin only)
 */
export const createMovieSchema = Joi.object({
  name: Joi.string().required().trim().max(100),
  languages: Joi.array().items(Joi.string().trim().max(30)).required(),
  certificate: Joi.string().required().trim().max(10),
  rating: Joi.string().trim().max(10),
  poster: Joi.string().uri().allow(null, ''),
  dates: Joi.array().items(Joi.date().iso()).min(1).required()
});

/**
 * Schema for updating a movie (admin only)
 */
export const updateMovieSchema = Joi.object({
  name: Joi.string().trim().max(100),
  languages: Joi.array().items(Joi.string().trim().max(30)),
  certificate: Joi.string().trim().max(10),
  rating: Joi.string().trim().max(10),
  poster: Joi.string().uri().allow(null, ''),
  dates: Joi.array().items(Joi.date().iso())
}).min(1);